# Tasky — full-stack starter template

A Turborepo monorepo meant to be the starting point for new projects: a React SPA, a Fastify API and a
Postgres database, wired together with shared, typed contracts.

| Layer    | Stack                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, shadcn/ui (Base UI), `@repo/state-manager` |
| Backend  | Fastify 5, Zod (`fastify-type-provider-zod`), pino, Swagger                |
| Database | Postgres 18 (Docker), Drizzle ORM                                          |
| Tooling  | Turborepo, npm workspaces, TypeScript 6 (no build step), ESLint, Prettier  |

TypeScript is never compiled for the backend: Node ≥ 24 runs `.ts` files directly through type stripping, and
Vite bundles the frontend. Hence the `erasableSyntaxOnly` / `allowImportingTsExtensions` compiler options and
the explicit `.ts` extensions in backend imports (no enums, no parameter properties, no namespaces).

---

## Repository layout

```
apps/
  api/                 Fastify backend
  web/                 React SPA
packages/
  config/              Shared tsconfig + ESLint presets
  database/            Drizzle tables, relations, seed, docker compose, drizzle-kit config
  dtos/                Zod schemas + types shared by API and web (the HTTP contract)
  lib/                 Framework-agnostic helpers (dates via Temporal, object utils)
  state-manager/       Typed React store (zustand + immer) used by the web app
```

### Dependency rules

```
web ──► dtos ──► lib
 │                ▲
 └──► state-manager
api ──► dtos, lib, database ──► lib
```

- `dtos` and `lib` must stay runtime-agnostic (no Node or DOM APIs) because both apps import them.
- `database` is imported **only** by the API's providers. Nothing in `operations/` imports Drizzle.
- The web app never imports `database` or anything from `apps/api`.

---

## Getting started

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# packages/database/.env needs DATABASE_URL (same value as the API)

npm run db:start  -w @repo/database   # Postgres in Docker on 127.0.0.1:5432
npm run db:push   -w @repo/database   # sync schema (or db:generate + db:migrate)
npm run db:seed   -w @repo/database   # demo user: a@b.com / 123

npm start                             # api on http://localhost:3000 (Swagger at /swagger), web on http://localhost:4000
```

### Scripts

Run from the root; Turborepo runs the matching script in every workspace that defines it.

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `npm start`         | Starts the API and the web dev server                             |
| `npm run build`     | Typechecks, then builds the web app into `apps/web/dist`          |
| `npm run lint`      | ESLint in every workspace (shared preset in `packages/config`)    |
| `npm run typecheck` | `tsc` in every workspace                                          |
| `npm test`          | Vitest in every workspace that has tests (today: `state-manager`) |

Tests live next to the code as `*.test.ts(x)`. React tests use Testing Library with jsdom; see
`packages/state-manager/src/testing/fixtures.tsx` for the shared test store and helpers.

Add `--filter=@repo/<name>` to run a single workspace, e.g. `npx turbo run lint --filter=@repo/api`.

`lint`, `typecheck` and `build` depend on the `transit` task: it does nothing, but it makes Turborepo
invalidate a workspace's cache when a workspace it imports changes. Since `packages/*` export TypeScript
sources, that is what keeps type-aware results correct.

Every workspace has its own `eslint.config.js` that extends `@repo/config/eslint.base.ts`, adding Node or
browser globals (and the React Hooks / React Refresh plugins for React code).

### Environment variables

| App | Variable       | Purpose                                 |
| --- | -------------- | --------------------------------------- |
| api | `PORT`         | HTTP port                               |
| api | `NODE_ENV`     | `development` \| `production` \| `test` |
| api | `DATABASE_URL` | Postgres connection string              |
| api | `WEB_URL`      | Allowed CORS origin (the web app URL)   |
| web | `VITE_API_URL` | Base URL of the API                     |

The API validates its environment with Zod at startup (`EnvProvider`) and exits if anything is missing.

---

## Backend (`apps/api`)

### Layers

```
src/
  main.ts          Composition root: instantiates every provider and injects dependencies
  config/          Constants (auth, swagger, HTTP errors)
  lib/             Pure helpers (crypto, json)
  operations/      Business logic — framework- and library-free
  providers/       Infrastructure behind classes (http, database, auth, cache, log, env)
```

**Operations** hold the business rules. They are plain functions that receive their input, the current user,
and the providers they need:

```ts
export async function searchTaskOccurrences(args, user: User, providers: Pick<Providers, "db">) { ... }
```

- They work with domain types from `operations/types.operation.ts`, never with DB rows or DTOs.
- They declare the narrowest set of providers they need with `Pick<Providers, ...>`, which keeps them
  easy to test with fakes.
- They must not import Fastify, Drizzle, pino, Zod, etc.

**Providers** are classes that hide a library behind a stable API. Swapping a library (in-memory cache →
Redis, session auth → Supabase) means rewriting one provider; operations do not change.

| Provider           | Wraps                    | Current implementation             | Planned       |
| ------------------ | ------------------------ | ---------------------------------- | ------------- |
| `EnvProvider`      | `process.env` + Zod      | —                                  | —             |
| `LogProvider`      | pino                     | pino-pretty in dev, JSON otherwise | —             |
| `CacheProvider`    | key/value store with TTL | in-memory object                   | Redis         |
| `DatabaseProvider` | Drizzle + node-postgres  | `client` + named `queries`         | —             |
| `AuthProvider`     | sessions                 | DB sessions + scrypt hashes        | Supabase Auth |
| `HttpProvider`     | Fastify + plugins        | —                                  | —             |

Providers receive their own dependencies through the constructor (`new AuthProvider({ db, cache })`). All
wiring happens in `main.ts` — there is no DI container.

**Adapters** translate between layers and live next to the provider that owns the foreign shape:

- `providers/database/adapters.database.ts`: DB row → domain type
- `providers/http/adapters.http.ts`: domain type → DTO

**Queries** (`providers/database/queries.database.ts`) are the only place that builds Drizzle queries for
operations. Each query returns domain types, so operations never see rows.

### Request flow

```
HTTP request
  → Fastify plugins (helmet, rate-limit, CORS, cookies, formbody)
  → preHandler: auth check unless the route is isPublic, sets request.user
  → Zod validation of body/query/params (schemas from @repo/dtos)
  → route handler (routes.http.ts): unpacks the request, calls an operation
  → operation → providers.db.queries.* → domain objects
  → adapters.http.ts maps domain → DTO
  → Zod serialization of the response
```

### Adding an endpoint

1. Add request/response schemas to `packages/dtos/src/<feature>.dto.ts` and export them from `index.ts`.
2. Add any DB access as a named query in `queries.database.ts` (plus a row → domain adapter).
3. Write the business logic in `operations/<feature>.operation.ts`.
4. Register the route in `routes.http.ts` with `defineRoute({ method, isPublic, schemas, handler })`.
   The handler receives typed `body`, `queryParams`, `pathParams`, `cookies` and `user` (non-null when
   `isPublic: false`) and returns `{ body, status?, cookies? }`.
5. Add a client function in `apps/web/src/lib/api.lib.ts` and a query/mutation in the store. Read
   functions take an optional `signal?: AbortSignal` that is passed to `sendRequest`, and store queries
   pass `state.signal` to them (see _State_ below).

### Errors

Throw an `HTTPError` subclass from `config/errors.ts` (`HTTPBadRequestError`, `HTTPNotFoundError`, …) in route
handlers; Fastify reads its `statusCode`. Providers and operations throw their own domain errors
(e.g. `InvalidCredentialsError`) and the route maps them to HTTP errors — lower layers don't know about HTTP.

### Cache keys

Cache keys are typed. Declare each prefix, its key parts and its value type in `CacheMap`, and its TTL in
`CACHE_PREFIX_TO_TTL_S`:

```ts
export type CacheMap = {
  "login-attempts": { parts: [username: string]; value: number };
};
await cache.increment("login-attempts", [username]);
```

---

## Database (`packages/database`)

- `src/tables.ts`: Drizzle tables. Exported table objects are prefixed with `db` (`dbUsers`,
  `dbTaskTemplates`) so they never clash with domain types of the same name.
- Every table spreads `generateSharedColumns()`: UUID `id`, `createdAt`, `updatedAt`.
- SQL names are `snake_case`, TS names are `camelCase`.
- `localTimestamp` is a custom column for wall-clock times without a time zone, stored as `timestamp` and
  read back as a `LocalISO` string (`2026-10-19T09:00:00`).
- `src/relations.ts`: Drizzle relations (v1 `defineRelations` API) used by `db.query.*.findMany({ with })`.
- `src/seed.ts`: idempotent seed (`onConflictDoNothing`) with fixed UUIDs. **Development only.**

### Dates and time zones

Recurring tasks are defined in local wall-clock time (`LocalISO`, no offset) and expanded into occurrences
for a given IANA time zone at request time. All date arithmetic goes through `@repo/lib` (Temporal
polyfill), so DST transitions are handled correctly. Never use `Date` math for local times.

---

## Frontend (`apps/web`)

### Component layers

```
src/components/
  base/        Atoms. shadcn/ui primitives: Button, Input, Card, Field…
  blocks/      Presentational components composed of base atoms
  containers/  Connected to the store; feed data and callbacks into blocks
  pages/       One per route; composes containers and blocks into a layout
```

| Layer        | May import                        | Store access | Owns data fetching | Example              |
| ------------ | --------------------------------- | ------------ | ------------------ | -------------------- |
| `base`       | other `base`, `cn`                | ❌           | ❌                 | `button.tsx`         |
| `blocks`     | `base`, other `blocks`, DTO types | ❌           | ❌                 | `LoginForm.tsx`      |
| `containers` | `blocks`, `base`, store, `lib`    | ✅           | ✅                 | `LoginContainer.tsx` |
| `pages`      | `containers`, `blocks`, `base`    | ❌ (prefer)  | ❌                 | `HomePage.tsx`       |

Rules:

- Imports only go **down** the table. A block never imports a container; a base component never imports a
  block.
- Blocks are pure: everything comes in through props, events go out through callbacks. They can be
  rendered in isolation (Storybook, tests) without a store.
- Containers contain no markup of their own beyond what is needed to connect a block (no styling).
- Pages are the only components referenced from `config/routes.ts`.
- `base/` is owned by the shadcn CLI: file names are kebab-case (`button.tsx`); add components with
  `npx shadcn add <name>` from `apps/web`. Every other layer uses PascalCase file names that match the
  exported component.

### Other folders

```
src/
  config/routes.ts   Route table: path → { component, isPublic }
  config/store.ts    Global store: state, getters, setters, queries, mutations
  lib/api.lib.ts     Typed HTTP client, one function per endpoint, types from @repo/dtos
  lib/env.lib.ts     Typed access to import.meta.env
  lib/routes.lib.ts  Navigation helpers
  components/Router.tsx  Resolves the current route and guards private routes
```

### State (`@repo/state-manager`)

The global store is declared once in `config/store.ts`:

- **getters**: read derived values (`tasks`, `user`)
- **setters**: synchronous immer updates (`setTasks`)
- **queries**: async reads, started automatically when a component requests them, deduplicated by
  name + args, aborted when no component uses them anymore. Once aborted, a query's setters do nothing,
  so a late response never overwrites newer state. That protects the state, but the HTTP request keeps
  running unless the query forwards `signal` to `fetch`, so **every query passes `state.signal` to its API
  call**:

  ```ts
  searchTasks: async (state, body: SearchTasksRequest) => {
    state.setTaskOccurrences(await searchTasks(body, state.signal));
  },
  ```

  Mutations get no signal on purpose: a save or a login should finish even if the component unmounts.

- **mutations**: async writes triggered by the user, with `status`/`error` on the returned function

Containers request what they need by name:

```tsx
<GlobalConsumer getters={["tasks"]} queries={[{ name: "searchTasks", args: [range] }]} loader={<Spinner />}>
  {({ tasks }) => <TaskList tasks={tasks} />}
</GlobalConsumer>
```

See [packages/state-manager/README.md](packages/state-manager/README.md) for the full API.

### Routing and auth

`Router.tsx` looks up `window.location.pathname` in `config/routes.ts`. Private routes wait for the
`fetchMe` query and redirect to `/login` when there is no user. Auth relies on an `httpOnly` session cookie
set by the API, so every request uses `credentials: "include"`.

---

## Conventions

Naming, function style, file structure and file naming rules are in [CONVENTIONS.md](CONVENTIONS.md).
Read it before adding code.

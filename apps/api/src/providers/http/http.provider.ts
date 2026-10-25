import fastifyCookie, { type FastifyCookieOptions } from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyFormbody from "@fastify/formbody";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify, { type RouteOptions } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { AUTH_COOKIE_NAME } from "../../config/auth.ts";
import { asError, HTTP_STATUS_CODES, HTTPUnauthorizedError } from "../../config/errors.ts";
import { swaggerConfig, swaggerUIConfig } from "../../config/swagger.ts";
import type { Providers } from "../types.provider.ts";
import { defineRoutes } from "./routes.http.ts";
import type { HttpRoute, RouteSchemas } from "./types.http.ts";

export class HttpProvider {
  readonly server;
  private providers;

  constructor(providers: Providers) {
    this.server = Fastify({
      loggerInstance: providers.log.logger,
    }).withTypeProvider<ZodTypeProvider>();

    this.providers = providers;
  }

  async start() {
    await this.registerPlugins();
    this.registerHooks();
    this.registerRoutes(defineRoutes(this.providers));

    this.server.setNotFoundHandler((request, reply) => {
      this.providers.log.error("unhandled routes " + request.url);
      // this.providers.log.info(JSON.stringify(request.body));
      return reply.code(404).send({ error: "Route not found" });
    });

    try {
      await this.server.ready();
      const host = this.providers.env.get("NODE_ENV") === "production" ? "0.0.0.0" : "localhost";
      await this.server.listen({ port: this.providers.env.get("PORT"), host });
    } catch (err) {
      this.providers.log.error(err);
      process.exit(1);
    }
  }

  async stop() {
    await this.server.close();
  }

  async registerPlugins() {
    this.server.setValidatorCompiler(validatorCompiler);
    this.server.setSerializerCompiler(serializerCompiler);

    await this.server.register(fastifyHelmet);
    await this.server.register(fastifyRateLimit, {
      store: this.createRateLimitStore(),
      max: 50,
      timeWindow: "1 minute",
    });

    await this.server.register(fastifyCors, {
      origin: (origin, cb) => cb(null, (origin ?? "") === this.providers.env.get("WEB_URL")),
      methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    });

    await this.server.register(fastifyCookie, {} as FastifyCookieOptions);

    await this.server.register(fastifyFormbody);

    await this.server.register(fastifySwagger, {
      openapi: {
        info: swaggerConfig,
      },
      transform: jsonSchemaTransform,
    });

    await this.server.register(fastifySwaggerUi, swaggerUIConfig);
  }

  registerHooks() {
    this.server.decorateRequest("user", null);

    this.server.addHook("preHandler", async (request, reply) => {
      // for some reason this is triggered even if route is not found
      if (request.routeOptions?.config?.isPublic || !request.routeOptions.url) {
        return;
      }

      // Tell the browser to not cache routes with authentication
      reply.header("Cache-Control", "no-cache, no-store, must-revalidate");
      reply.header("Pragma", "no-cache");
      reply.header("Expires", "0");

      const sessionId = request.cookies[AUTH_COOKIE_NAME];
      if (!sessionId) {
        throw new HTTPUnauthorizedError("No session cookie");
      }
      try {
        const user = await this.providers.auth.verify(sessionId);
        if (!user) {
          this.providers.log.debug(`Invalid session`);
          reply.clearCookie(AUTH_COOKIE_NAME);
          return reply.code(HTTP_STATUS_CODES.UNAUTHORIZED).send({ error: "Invalid session cookie" });
        }
        request.user = user;
      } catch (err) {
        const error = asError(err);
        this.providers.log.debug(`Could not fetch user session: ${error.message}`);
        return reply.code(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({ error: "Auth instance unavailable" });
      }
    });
  }

  registerRoutes(routes: HttpRoute<RouteSchemas>[]) {
    for (const route of routes) {
      this.server.withTypeProvider<ZodTypeProvider>().route({
        method: route.method,
        url: route.path,
        // Keys left undefined are omitted: Fastify warns (FSTWRN001) about schema keys present without a value
        schema: {
          ...(route.schemas.body ? { body: route.schemas.body } : {}),
          ...(route.schemas.queryParams ? { querystring: route.schemas.queryParams } : {}),
          ...(route.schemas.pathParams ? { params: route.schemas.pathParams } : {}),
          ...(route.schemas.response ? { response: route.schemas.response } : {}),
        },
        config: { isPublic: route.isPublic },
        handler: async (request, reply) => {
          const routeResponse = await route.handler({
            body: request.body,
            pathParams: request.params,
            queryParams: request.query,
            user: request.user,
            cookies: request.cookies,
          });

          for (const { name, value, ...cookieSettings } of routeResponse.cookies ?? []) {
            reply.cookie(name, value, cookieSettings);
          }
          reply.status(routeResponse.status ?? 200);
          return routeResponse.body;
        },
      });
    }
  }

  createRateLimitStore() {
    type ChildOptions = RouteOptions & { routeInfo?: Pick<RouteOptions, "method" | "url"> };
    type IncrCallback = (err: Error | null, result?: { current: number; ttl: number }) => void;
    const cache = this.providers.cache;
    return class CacheRateLimitStore {
      options;
      route;
      constructor(options: unknown, route = "global") {
        this.options = options;
        this.route = route;
      }

      incr(key: string, cb: IncrCallback, timeWindow: number) {
        cache.increment("rate-limit", [this.route, key], timeWindow).then(
          ({ count, ttlMs }) => cb(null, { current: count, ttl: ttlMs }),
          (err) => cb(err as Error | null),
        );
      }

      child(routeOptions: ChildOptions) {
        const { method, url } = routeOptions.routeInfo ?? routeOptions;
        const methodKey = Array.isArray(method) ? method.join(",") : method;
        return new CacheRateLimitStore(routeOptions, `${methodKey} ${url}`);
      }
    };
  }
}

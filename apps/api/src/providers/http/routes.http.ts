import { objectEntries } from "@repo/lib";
import {
  createTaskTemplateRequestSchema,
  createTaskTemplateResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  meResponseSchema,
  searchTaskOccurrencesRequestSchema,
  searchTaskOccurrencesResponseSchema,
  updateTaskTemplatesRequestSchema,
  updateTaskTemplatesResponseSchema,
} from "@repo/dtos";
import type { Providers } from "../types.provider.ts";
import {
  mapToNewTaskTemplate,
  taskOccurrenceToDTO,
  taskTemplateChangesFromDTO,
  taskTemplateToDTO,
} from "./adapters.http.ts";
import type { HttpRoute, RouteSchemas } from "./types.http.ts";
import { searchTaskOccurrences } from "../../operations/searchTaskOccurrences.operation.ts";
import {
  HTTPBadRequestError,
  HTTPNotFoundError,
  HTTPRateLimitError,
  HTTPUnauthorizedError,
} from "../../config/errors.ts";
import { AUTH_COOKIE_NAME, AUTH_SESSION_EXPIRATION } from "../../config/auth.ts";
import { InvalidCredentialsError, TooManyLoginAttemptsError } from "../auth/errors.auth.ts";
import { searchTaskTemplates } from "../../operations/searchTaskTemplates.operation.ts";
import { updateTaskTemplates } from "../../operations/updateTaskTemplates.operation.ts";
import { createTaskTemplate } from "../../operations/createTaskTemplate.operation.ts";
import { TaskTemplateNotFoundError } from "../../operations/errors.operation.ts";

export function defineRoutes(providers: Providers) {
  const routesMap = {
    "/healthz": defineRoute({ method: "GET", isPublic: true, schemas: {}, handler: () => ({ body: "OK" }) }),
    "/auth/me": defineRoute({
      method: "GET",
      isPublic: false,
      schemas: { response: { 200: meResponseSchema } },
      handler: (req) => ({ body: req.user }),
    }),
    "/auth/login": defineRoute({
      method: "POST",
      isPublic: true,
      schemas: {
        body: loginRequestSchema,
        response: { 200: loginResponseSchema },
      },
      handler: async (req) => {
        const { username, password } = req.body;
        try {
          const userAndSession = await providers.auth.login(username, password);
          return {
            body: userAndSession.user,
            cookies: [
              {
                name: AUTH_COOKIE_NAME,
                value: userAndSession.sessionId,
                httpOnly: true,
                secure: providers.env.get("NODE_ENV") === "production",
                sameSite: "lax",
                maxAge: AUTH_SESSION_EXPIRATION / 1000,
                path: "/",
              },
            ],
          };
        } catch (e) {
          if (e instanceof TooManyLoginAttemptsError) {
            throw new HTTPRateLimitError();
          } else if (e instanceof InvalidCredentialsError) {
            throw new HTTPBadRequestError("Invalid credentials");
          }
          throw new HTTPUnauthorizedError();
        }
      },
    }),
    "/auth/logout": defineRoute({
      method: "POST",
      isPublic: false,
      schemas: {},
      handler: async (req) => {
        if (req.cookies[AUTH_COOKIE_NAME]) {
          await providers.auth.logout(req.cookies[AUTH_COOKIE_NAME]);
          return { body: "OK", cookies: [{ name: AUTH_COOKIE_NAME, value: "", maxAge: 0, path: "/" }] };
        }
        return { body: "OK" };
      },
    }),
    "/task-occurrences": defineRoute({
      method: "GET",
      isPublic: false,
      schemas: {
        queryParams: searchTaskOccurrencesRequestSchema,
        response: { 200: searchTaskOccurrencesResponseSchema },
      },
      handler: async (req) => {
        const { from, to, timeZone } = req.queryParams;
        const taskOccurrences = await searchTaskOccurrences(
          { fromLocal: from, toLocal: to, timeZone },
          req.user,
          providers,
        );
        return { body: taskOccurrences.map((to) => taskOccurrenceToDTO(to)) };
      },
    }),
    "/task-templates": defineRoute({
      method: "GET",
      isPublic: false,
      schemas: {},
      handler: async (req) => {
        const taskTemplates = await searchTaskTemplates(req.user, providers);
        return { body: taskTemplates.map((to) => taskTemplateToDTO(to)) };
      },
    }),
    "/task-templates/create": defineRoute({
      method: "POST",
      isPublic: false,
      schemas: {
        body: createTaskTemplateRequestSchema,
        response: { 201: createTaskTemplateResponseSchema },
      },
      handler: async (req) => {
        const taskTemplate = await createTaskTemplate(
          { taskTemplate: mapToNewTaskTemplate(req.body) },
          req.user,
          providers,
        );
        return { status: 201, body: taskTemplateToDTO(taskTemplate) };
      },
    }),
    "/task-templates/update": defineRoute({
      method: "PATCH",
      isPublic: false,
      schemas: {
        body: updateTaskTemplatesRequestSchema,
        response: { 200: updateTaskTemplatesResponseSchema },
      },
      handler: async (req) => {
        const updates = req.body.updates.map(({ id, changes }) => ({
          id,
          changes: taskTemplateChangesFromDTO(changes),
        }));
        try {
          const taskTemplates = await updateTaskTemplates({ updates }, req.user, providers);
          return { body: taskTemplates.map((taskTemplate) => taskTemplateToDTO(taskTemplate)) };
        } catch (e) {
          if (e instanceof TaskTemplateNotFoundError) {
            throw new HTTPNotFoundError("Task template not found");
          }
          throw e;
        }
      },
    }),
  };
  return routeMapToArray(routesMap satisfies HttpRouteMap);
}

type HttpRouteMap = Record<HttpRoute<RouteSchemas>["path"], Omit<HttpRoute<RouteSchemas>, "path">>;

function defineRoute<TSchemas extends RouteSchemas, TIsPublic extends boolean>(
  route: Omit<HttpRoute<TSchemas, TIsPublic>, "path">,
) {
  return route;
}

function routeMapToArray(routeMap: HttpRouteMap): HttpRoute<RouteSchemas>[] {
  return objectEntries(routeMap).map(([path, routeConfig]) => ({
    ...routeConfig,
    path,
  }));
}

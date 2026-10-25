import type { z } from "zod";
import type { User } from "../../operations/types.operation.ts";

declare module "fastify" {
  interface FastifyRequest {
    user: User | null;
  }

  interface FastifyContextConfig {
    isPublic?: boolean;
  }
}

export type HttpRoute<TRouteSchemas extends RouteSchemas, TIsPublic extends boolean = boolean> = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  path: `/${string}`;
  schemas: TRouteSchemas;
  isPublic: TIsPublic;
  handler: (
    req: RouteRequest<TRouteSchemas, TIsPublic>,
  ) => RouteResponse<TRouteSchemas> | Promise<RouteResponse<TRouteSchemas>>;
};

export type RouteSchemas = {
  body?: z.ZodType;
  pathParams?: z.ZodType;
  queryParams?: z.ZodType;
  response?: Record<number, z.ZodType>;
};

export type RouteRequest<TRouteSchemas extends RouteSchemas, TIsPublic extends boolean = boolean> = {
  body: z.infer<TRouteSchemas["body"]>;
  pathParams: z.infer<TRouteSchemas["pathParams"]>;
  queryParams: z.infer<TRouteSchemas["queryParams"]>;
  cookies: { [cookieName: string]: string | undefined };
  user: TIsPublic extends false ? User : User | null;
};

export type RouteResponse<TRouteSchemas extends RouteSchemas> = {
  status?: number;
  body: z.infer<TRouteSchemas["response"]>;
  cookies?: RouteCookie[];
};

export type RouteCookie = {
  name: string;
  value: string;
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  partitioned?: boolean;
  path?: string;
  sameSite?: "lax" | "none" | "strict" | boolean;
  priority?: "low" | "medium" | "high";
  secure?: boolean;
};

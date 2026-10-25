export const swaggerConfig = {
  title: "Taskerix",
  description: "task management",
  version: "1.0.0",
} as const;

export const swaggerUIConfig = {
  routePrefix: "/swagger",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
} as const;

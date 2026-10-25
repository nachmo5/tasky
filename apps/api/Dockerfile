FROM node:24-alpine AS base
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo@2.0.14
COPY . .
RUN turbo prune @repo/api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --omit=dev
COPY --from=pruner /app/out/full/ ./

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=installer --chown=node:node /app/ ./
USER node

EXPOSE 3000

CMD ["node", "apps/api/src/main.ts"]

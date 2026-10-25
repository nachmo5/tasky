FROM node:24-alpine AS base
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo@2.10.13
COPY . .
RUN turbo prune @repo/web --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=pruner /app/out/full/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace @repo/web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://api:3000
EXPOSE 80

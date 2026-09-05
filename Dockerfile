FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=8080
ENV BASE_PATH=/

RUN pnpm --filter @workspace/medlens run build \
  && pnpm --filter @workspace/api-server run build \
  && cp -R artifacts/medlens/dist/public public

FROM node:22-bookworm-slim

WORKDIR /app
RUN corepack enable

COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
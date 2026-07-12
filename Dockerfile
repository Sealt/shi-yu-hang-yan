# 诗语杭研 API — multi-stage, works on amd64/arm64
# pnpm@11 requires Node.js >= 22.13 (node:sqlite)
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
WORKDIR /app

FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
# Only install workspace packages needed by the API
RUN pnpm install --filter @hyy/server... --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/server apps/server
RUN pnpm --filter @hyy/shared build \
  && pnpm --filter @hyy/server build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/data/hangyan.db

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -r hyy && useradd -r -g hyy -d /app hyy \
  && mkdir -p /data && chown hyy:hyy /data

# pnpm deploy-style layout: server package + its node_modules + shared
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/node_modules ./apps/server/node_modules

USER hyy
EXPOSE 3000
WORKDIR /app/apps/server
CMD ["node", "dist/index.js"]

FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm -r build --filter @corallo/shared --filter @corallo/db --filter @corallo/worker

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/worker/dist ./dist
COPY --from=builder /repo/apps/worker/package.json ./package.json
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/shared/dist ./node_modules/@corallo/shared/dist
COPY --from=builder /repo/packages/shared/package.json ./node_modules/@corallo/shared/package.json
COPY --from=builder /repo/packages/db/dist ./node_modules/@corallo/db/dist
COPY --from=builder /repo/packages/db/package.json ./node_modules/@corallo/db/package.json

CMD ["node", "dist/main.js"]

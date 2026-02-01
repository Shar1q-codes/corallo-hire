FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_COGNITO_DOMAIN
ARG NEXT_PUBLIC_COGNITO_CLIENT_ID
ARG NEXT_PUBLIC_COGNITO_REDIRECT_URI

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_COGNITO_DOMAIN=$NEXT_PUBLIC_COGNITO_DOMAIN
ENV NEXT_PUBLIC_COGNITO_CLIENT_ID=$NEXT_PUBLIC_COGNITO_CLIENT_ID
ENV NEXT_PUBLIC_COGNITO_REDIRECT_URI=$NEXT_PUBLIC_COGNITO_REDIRECT_URI

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm -r build --filter @corallo/shared --filter @corallo/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/web/.next ./.next
COPY --from=builder /repo/apps/web/package.json ./package.json
COPY --from=builder /repo/apps/web/next.config.js ./next.config.js
COPY --from=builder /repo/apps/web/public ./public
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/shared/dist ./node_modules/@corallo/shared/dist
COPY --from=builder /repo/packages/shared/package.json ./node_modules/@corallo/shared/package.json

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]

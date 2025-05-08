FROM node:23.7-alpine3.20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Disabling Telemetry
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat curl

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Add cache-busting step
ARG CACHE_BUST=$(date +%s)
RUN echo "Cache bust: ${CACHE_BUST}"

RUN pnpm dlx prisma migrate deploy
RUN pnpm dlx prisma generate
RUN --mount=type=secret,id=ReSendKey \
    --mount=type=secret,id=DATABASE_URL \
    NEXT_PUBLIC_RE_SEND_KEY=$(cat /run/secrets/ReSendKey) \
    DATABASE_URL=$(cat /run/secrets/DATABASE_URL) \
    pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

FROM oven/bun:1-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

RUN --mount=type=secret,id=ReSendKey \
    --mount=type=secret,id=DATABASE_URL \
    --mount=type=secret,id=NEXTAUTH_SECRET \
    --mount=type=secret,id=NEXTAUTH_URL \
    --mount=type=secret,id=BASECAMP_CLIENT_ID \
    --mount=type=secret,id=BASECAMP_CLIENT_SECRET \
    --mount=type=secret,id=GOOGLE_CLIENT_ID \
    --mount=type=secret,id=GOOGLE_CLIENT_SECRET \
    --mount=type=secret,id=ENCRYPTION_KEY \
    --mount=type=secret,id=CRON_SECRET \
    --mount=type=secret,id=CLOUDINARY_CLOUD_NAME \
    --mount=type=secret,id=CLOUDINARY_API_KEY \
    --mount=type=secret,id=CLOUDINARY_API_SECRET \
    export NEXT_PUBLIC_RE_SEND_KEY=$(cat /run/secrets/ReSendKey) && \
    export DATABASE_URL=$(cat /run/secrets/DATABASE_URL) && \
    export NEXTAUTH_SECRET=$(cat /run/secrets/NEXTAUTH_SECRET) && \
    export NEXTAUTH_URL=$(cat /run/secrets/NEXTAUTH_URL) && \
    export BASECAMP_CLIENT_ID=$(cat /run/secrets/BASECAMP_CLIENT_ID) && \
    export BASECAMP_CLIENT_SECRET=$(cat /run/secrets/BASECAMP_CLIENT_SECRET) && \
    export GOOGLE_CLIENT_ID=$(cat /run/secrets/GOOGLE_CLIENT_ID) && \
    export GOOGLE_CLIENT_SECRET=$(cat /run/secrets/GOOGLE_CLIENT_SECRET) && \
    export ENCRYPTION_KEY=$(cat /run/secrets/ENCRYPTION_KEY) && \
    export CRON_SECRET=$(cat /run/secrets/CRON_SECRET) && \
    export CLOUDINARY_CLOUD_NAME=$(cat /run/secrets/CLOUDINARY_CLOUD_NAME) && \
    export CLOUDINARY_API_KEY=$(cat /run/secrets/CLOUDINARY_API_KEY) && \
    export CLOUDINARY_API_SECRET=$(cat /run/secrets/CLOUDINARY_API_SECRET) && \
    bun run prisma generate && \
    bun run prisma migrate deploy && \
    bun run compile:blog && \
    bun run build && \
    ls -la /app/.next/static || (echo "Build failed - static directory not created" && exit 1)

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

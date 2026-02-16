FROM node:20-bookworm-slim AS deps


WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app

COPY . .
RUN npm run prepare \
    && npm run build \
    && npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV SLATE_DB_PATH=/app/data/slate.db
ENV HOST=0.0.0.0
ENV PORT=3000
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV XFF_DEPTH=1

# better-sqlite3 needs libstdc++ at runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libstdc++6 ca-certificates \
    && rm -rf /var/lib/apt/lists/*


RUN addgroup --system --gid 1001 appgroup \
    && adduser --system --uid 1001 --ingroup appgroup appuser \
    && mkdir -p /app/data /app/scripts \
    && chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/build ./build
COPY --from=build --chown=appuser:appgroup /app/migrations ./migrations
COPY --from=build --chown=appuser:appgroup /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build --chown=appuser:appgroup /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY litestream.yml /etc/litestream.yml

# Install Litestream
ADD https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz


RUN chmod +x ./scripts/docker-entrypoint.sh

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000;fetch('http://127.0.0.1:'+p+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "build"]

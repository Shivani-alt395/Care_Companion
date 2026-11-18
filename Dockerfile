# ── Stage 1: install all deps ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm ci --ignore-scripts

# ── Stage 2: build client ──────────────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules 2>/dev/null || true
COPY package.json ./
COPY client ./client

RUN npm run build --workspace=client

# ── Stage 3: build server ──────────────────────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules 2>/dev/null || true
COPY package.json ./
COPY server ./server

RUN npm run build --workspace=server

# ── Stage 4: production image ──────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S careapp -u 1001

# Copy production deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules 2>/dev/null || true

# Copy built artifacts
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client/dist

# Copy Prisma schema & migrations
COPY server/prisma ./server/prisma

# Copy package files for workspace resolution
COPY package.json ./
COPY server/package.json ./server/

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN chown -R careapp:nodejs /app
USER careapp

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

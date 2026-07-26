# ── Stage 1: Build the client ──────────────────────────────────────
FROM oven/bun:latest AS build
WORKDIR /app

# Install client dependencies (layer cached when deps don't change)
COPY client/package.json client/bun.lock ./
RUN bun install --frozen-lockfile

# Copy client source and build
COPY client/ ./
RUN bun run build

# ── Stage 2: Production image ──────────────────────────────────────
FROM oven/bun:latest
WORKDIR /app

ENV NODE_ENV=production

# Install server dependencies (layer cached)
COPY server/package.json server/bun.lock ./server/
RUN cd server && bun install --frozen-lockfile --production

# Copy server source (preserves server/src/ structure so import.meta.dir resolves correctly)
COPY server/ ./server/

# Copy built client from the build stage
COPY --from=build /app/dist ./client/dist/

EXPOSE 3000

WORKDIR /app/server
CMD ["bun", "run", "start"]

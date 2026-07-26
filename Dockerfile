FROM oven/bun:latest AS build
WORKDIR /app

COPY client/package.json client/bun.lock ./
RUN bun install --frozen-lockfile

COPY client/ ./
RUN bun run build

FROM oven/bun:latest
WORKDIR /app

ENV NODE_ENV=production

COPY server/package.json server/bun.lock ./server/
RUN cd server && bun install --frozen-lockfile --production

COPY server/ ./server/

COPY --from=build /app/dist ./client/dist/

EXPOSE 3000

WORKDIR /app/server
CMD ["bun", "run", "start"]

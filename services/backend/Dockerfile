FROM node:18-alpine

ARG FRONTEND_URL
ENV FRONTEND_URL=${FRONTEND_URL}

# Toolchain for building better-sqlite3's native addon via node-gyp.
RUN apk add --no-cache python3 make g++

# Pin pnpm via corepack (matches the pnpm-lock.yaml in the repo).
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile: fail if the lock is out of sync. better-sqlite3 is listed
# in package.json's pnpm.onlyBuiltDependencies, so its native addon is built.
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build
EXPOSE 3000
# SQLite lives on a mounted volume so standings survive redeploys.
ENV DATABASE_PATH=/app/data/wizard.db
CMD ["pnpm", "start"]

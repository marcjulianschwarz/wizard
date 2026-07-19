FROM node:20-alpine

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Pin pnpm via corepack (matches the pnpm-lock.yaml in the repo).
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build
EXPOSE 3000

# Serve the built static files with `serve` (a project dependency), run via
# pnpm exec so no global install / PNPM_HOME setup is needed.
CMD ["pnpm", "exec", "serve", "-s", "dist", "-l", "3000"]

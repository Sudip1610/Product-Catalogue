FROM node:20.18-alpine AS builder

WORKDIR /app

# Copy monorepo manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies for api workspace
RUN npm ci --workspace=@product-catalogue/api

# Copy source and TypeScript configs
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/src ./apps/api/src

# Build api
RUN npm run build --workspace=@product-catalogue/api

FROM node:20.18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=@product-catalogue/api --omit=dev && npm cache clean --force

# Copy build artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Non-root user
USER node

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]

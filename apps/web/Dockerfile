FROM node:20.18-alpine AS builder

WORKDIR /app

# Copy monorepo manifests
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies for web workspace
RUN npm ci --workspace=@product-catalogue/web

# Copy source and configs
COPY apps/web ./apps/web

# Build web application
RUN npm run build --workspace=@product-catalogue/web

FROM nginx:1.27-alpine AS runner

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Configure temp paths and permissions for non-root execution
RUN sed -i '/user  nginx;/d' /etc/nginx/nginx.conf && \
    sed -i 's,pid .*,pid /tmp/nginx.pid;,g' /etc/nginx/nginx.conf && \
    sed -i '/http {/a \    proxy_temp_path /tmp/proxy_temp;\n    client_body_temp_path /tmp/client_temp;\n    fastcgi_temp_path /tmp/fastcgi_temp;\n    uwsgi_temp_path /tmp/uwsgi_temp;\n    scgi_temp_path /tmp/scgi_temp;' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/conf.d /var/cache/nginx /var/log/nginx

# Non-root user
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

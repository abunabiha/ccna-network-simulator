# ==========================================
# Multi-stage Dockerfile for CCNA NetSim Pro
# Stage 1: Build the Vite + React Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using clean install
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Serve with Lightweight Nginx Alpine
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom high-performance SPA nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Container healthcheck using dedicated /healthz endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

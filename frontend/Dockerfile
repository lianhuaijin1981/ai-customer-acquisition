FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# SSL 证书目录（通过 volume 挂载或 COPY）
RUN mkdir -p /etc/nginx/ssl
# 生产环境：将 cert.pem 和 key.pem 复制到 /etc/nginx/ssl/
# COPY ssl/cert.pem /etc/nginx/ssl/cert.pem
# COPY ssl/key.pem /etc/nginx/ssl/key.pem

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]

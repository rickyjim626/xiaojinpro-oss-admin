# stage 1 – build
FROM crpi-yc80g9vo0c8ml7bj.cn-shanghai.personal.cr.aliyuncs.com/xiaojinpro/node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# stage 2 – static serve
FROM crpi-yc80g9vo0c8ml7bj.cn-shanghai.personal.cr.aliyuncs.com/xiaojinpro/nginx:1.27-alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
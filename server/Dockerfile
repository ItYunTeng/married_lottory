# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package*.json（利用 Docker 缓存）
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制源代码
COPY . .

# 创建非 root 用户（安全最佳实践）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S lottery -u 1001 && \
    chown -R lottery:nodejs /app
USER lottery

EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
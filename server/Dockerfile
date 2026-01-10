# Dockerfile
FROM node:18-alpine AS base

# 环境变量
ARG WORK_PATH=/app

# WORKDIR
WORKDIR $WORK_PATH

# 复制 package*.json（利用 Docker 缓存）
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

RUN mkdir -p "$WORK_PATH"

# 第二阶段：复制代码并设置权限
FROM base AS final

# 环境变量
ENV WORK_PATH=/app

# WORKDIR
WORKDIR $WORK_PATH

# 复制已安装的 node_modules 和源码
COPY --from=base $WORK_PATH/node_modules ./node_modules
COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["npm", "start"]
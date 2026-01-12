FROM node:18-alpine

ARG WORK_PATH=/app
WORKDIR $WORK_PATH

# 1. 复制依赖文件
COPY package*.json ./

# 2. 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 3. 复制源码
COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]
// redisClient.js
const Redis = require('ioredis');

// 从环境变量读取配置（开发用默认值）
const redis = new Redis({
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || '127.0.0.1',
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy(times) {
    return Math.min(times * 50, 2000); // 重连策略
  }
});

redis.on('error', (err) => {
  console.error('Redis Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

module.exports = redis;
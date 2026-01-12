// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');
const redis = require('./redisClient'); // 引入 Redis 客户端

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// 微信配置（从环境变量读取更安全）
const DOMAIN = process.env.DOMAIN || '';
console.log('DOMAIN:', DOMAIN);
const WECHAT_APPID = process.env.WECHAT_APPID || '';
console.log('WECHAT_APPID:', WECHAT_APPID);
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';
console.log('WECHAT_SECRET:', WECHAT_SECRET);
const REDIRECT_URI = `https://${DOMAIN}/${process.env.REDIRECT_URI}` || '';
console.log('REDIRECT_URI:', REDIRECT_URI);
const WECHAT_OAUTH_URL = process.env.WECHAT_OAUTH_URL || '';
console.log('WECHAT_OAUTH_URL:', WECHAT_OAUTH_URL);
const WECHAT_API_URL = process.env.WECHAT_API_URL || '';
console.log('WECHAT_API_URL:', WECHAT_API_URL);

// 内存中的 WebSocket 客户端（用于广播）
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

// 广播工具函数
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 工具：获取所有未中奖用户
async function getEligibleUsers() {
  const allUsers = await redis.hgetall('users');
  const winnerIds = await redis.smembers('winner_ids');

  const users = Object.values(allUsers).map(u => JSON.parse(u));
  const winnerIdSet = new Set(winnerIds);
  return users.filter(u => !winnerIdSet.has(u.id));
}

// 路由：微信授权跳转
app.get('/auth/wechat', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const url = `${WECHAT_OAUTH_URL}/connect/oauth2/authorize?appid=${WECHAT_APPID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
  console.log(`Redirecting to ${url}`);
  res.redirect(url);
});

// 路由：微信回调
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    // 1. 获取 access_token
    const tokenRes = await axios.get(
      `${WECHAT_API_URL}/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`
    );
    const { access_token, openid } = tokenRes.data;

    // 3. 生成唯一 ID（可用 openid，但为演示用 hash）
    const userId = openid;

    const existUser = await redis.hget('users', userId);
    if (existUser) {
      res.redirect(`https://${DOMAIN}/join?userId=${userId}`);
      return;
    }

    // 2. 获取用户信息
    const userRes = await axios.get(
      `${WECHAT_API_URL}/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    );
    const wechatUser = userRes.data;

    const user = {
      id: userId,
      openid,
      nickname: wechatUser.nickname,
      avatar: wechatUser.headimgurl.replace('http://', 'https://'), // 强制 HTTPS
      isWinner: false,
      createdAt: new Date().toISOString()
    };
    // 4. 保存到 Redis Hash
    await redis.hset('users', userId, JSON.stringify(user));

    // 5. 广播新用户
    broadcast('NEW_USER', user);

    // 6. 重定向到参与成功页
    res.redirect(`https://${DOMAIN}/join?userId=${userId}`);
  } catch (err) {
    console.error('Auth error:', err.response?.data || err.message);
    res.status(500).send('Authentication failed');
  }
});

// API：获取所有用户（供 Join.vue 使用）
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await redis.hgetall('users');
    const users = Object.values(allUsers).map(u => JSON.parse(u));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API：开始抽奖
app.post('/api/draw', async (req, res) => {
  try {
    const eligibleUsers = await getEligibleUsers();
    if (eligibleUsers.length === 0) {
      return res.status(400).json({ error: 'No eligible users' });
    }

    // 随机选一个
    const winner = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];

    // 标记为已中奖（原子操作）
    await redis.sadd('winner_ids', winner.id);

    // 更新用户对象（可选，前端可通过 winner_ids 判断）
    winner.isWinner = true;
    await redis.hset('users', winner.id, JSON.stringify(winner));

    // 广播中奖结果
    broadcast('WINNER', winner);

    res.json({ winner });
  } catch (err) {
    console.error('Draw error:', err);
    res.status(500).json({ error: err.message });
  }
});

// API：重置（清空所有用户和中奖记录）
app.post('/api/reset', async (req, res) => {
  try {
    await redis.del('users', 'winner_ids');
    broadcast('RESET');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/allUsers', async (req, res) => {
  try {
    const allUsers = await redis.hgetall('users');
    const users = Object.values(allUsers).map(u => JSON.parse(u));
    broadcast('INIT_USERS', users);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
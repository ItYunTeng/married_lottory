<!-- src/views/Join.vue -->
<template>
  <div style="text-align: center; padding-top: 100px; font-family: sans-serif; background: #f9f9f9; min-height: 100vh">
    <h2>🎉 欢迎参加抽奖！</h2>

    <!-- 头像和昵称（如果有） -->
    <div v-if="user" style="margin-top: 30px">
      <img :src="user.avatar" width="80" style="border-radius: 50%; border: 2px solid #42b983" />
      <p>
        <strong>{{ user.nickname }}</strong>
      </p>
    </div>

    <!-- 状态提示 -->
    <div style="margin-top: 40px; font-size: 18px; color: #555">
      <span v-if="!isOnWall">正在同步到大屏幕...</span>
      <span v-else style="color: green; font-weight: bold">✅ 你的头像已上墙！</span>
    </div>

    <p style="color: #888; margin-top: 30px">请稍作等待，主持人将开始抽奖</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data () {
    return {
      user: null,
      userId: null,
      isOnWall: false,
      ws: null
    };
  },
  async mounted () {
    this.userId = this.$route.query.userId;

    if (!this.userId) {
      alert('无效链接');
      return;
    }

    // 先获取当前用户信息（兜底）
    try {
      const res = await axios.get(process.env.VUE_APP_HOST + 'api/users');
      this.user = res.data.find(u => u.id === this.userId);
      if (this.user && !this.isOnWall) {
        this.isOnWall = true;
      }
    } catch (e) {
      console.error('Failed to fetch user');
    }

    // 👉 连接 WebSocket，监听是否上墙
    this.connectWebSocket();
  },
  beforeDestroy () {
    if (this.ws) {
      this.ws.close();
    }
  },
  methods: {
    connectWebSocket () {
      this.ws = new WebSocket(process.env.VUE_APP_WS_API);

      this.ws.onopen = () => {
        console.log('Join page connected to WebSocket');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // 监听两种情况：初始化列表 or 新用户加入
        if (data.type === 'INIT_USERS') {
          const found = data.payload.some(u => u.id === this.userId);
          if (found && !this.isOnWall) {
            this.isOnWall = true;
          }
        } else if (data.type === 'NEW_USER') {
          if (data.payload.id === this.userId && !this.isOnWall) {
            this.isOnWall = true;
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error in Join.vue:', error);
      };

      this.ws.onclose = () => {
        // 可选：自动重连（但参与页一般不需要长时间连接）
        console.log('WebSocket closed in Join.vue');
      };
    }
  }
};
</script>
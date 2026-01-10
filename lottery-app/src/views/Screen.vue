<!-- src/views/Screen.vue -->
<template>
  <div id="screen" style="background: #000; color: white; min-height: 100vh; overflow: hidden; position: relative">
    <!-- 粒子画布 -->
    <canvas ref="particleCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 20"></canvas>

    <h1 style="text-align: center; font-size: 48px; margin: 20px 0; text-shadow: 0 0 10px gold">🎁 幸运大抽奖 🎁</h1>

    <!-- 中奖公告 -->
    <div v-if="winner" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; text-align: center">
      <div style="background: rgba(0, 0, 0, 0.85); padding: 30px; border-radius: 20px; border: 4px solid gold">
        <h2 style="font-size: 60px; color: gold; text-shadow: 0 0 20px gold">恭喜 {{ winner.nickname }}！</h2>
        <img :src="winner.avatar" width="150" style="border-radius: 50%; border: 6px solid gold; margin-top: 20px" />
      </div>
    </div>

    <!-- 圆形用户墙 -->
    <div id="wheel-container" style="position: relative; width: 600px; height: 600px; margin: 40px auto">
      <div v-for="(user, index) in allUsers" :key="user.id" class="user-item" :style="getUserPosition(index)">
        <img
          :src="user.avatar"
          width="60"
          style="border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(255, 215, 0, 0.6)"
          :class="{ 'winner-glow': user.isWinner }"
        />
        <p style="color: white; font-size: 12px; margin-top: 4px; text-shadow: 0 0 4px black">{{ user.nickname }}</p>
      </div>

      <!-- 指针 -->
      <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); z-index: 5">
        <div style="width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 30px solid red"></div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div style="text-align: center; margin-top: 20px">
      <button
        @click="startLottery"
        :disabled="isDrawing || eligibleCount === 0"
        style="
          font-size: 28px;
          padding: 15px 50px;
          background: #ff4500;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        "
      >
        {{ isDrawing ? '开奖中...' : eligibleCount === 0 ? '无人可抽' : '开始抽奖' }}
      </button>
    </div>

    <!-- 参与二维码（右下角悬浮） -->
    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 30; text-align: center">
      <img src="/assets/qrcode.png" width="120" style="border: 2px solid white; border-radius: 8px; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5)" />
      <p style="color: white; margin-top: 8px; font-size: 14px">扫码参与抽奖</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data () {
    return {
      allUsers: [],
      winner: null,
      isDrawing: false,
      ws: null,
      rotation: 0,
      audioStart: null,
      audioWin: null
    };
  },
  computed: {
    eligibleCount () {
      return this.allUsers.filter(u => !u.isWinner).length;
    }
  },
  mounted () {
    this.initAudio();
    this.connectWebSocket();
    this.initParticles();
  },
  beforeDestroy () {
    if (this.ws) this.ws.close();
    if (this.audioStart) this.audioStart.pause();
    if (this.audioWin) this.audioWin.pause();
  },
  methods: {
    // 初始化音效
    initAudio () {
      this.audioStart = new Audio('/assets/sound-start.mp3');
      this.audioWin = new Audio('/assets/sound-win.mp3');
      // 允许自动播放（需用户交互后）
      this.audioStart.load();
      this.audioWin.load();
    },

    // 初始化粒子系统
    initParticles () {
      const canvas = this.$refs.particleCanvas;
      const ctx = canvas.getContext('2d');
      let particles = [];
      let animationId = null;

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // 创建粒子
      const createParticles = (x, y) => {
        particles = [];
        const colors = ['#FFD700', '#FFA500', '#FFFFFF'];
        for (let i = 0; i < 150; i++) {
          particles.push({
            x,
            y,
            radius: Math.random() * 4 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            velocity: {
              x: (Math.random() - 0.5) * 8,
              y: (Math.random() - 0.5) * 8
            },
            alpha: 1,
            life: 100 + Math.random() * 100
          });
        }
      };

      // 动画循环
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter(p => {
          p.x += p.velocity.x;
          p.y += p.velocity.y;
          p.alpha -= 0.01;
          p.life--;

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          return p.life > 0 && p.alpha > 0;
        });

        if (particles.length > 0) {
          animationId = requestAnimationFrame(animate);
        }
      };

      // 暴露方法
      this.triggerParticles = (x, y) => {
        if (animationId) cancelAnimationFrame(animationId);
        createParticles(x, y);
        animate();
      };
    },

    getUserPosition (index) {
      const total = this.allUsers.length;
      if (total === 0) return {};
      const radius = 250;
      const angle = (index / total) * Math.PI * 2 + this.rotation;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return {
        position: 'absolute',
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)'
      };
    },

    connectWebSocket () {
      this.ws = new WebSocket(process.env.VUE_APP_WS_URL);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'INIT_USERS':
            this.allUsers = data.payload;
            break;
          case 'NEW_USER':
            this.allUsers.push(data.payload);
            break;
          case 'WINNER': {
            const idx = this.allUsers.findIndex(u => u.id === data.payload.id);
            if (idx !== -1) {
              this.$set(this.allUsers[idx], 'isWinner', true);
            }
            this.winner = data.payload;
            this.isDrawing = false;
            break;
          }
          case 'RESET':
            this.allUsers = [];
            this.winner = null;
            this.rotation = 0;
            break;
        }
      };
      this.ws.onclose = () => setTimeout(() => this.connectWebSocket(), 3000);
    },

    async startLottery () {
      if (this.eligibleCount === 0 || this.isDrawing) return;

      this.isDrawing = true;
      this.winner = null;

      // 播放开始音效
      try {
        await this.audioStart.play();
      } catch (e) {
        console.warn('Audio play failed (autoplay policy)');
      }

      try {
        const res = await axios.post(process.env.VUE_APP_HOST + 'api/draw');
        const realWinner = res.data.winner;
        await this.simulateSpin(realWinner);
      } catch (err) {
        console.error('抽奖失败', err);
        this.isDrawing = false;
      }
    },

    simulateSpin (realWinner) {
      return new Promise((resolve) => {
        let spins = 5;
        const total = this.allUsers.length;
        const targetIndex = this.allUsers.findIndex(u => u.id === realWinner.id);
        if (targetIndex === -1) {
          resolve();
          return;
        }

        const fullTurns = spins * 360;
        const targetAngle = (targetIndex / total) * 360;
        const finalRotation = fullTurns + (360 - targetAngle);

        const duration = 4000;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          this.rotation = (finalRotation * easeOut) * (Math.PI / 180);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            this.rotation = (finalRotation * Math.PI) / 180;

            // 🎉 中奖特效
            this.audioWin.play().catch(console.warn);
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            this.triggerParticles(centerX, centerY);

            resolve();
          }
        };

        animate();
      });
    }
  }
};
</script>

<style scoped>
#wheel-container {
  transition: none; /* 由 JS 控制动画 */
}
.user-item {
  transition: opacity 0.3s;
}
.winner-glow {
  box-shadow: 0 0 20px gold, 0 0 30px gold !important;
}
</style>
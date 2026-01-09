<template>
  <div style="text-align: center; padding-top: 100px">
    <h2>微信扫码参与抽奖</h2>
    <button @click="goWechatAuth" style="font-size: 18px; padding: 10px 20px">微信扫码登录</button>
  </div>
</template>

<script>
export default {
  methods: {
    goWechatAuth () {
      window.location.href = 'http://localhost:3000/auth/wechat'; // 改为你的后端地址
    }
  }
}
</script>
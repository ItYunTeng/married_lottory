# lottery-app

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
docker-compose up -d --build
docker-compose down
```

**# 查看应用日志**
**2**docker-compose logs -f app

**# 查看 Redis 日志**
**5**docker-compose logs redis

# docker-compose.yml (redis 服务)

command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
environment:

- REDIS_PASSWORD

### Compiles and minifies for production

```
npm run build
```

* [ ] Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

* `certbot` **容器每 12 小时尝试续期（**`--dry-run` **用于测试，正式部署去掉）**
* **Nginx 和 Certbot 共享卷：**`certbot_data`（证书）、`certbot_www`（验证文件）
* git rm -r --cached


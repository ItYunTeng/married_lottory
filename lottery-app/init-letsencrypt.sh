#!/bin/bash
# init-letsencrypt.sh export $(cat .env | xargs)

if [ -z "$DOMAIN" ]; then
  echo "请先设置 DOMAIN 环境变量 "
  exit 1
fi

echo "申请 Let's Encrypt 证书 for $DOMAIN..."

# 启动临时 Nginx 容器用于验证
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    --staging \
    -d $DOMAIN" certbot

echo "✅ 证书申请完成（测试模式） 🔒 先用 --staging 测试（Let's Encrypt 有频率限制）"
echo "要获取正式证书，请编辑 docker-compose.yml："
echo "  将 certbot 命令中的 --staging 删除"
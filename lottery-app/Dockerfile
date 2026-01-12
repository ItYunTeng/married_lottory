FROM crpi-ycbjupxv98brma33.cn-heyuan.personal.cr.aliyuncs.com/ityunteng/nginx:latest

RUN mkdir /etc/nginx/logs \
    && rm -rf /etc/nginx/nginx.conf \
    && /bin/cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' >/etc/timezone

COPY /nginx/nginx.conf /etc/nginx/nginx.conf
COPY /dist /usr/share/nginx/dist
EXPOSE 80


# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

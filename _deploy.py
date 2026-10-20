#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os
import io
import paramiko

HOST = "124.156.180.128"
PORT = 22
USER = "root"
PASSWORD = "aa56c88aa74f"
REMOTE_DIR = "/www/wwwroot/wheatspace.top"

LOCAL_FILES = {
    "other/index.html": "index.html",
    "other/admin.html": "admin.html",
    "other/auth.js": "auth.js",
    "other/export.js": "export.js",
    "other/social-login.css": "social-login.css",
    "other/vocabulary.json": "vocabulary.json",
    "other/teddy.png": "teddy.png",
    "server.js": "server.js",
    "package.json": "package.json",
    "package-lock.json": "package-lock.json",
    "other/nginx.conf": "nginx.conf",
    ".env": ".env"
}

print("=" * 55)
print("  WheatSpace Full-Stack Deploy Script")
print("=" * 55)

# ===========================================================
# 1. SSH 连接
# ===========================================================
print(f"\n[1/7] Connecting to {HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

connected = False
try:
    ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
    print("    OK: password auth success")
    connected = True
except Exception as e:
    print(f"    ERROR: {e}")
    sys.exit(1)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    return code, out, err

print(f"\n[2/7] Ensure remote dir: {REMOTE_DIR}")
run(f"mkdir -p {REMOTE_DIR}")

# ===========================================================
# 3. 上传文件
# ===========================================================
print("\n[3/7] Upload files...")
sftp = ssh.open_sftp()
for local_name, remote_name in LOCAL_FILES.items():
    local_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.path.normpath(local_name))
    if os.path.exists(local_path):
        remote_path = f"{REMOTE_DIR}/{remote_name}"
        try:
            sftp.put(local_path, remote_path)
            print(f"    OK: {remote_name} uploaded")
        except Exception as e:
            print(f"    WARN: Failed to upload {local_name}: {e}")
    else:
        print(f"    WARN: {local_name} not found locally, skipping")

# ===========================================================
# 4. 配置 Nginx
# ===========================================================
print("\n[4/7] Configure Nginx...")
vhost_content = r"""server {
    listen       80;
    server_name  wheatspace.top www.wheatspace.top;
    return 301 https://$host$request_uri;
}

server {
    listen       443 ssl http2;
    server_name  wheatspace.top www.wheatspace.top;

    ssl_certificate      /www/server/panel/vhost/cert/wheatspace.top/fullchain.pem;
    ssl_certificate_key  /www/server/panel/vhost/cert/wheatspace.top/privkey.pem;
    ssl_protocols        TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers          EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache    shared:SSL:10m;
    ssl_session_timeout  10m;

    root   /www/wwwroot/wheatspace.top;
    index  index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
"""
vhost_path = "/etc/nginx/conf.d/wheatspace.conf"
# 宝塔检测
_, out_vhost, _ = run("test -d /www/server/panel/vhost/nginx && echo yes")
if out_vhost == "yes":
    vhost_path = "/www/server/panel/vhost/nginx/wheatspace.top.conf"

with sftp.open(vhost_path, "w") as f:
    f.write(vhost_content)
sftp.close()

# ===========================================================
# 5. 部署 Node.js 后端
# ===========================================================
print("\n[5/7] Installing Node.js dependencies and starting PM2...")
# 安装依赖
cmd_node = f"cd {REMOTE_DIR} && npm install --production"
code_n, out_n, err_n = run(cmd_node)
print(f"    NPM Install: {out_n or err_n or 'Done'}")

# 确保 pm2 安装
run("npm install -g pm2")

# 重启或启动服务
cmd_pm2 = f"cd {REMOTE_DIR} && pm2 restart server.js || pm2 start server.js --name wheatspace-api"
code_p, out_p, err_p = run(cmd_pm2)
print("    PM2 restarted/started")

# ===========================================================
# 6. 设置权限
# ===========================================================
print("\n[6/7] Set file permissions...")
run(f"chmod -R 755 {REMOTE_DIR} && chown -R www:www {REMOTE_DIR} 2>/dev/null || chown -R nginx:nginx {REMOTE_DIR} 2>/dev/null")

# ===========================================================
# 7. 重载 nginx
# ===========================================================
print("\n[7/7] Test and reload nginx...")
code_t, out_t, err_t = run("nginx -t 2>&1")
if "successful" in (out_t + err_t).lower() or code_t == 0:
    run("systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || nginx -s reload 2>/dev/null")
    print("    OK: Nginx reloaded")
else:
    run("nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null")

ssh.close()
print("\n=======================================================")
print("  DEPLOY DONE!")
print(f"  URL: https://wheatspace.top")
print(f"  PATH: {REMOTE_DIR}")
print("=======================================================")


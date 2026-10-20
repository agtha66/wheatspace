import paramiko
s=paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('124.156.180.128', username='root', password='3.1415926535aaS')

rewrite_content = """# NGINX Custom Rules
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location / {
    try_files $uri $uri/ /index.html;
}
"""

sftp = s.open_sftp()
with sftp.open("/www/server/panel/vhost/rewrite/html_wheatspace.top.conf", "w") as f:
    f.write(rewrite_content)
sftp.close()

_, stdout, stderr = s.exec_command('nginx -t && systemctl reload nginx || nginx -s reload')
print(stdout.read().decode())
print(stderr.read().decode())

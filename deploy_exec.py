#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import sys

HOST = "124.156.180.128"
USER = "root"
FILES = [
    ("other/index.html", "/www/wwwroot/wheatspace.top/index.html"),
    ("server.js", "/www/wwwroot/wheatspace.top/server.js"),
    ("package.json", "/www/wwwroot/wheatspace.top/package.json"),
]

print("=" * 50)
print("  WheatSpace Deploy")
print("=" * 50)

# Upload files
print("\n[1/3] Uploading files...")
for local, remote in FILES:
    cmd = ["scp", local, f"{USER}@{HOST}:{remote}"]
    print(f"  Uploading {local}...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"    OK: {local}")
    else:
        print(f"    ERROR: {result.stderr}")
        sys.exit(1)

# Install and restart
print("\n[2/3] Installing dependencies...")
ssh_cmd = f"cd /www/wwwroot/wheatspace.top && npm install --production && pm2 restart server.js || pm2 start server.js --name wheatspace-api"
cmd = ["ssh", f"{USER}@{HOST}", ssh_cmd]
result = subprocess.run(cmd, capture_output=True, text=True)
print(result.stdout or result.stderr or "Done")

# Reload nginx
print("\n[3/3] Reloading nginx...")
cmd = ["ssh", f"{USER}@{HOST}", "nginx -t && systemctl reload nginx"]
result = subprocess.run(cmd, capture_output=True, text=True)
print(result.stdout or result.stderr or "Done")

print("\n" + "=" * 50)
print("  DEPLOY DONE!")
print("  URL: https://wheatspace.top")
print("=" * 50)

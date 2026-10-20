@echo off
chcp 65001 >nul
echo =========================================
echo   WheatSpace Manual Deploy
echo =========================================
echo.
echo [1/5] Uploading files...
scp "other\index.html" root@124.156.180.128:/www/wwwroot/wheatspace.top/index.html
scp "server.js" root@124.156.180.128:/www/wwwroot/wheatspace.top/server.js
scp "package.json" root@124.156.180.128:/www/wwwroot/wheatspace.top/package.json
scp "package-lock.json" root@124.156.180.128:/www/wwwroot/wheatspace.top/package-lock.json 2>nul
echo.
echo [2/5] Installing dependencies and restarting service...
ssh root@124.156.180.128 "cd /www/wwwroot/wheatspace.top && npm install --production && npm install -g pm2 && pm2 restart server.js || pm2 start server.js --name wheatspace-api"
echo.
echo [3/5] Setting permissions...
ssh root@124.156.180.128 "chmod -R 755 /www/wwwroot/wheatspace.top && chown -R www:www /www/wwwroot/wheatspace.top 2>/dev/null || chown -R nginx:nginx /www/wwwroot/wheatspace.top 2>/dev/null"
echo.
echo [4/5] Reloading nginx...
ssh root@124.156.180.128 "nginx -t && systemctl reload nginx"
echo.
echo =========================================
echo   DEPLOY DONE!
echo   URL: https://wheatspace.top
echo =========================================
pause

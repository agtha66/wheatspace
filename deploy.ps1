# WheatSpace 部署脚本
# 服务器信息
$SERVER = "124.156.180.128"
$USER = "root"
$PASSWORD = "aa56c88aa74f"
$REMOTE_DIR = "/www/wwwroot/wheatspace.top"
$LOCAL_HTML = "e:/personal/Vibecoding/Trae项目/WheatSpace2.0/other/index.html"
$LOCAL_NGINX = "e:/personal/Vibecoding/Trae项目/WheatSpace2.0/other/nginx.conf"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   WheatSpace 自动部署脚本" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 检查 plink 是否可用（PuTTY 工具）
$plinkPath = ""
$plinkLocations = @(
    "C:\Program Files\PuTTY\plink.exe",
    "C:\Program Files (x86)\PuTTY\plink.exe",
    "$env:LOCALAPPDATA\Programs\PuTTY\plink.exe"
)
foreach ($loc in $plinkLocations) {
    if (Test-Path $loc) { $plinkPath = $loc; break }
}

if ($plinkPath -ne "") {
    Write-Host "`n[+] 使用 plink (PuTTY) 进行部署..." -ForegroundColor Green

    # 上传 index.html
    Write-Host "`n[1/4] 上传 index.html ..." -ForegroundColor Yellow
    & "C:\Program Files\PuTTY\pscp.exe" -pw $PASSWORD -batch $LOCAL_HTML "${USER}@${SERVER}:${REMOTE_DIR}/index.html"

    # 上传 nginx.conf
    Write-Host "`n[2/4] 上传 nginx.conf ..." -ForegroundColor Yellow
    & "C:\Program Files\PuTTY\pscp.exe" -pw $PASSWORD -batch $LOCAL_NGINX "${USER}@${SERVER}:/etc/nginx/nginx.conf"

    # 设置权限
    Write-Host "`n[3/4] 设置文件权限 ..." -ForegroundColor Yellow
    & $plinkPath -pw $PASSWORD -batch "${USER}@${SERVER}" "chmod 755 $REMOTE_DIR && chmod 644 ${REMOTE_DIR}/index.html && chown -R www:www $REMOTE_DIR 2>/dev/null || chown -R nginx:nginx $REMOTE_DIR 2>/dev/null || true"

    # 测试并重载 nginx
    Write-Host "`n[4/4] 重载 Nginx ..." -ForegroundColor Yellow
    & $plinkPath -pw $PASSWORD -batch "${USER}@${SERVER}" "nginx -t && systemctl reload nginx && echo '✅ Nginx 重载成功'"

    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host "   部署完成！访问 http://wheatspace.top" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan

} else {
    Write-Host "`n[!] 未检测到 PuTTY，尝试使用系统 SSH..." -ForegroundColor Yellow
    Write-Host "`n由于 Windows OpenSSH 不支持命令行传密码，请手动执行以下步骤：" -ForegroundColor Red
    Write-Host ""
    Write-Host "【步骤 1】上传 index.html" -ForegroundColor White
    Write-Host "  scp `"$LOCAL_HTML`" root@${SERVER}:${REMOTE_DIR}/index.html" -ForegroundColor DarkGray
    Write-Host "  密码: $PASSWORD" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "【步骤 2】上传 nginx.conf" -ForegroundColor White
    Write-Host "  scp `"$LOCAL_NGINX`" root@${SERVER}:/etc/nginx/nginx.conf" -ForegroundColor DarkGray
    Write-Host "  密码: $PASSWORD" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "【步骤 3】SSH 登录并设置权限 + 重载 nginx" -ForegroundColor White
    Write-Host "  ssh root@${SERVER}" -ForegroundColor DarkGray
    Write-Host "  密码: $PASSWORD" -ForegroundColor DarkGray
    Write-Host "  然后执行:" -ForegroundColor DarkGray
    Write-Host "    chmod 755 $REMOTE_DIR" -ForegroundColor DarkGray
    Write-Host "    chmod 644 ${REMOTE_DIR}/index.html" -ForegroundColor DarkGray
    Write-Host "    chown -R www:www $REMOTE_DIR || chown -R nginx:nginx $REMOTE_DIR" -ForegroundColor DarkGray
    Write-Host "    nginx -t && systemctl reload nginx" -ForegroundColor DarkGray
    Write-Host ""

    # 尝试用 ssh 的 StdinPipe 方法 (PowerShell)
    Write-Host "正在尝试通过 PowerShell 方式连接..." -ForegroundColor Yellow
    
    # 使用 .NET TCPClient 检测端口连通性
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $tcp.Connect($SERVER, 22)
        Write-Host "[+] Server SSH port 22 reachable!" -ForegroundColor Green
        $tcp.Close()
    } catch {
        Write-Host "[-] Cannot connect to Server SSH port." -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Please install PuTTY and run this script again, or execute the commands manually." -ForegroundColor Yellow
    Write-Host "PuTTY download: https://www.putty.org/" -ForegroundColor Cyan
}

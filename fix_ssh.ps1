# 由于服务器禁用了密码认证，需要通过控制台或VNC登录服务器后执行以下命令：

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  服务器 SSH 配置修复指南" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "由于服务器禁用了密码认证，需要通过以下方式修复：" -ForegroundColor Yellow
Write-Host ""
Write-Host "方法1: 通过腾讯云/阿里云控制台登录（推荐）" -ForegroundColor Green
Write-Host "-----------------------------------------------------------"
Write-Host "1. 登录你的云服务商控制台"
Write-Host "2. 找到服务器 124.156.180.128"
Write-Host "3. 使用'一键登录'或'VNC登录'功能"
Write-Host "4. 登录后执行以下命令："
Write-Host ""
Write-Host "   sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config" -ForegroundColor White
Write-Host "   sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config" -ForegroundColor White
Write-Host "   sed -i 's/^PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config" -ForegroundColor White
Write-Host "   sed -i 's/^#PermitRootLogin/PermitRootLogin yes/' /etc/ssh/sshd_config" -ForegroundColor White
Write-Host "   systemctl restart sshd" -ForegroundColor White
Write-Host ""
Write-Host "方法2: 如果你有密钥文件" -ForegroundColor Green
Write-Host "-----------------------------------------------------------"
Write-Host "1. 找到你的 .pem 或 .key 密钥文件"
Write-Host "2. 执行：ssh -i 密钥文件路径 root@124.156.180.128"
Write-Host ""
Write-Host "方法3: 通过其他已登录的机器" -ForegroundColor Green
Write-Host "-----------------------------------------------------------"
Write-Host "如果有其他机器已经登录了该服务器，可以从那里修改配置"
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# 生成一键修复命令文件
$fixCmd = @"
#!/bin/bash
# SSH 修复脚本 - 在服务器上执行
sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin yes/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart sshd
echo "SSH 配置已修复，现在可以使用密码登录"
"@

$fixCmd | Out-File -FilePath "fix_ssh_remote.sh" -Encoding UTF8
Write-Host "已生成 fix_ssh_remote.sh，上传到服务器后执行即可修复" -ForegroundColor Green

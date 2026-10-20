#!/bin/bash
# SSH 淇鑴氭湰 - 鍦ㄦ湇鍔″櫒涓婃墽琛?
sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin yes/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart sshd
echo "SSH 閰嶇疆宸蹭慨澶嶏紝鐜板湪鍙互浣跨敤瀵嗙爜鐧诲綍"

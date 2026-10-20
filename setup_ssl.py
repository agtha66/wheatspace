import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("124.156.180.128", 22, "root", "3.1415926535aaS")

def run(cmd):
    print(f"> {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print("OUT:", out)
    if err: print("ERR:", err)
    return out

run("curl https://get.acme.sh | sh")
run("~/.acme.sh/acme.sh --register-account -m test@wheatspace.top")
run("~/.acme.sh/acme.sh --issue -d wheatspace.top -d www.wheatspace.top --webroot /www/wwwroot/wheatspace.top")

run("mkdir -p /www/server/panel/vhost/cert/wheatspace.top")

run("~/.acme.sh/acme.sh --install-cert -d wheatspace.top --key-file /www/server/panel/vhost/cert/wheatspace.top/privkey.pem --fullchain-file /www/server/panel/vhost/cert/wheatspace.top/fullchain.pem")

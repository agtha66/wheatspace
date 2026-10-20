import paramiko
s=paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('124.156.180.128', username='root', password='3.1415926535aaS')
_, stdout, _ = s.exec_command('nginx -T')
out = stdout.read().decode('utf-8', errors='ignore')
for block in out.split("server {"):
    if "wheatspace.top" in block:
        print("----- SERVER BLOCK -----")
        print(block[:1000])

import paramiko
s=paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('124.156.180.128', username='root', password='3.1415926535aaS')

_, stdout, _ = s.exec_command('cd /www/wwwroot/wheatspace.top && npm install @alicloud/dysmsapi20170525 @alicloud/openapi-client @alicloud/tea-util @alicloud/credentials --production')
print(stdout.read().decode())

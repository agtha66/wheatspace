import paramiko

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('124.156.180.128', username='root', password='3.1415926535aaS')

_, stdout, _ = s.exec_command('curl -s -X POST http://wheatspace.top/api/admin/login -H "Content-Type: application/json" -d \'{"email":"admin@wheatspace.top", "password":"admin"}\'')
print(stdout.read().decode())

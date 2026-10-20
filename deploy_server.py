import paramiko

s = paramiko.SSHClient()
s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
s.connect('124.156.180.128', username='root', password='3.1415926535aaS')

print("Uploading updated frontend files...")
sftp = s.open_sftp()
sftp.put('other/auth.js', '/www/wwwroot/wheatspace.top/auth.js')
sftp.put('other/admin.html', '/www/wwwroot/wheatspace.top/admin.html')
sftp.put('other/index.html', '/www/wwwroot/wheatspace.top/index.html')
sftp.close()

print("Frontend files uploaded.")

import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("124.156.180.128", 22, "root", "3.1415926535aaS")
def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip(), stderr.read().decode().strip()

print("OS:", run("cat /etc/os-release"))

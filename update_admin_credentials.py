"""Securely update the WheatSpace admin login on the production server.

Run from this project folder with: python update_admin_credentials.py
Passwords are requested through getpass and are never written to the local disk.
"""

from __future__ import annotations

import getpass
import json
import sys
from datetime import datetime, timezone

import paramiko


HOST = "wheatspace.top"
USERNAME = "root"
REMOTE_DATA = "/www/wwwroot/wheatspace.top/data.json"
EMAIL = "imhappyxixi@163.com"


def main() -> int:
    ssh_password = getpass.getpass(
        f"SSH password for {USERNAME}@{HOST} (press Enter to use your SSH key): "
    )
    new_password = getpass.getpass("New admin password (12+ characters): ")
    confirm_password = getpass.getpass("Confirm new admin password: ")

    if new_password != confirm_password:
        print("Passwords did not match. No changes made.", file=sys.stderr)
        return 1
    if len(new_password) < 12:
        print("Choose a password with at least 12 characters. No changes made.", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.RejectPolicy())
    try:
        client.connect(
            HOST,
            username=USERNAME,
            password=ssh_password,
            look_for_keys=True,
            allow_agent=True,
            timeout=15,
            auth_timeout=20,
            banner_timeout=20,
        )
        sftp = client.open_sftp()
        try:
            with sftp.open(REMOTE_DATA, "rb") as remote_file:
                original = remote_file.read()
            data = json.loads(original.decode("utf-8"))
            if not isinstance(data, dict) or not isinstance(data.get("admin"), dict):
                raise ValueError("Remote data file has no admin object; nothing changed.")

            data["admin"]["email"] = EMAIL
            data["admin"]["password"] = new_password
            updated = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8")

            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            backup_path = f"{REMOTE_DATA}.backup-{stamp}"
            temp_path = f"{REMOTE_DATA}.tmp-{stamp}"
            with sftp.open(backup_path, "wb") as backup:
                backup.write(original)
            with sftp.open(temp_path, "wb") as temp:
                temp.write(updated)
            sftp.posix_rename(temp_path, REMOTE_DATA)
        finally:
            sftp.close()

        # The app loads data.json into memory at startup; restart it so the new
        # credentials take effect. Deployment configuration names it wheatspace-api.
        _stdin, stdout, stderr = client.exec_command("pm2 restart wheatspace-api")
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0:
            error = stderr.read().decode("utf-8", errors="replace").strip()
            print(
                "Credentials were written and backed up, but PM2 could not restart "
                f"wheatspace-api. Restart it on the server manually. {error}",
                file=sys.stderr,
            )
            print(f"Backup: {backup_path}")
            return 2

        print(f"Updated admin email to {EMAIL} and restarted the service.")
        print(f"Server backup: {backup_path}")
        return 0
    except Exception as exc:
        print(f"Update failed: {exc}. Check SSH access and the server data file.", file=sys.stderr)
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())

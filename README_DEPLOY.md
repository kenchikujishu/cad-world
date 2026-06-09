# dropworld.space Deployment Notes

This project is prepared for a GitHub Actions to ConoHa WING FTP deployment.

## Public Site

- Domain: `dropworld.space`
- Storefront: `https://dropworld.space/`
- Admin demo: `https://dropworld.space/admin.html`

## GitHub Repository

- Account: `kenchikujishu`
- Repository: `cad-world`
- Recommended visibility while building: `private`

## GitHub Actions Secrets

Add these in GitHub:

`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`

| Secret name | Value |
| --- | --- |
| `CONOHA_FTP_SERVER` | FTP server host from ConoHa |
| `CONOHA_FTP_USERNAME` | FTP username from ConoHa |
| `CONOHA_FTP_PASSWORD` | FTP password from ConoHa |
| `CONOHA_FTP_PORT` | `21` for FTP |
| `CONOHA_REMOTE_DIR` | Usually `public_html/dropworld.space/` |

Do not commit FTP passwords, API keys, SSH keys, or ConoHa account credentials.

## ConoHa WING Checks

Before the first deploy, confirm the actual document root in ConoHa File Manager.
It is usually under:

```text
/home/<server-account>/public_html/dropworld.space/
```

For the FTP Deploy Action, `CONOHA_REMOTE_DIR` is usually relative to the FTP login root:

```text
public_html/dropworld.space/
```

If ConoHa shows a different folder for `dropworld.space`, use that folder instead.

## Current Demo Limitation

The admin screen is a front-end demo. Product edits are saved in browser local storage.
For production, replace this with a real server-side login, database, and file upload storage.

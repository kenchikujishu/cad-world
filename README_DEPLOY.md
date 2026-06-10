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

The workflow also accepts shorter aliases if you already created them:

```text
FTP_SERVER
FTP_USERNAME
FTP_PASSWORD
FTP_PORT
FTP_REMOTE_DIR
FTP_SERVER_DIR
```

Alternatively, you can keep all settings in one repository secret named `CONOHA_DROP`:

```text
CONOHA_FTP_SERVER = your-ftp-server
CONOHA_FTP_USERNAME = your-ftp-username
CONOHA_FTP_PASSWORD = your-ftp-password
CONOHA_FTP_PORT = 21
CONOHA_REMOTE_DIR = public_html/dropworld.space/
```

If the deploy job says `FTP_SERVER is empty`, the secret exists under a different name, in another repository, or only under an Environment that the workflow job is not using.

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

## Catalog Database and R2

The storefront has a local fallback database at:

```text
data/catalog.json
```

For live operation, set `DROPWORLD_API_BASE_URL` so GitHub Actions writes `data/site-config.json` during deploy. Public pages will then read the live catalog from the Cloudflare Worker:

```text
GET {DROPWORLD_API_BASE_URL}/catalog
```

The Worker stores the catalog database in the public R2 bucket:

```text
database/catalog.json
```

Product records store Cloudflare R2 object keys for:

```text
assets.package.key
assets.previewPrimary.key
assets.previewSecondary.key
settings.watermarkAsset.key
```

Preview images and watermark assets live in the public bucket. CAD package files live in the private bucket and are downloaded through the Worker after checkout or the current demo purchase button.

For more detail, see `README_R2_WORKER.md`.

## Admin Upload Flow

The admin screen can save locally for demo use, or upload through the Worker API.

To use R2 uploads:

1. Deploy the Cloudflare Worker with the `Deploy Cloudflare Worker` workflow.
2. Add `DROPWORLD_API_BASE_URL` in GitHub Secrets.
3. Re-run the ConoHa deploy.
4. Open `admin.html` -> Storage.
5. Enter the Worker API URL and `DROPWORLD_ADMIN_TOKEN`.
6. Click `Test API`.

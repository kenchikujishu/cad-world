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

The storefront now reads product metadata from:

```text
data/catalog.json
```

This JSON file is the current lightweight database. Product records store Cloudflare R2 object keys for:

```text
assets.package.key
assets.previewPrimary.key
assets.previewSecondary.key
settings.watermarkAsset.key
```

When R2 public URLs are available, put them in each asset's `url` field. Until then, local preview URLs can stay in the same fields for visual testing.

R2 should hold the actual CAD zip files and preview PNG files. GitHub/ConoHa holds the public HTML/CSS/JS and `data/catalog.json`.

## Current Admin Limitation

The admin screen loads `data/catalog.json` first, then saves edits to browser local storage for the current demo. Use `Reload DB` to discard local edits and reload the JSON database. Use `Export JSON` after edits to download the next catalog file that should replace `data/catalog.json`.

For production, add a server-side write API so admin edits upload files to R2 and update the catalog database automatically.

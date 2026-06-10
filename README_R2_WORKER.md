# DROP WORLD R2 / Worker Setup

This project uses a static ConoHa storefront plus a Cloudflare Worker API.

## Buckets

- `R2_PUBLIC_BUCKET`: public previews, watermark, and `database/catalog.json`
- `R2_PRIVATE_BUCKET`: purchased ZIP / AI / PDF / DWG packages

Recommended names:

- `dropworld-assets`
- `dropworld-products`

Do not enable public access for the private bucket.

## GitHub Actions Secrets

Already used by the static ConoHa deploy:

- `CONOHA_FTP_SERVER`
- `CONOHA_FTP_USERNAME`
- `CONOHA_FTP_PASSWORD`
- `CONOHA_FTP_PORT`
- `CONOHA_REMOTE_DIR`

Needed for Worker deploy:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `R2_PUBLIC_BUCKET`
- `R2_PRIVATE_BUCKET`
- `DROPWORLD_ADMIN_TOKEN`
- `DROPWORLD_DOWNLOAD_SECRET`

Recommended for public URLs:

- `R2_PUBLIC_BASE_URL`
- `DROPWORLD_API_BASE_URL`

`DROPWORLD_ADMIN_TOKEN` is the password-like token entered in `admin.html` → Storage → Worker API. It should be a long random value.

`DROPWORLD_DOWNLOAD_SECRET` signs short-lived demo download links. Use a different long random value.

## Flow

1. Run the `Deploy Cloudflare Worker` workflow manually.
2. Copy the deployed Worker URL.
3. Add it as `DROPWORLD_API_BASE_URL` in GitHub Secrets.
4. Run the ConoHa deploy again.
5. Open `admin.html`, enter the Worker URL and `DROPWORLD_ADMIN_TOKEN`, then test the API.

After that:

- Admin uploads preview images to the public R2 bucket.
- Admin uploads product packages to the private R2 bucket.
- The Worker writes `database/catalog.json` into the public R2 bucket.
- Public pages read the live catalog through the Worker when `DROPWORLD_API_BASE_URL` is set.
- Product pages use `purchase-demo` to create a short private download URL.

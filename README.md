
# Cloudflare D1 Comments & Ratings — Full Working Template

This template deploys a static site on **Cloudflare Pages** with a simple UI (`index.html`) and a **Pages Function** (`/functions/api/feedback.js`) that saves and retrieves comments & star ratings from **Cloudflare D1**. Optional **Turnstile** integration is included for spam protection.

## Quick Start

1. **Create a D1 database** (Dashboard → Workers & Pages → D1 → *Create database*). Note the **Database ID** and **Name**.
2. **Create a Pages project** and connect this repository.
3. In the Pages project **Settings → Functions → D1 bindings**, add a binding named **`DB`** pointing to your D1 database.
4. (Optional) In **Settings → Environment variables**, add `TURNSTILE_SECRET` with your Turnstile secret key.
5. **Initialize schema**: open the D1 SQL console (Dashboard → D1 → your DB → SQL) and paste contents of `schema.sql`.
6. **Deploy**: Push to your repo. Pages will build and deploy; your function will be live at `/api/feedback`.

## Local development

Install Wrangler and run:

```bash
npm i -g wrangler
wrangler dev
```

The minimal `wrangler.toml` here binds `DB` for local dev. Replace `database_id` with your D1 database ID.

## Endpoints

- `GET /api/feedback?page=<slug>` → list recent feedback for a page.
- `POST /api/feedback` → body `{ page_slug, rating (1-5), username?, comment, turnstileToken? }`.

If `TURNSTILE_SECRET` is set, the function will validate a Turnstile token.

## Files

- `index.html` — simple UI to submit ratings & comments and render the latest list.
- `functions/api/feedback.js` — Pages Function backend.
- `schema.sql` — D1 schema.
- `wrangler.toml` — local dev binding for D1.

## Notes

- Turnstile client-side script is included in `index.html`. Set your `data-sitekey`.
- For production, consider moderation (add a `status` column) and rate limiting.


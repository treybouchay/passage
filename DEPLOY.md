# Deploy Passage to DigitalOcean (mypassage.io)

Passage runs as **two App Platform components** behind one domain:

| Component | Role |
|-----------|------|
| **web** (static site) | Vite build → `dist/` at `https://mypassage.io` |
| **api** (Node service) | Express API at `https://mypassage.io/api/*` |

Stripe and Printful stay in **mock mode** until you add keys (no code changes needed).

---

## 1. Create the app on DigitalOcean

1. Sign in at [cloud.digitalocean.com](https://cloud.digitalocean.com).
2. **Apps** → **Create App** → **GitHub** → authorize → select **`treybouchay/passage`**, branch **`main`**.
3. When asked for resources, choose **Edit your app spec** and paste the contents of [`.do/app.yaml`](.do/app.yaml), or upload that file.
4. Confirm components:
   - Static site `web` (root, build `npm ci && npm run build`, output `dist`)
   - Service `api` (source dir `server`, port `3001`, volume `passage-data` mounted at `/data`)
5. **Create Resources** and wait for the first deploy.

---

## 2. Connect mypassage.io

1. In the app → **Settings** → **Domains**, add **`mypassage.io`** and **`www.mypassage.io`** (already in the spec).
2. DigitalOcean shows DNS records (usually **CNAME** for `www` and **A/ALIAS** for apex).
3. At your domain registrar (where you bought `mypassage.io`), add those records.
4. Wait for DNS + SSL (often 15–60 minutes). The app URL will work before the custom domain propagates.

---

## 3. Environment variables (API service)

In **Apps → passage → api → Settings → Environment variables**:

| Variable | Required now | Value |
|----------|----------------|-------|
| `CLIENT_ORIGIN` | Yes | `https://mypassage.io` |
| `DATA_DIR` | Yes | `/data` (matches volume mount in spec) |
| `NODE_ENV` | Yes | `production` |
| `TICKETMASTER_API_KEY` | Optional | Your Ticketmaster Discovery key (concerts) |
| `STRIPE_SECRET_KEY` | Later | Live/test secret when enabling payments |
| `STRIPE_WEBHOOK_SECRET` | Later | From Stripe webhook endpoint |
| `PRINTFUL_API_KEY` | Later | Printful API key |
| `MOCK_PAYMENTS` | Optional | Leave unset (mock when no Stripe key) |
| `MOCK_PRINTFUL` | Optional | Leave unset (mock when no Printful key) |

**Do not** set `VITE_API_URL` on the static site in production — leave it empty so the browser calls `/api` on the same origin.

Redeploy after changing env vars.

---

## 4. Verify

- `https://mypassage.io` — app loads, passages / prayer / music work (data in browser localStorage).
- `https://mypassage.io/api/health` — JSON with `"ok": true`.
- Print checkout — works in **mock** mode (no charge) until Stripe is configured.

---

## 5. Enable Stripe later (prints)

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers → Webhooks** → add endpoint:
   - URL: `https://mypassage.io/api/webhooks/stripe`
   - Events: `checkout.session.completed`
2. Set on the **api** component:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Remove or set `MOCK_PAYMENTS=false` only after keys are set (mock is automatic when `STRIPE_SECRET_KEY` is empty).
4. Test in **Test mode** before going live.

---

## 6. Enable Printful later

1. Create a [Printful](https://www.printful.com) store and API key.
2. Set `PRINTFUL_API_KEY` on the api component.
3. Fill in `PRINTFUL_VARIANTS` in `server/src/config.ts` with real catalog variant IDs (size × frame).
4. Test a mock-payment order end-to-end before turning on Stripe live.

---

## 7. Costs (rough)

- **Static site**: low / often free tier eligible.
- **API** (`basic-xxs`): ~$5/mo.
- **Volume** (1 GB): ~$1/mo.
- **Domain**: registrar only (you already own `mypassage.io`).

---

## 8. Deploy updates

Pushes to **`main`** auto-deploy if `deploy_on_push: true` (default in spec).

Manual redeploy: App → **Actions** → **Force rebuild and deploy**.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 404 on `/api/*` | Check **ingress** rules: `/api` → `api`, `/` → `web` |
| CORS errors | `CLIENT_ORIGIN` must exactly match `https://mypassage.io` |
| Print designs lost after redeploy | Confirm volume mounted at `/data` and `DATA_DIR=/data` |
| Stripe webhook fails | URL must be public HTTPS; use raw body route (already configured) |

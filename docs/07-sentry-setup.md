# Sentry Setup

Guide for adding [Sentry](https://sentry.io) error monitoring to `mikebagwell.me`.

This site is **Astro `output: 'static'`** on **Cloudflare Pages** — there is no Node/SSR runtime. That means:

- **Client-side (browser) Sentry** catches JS errors on the page (motion scripts, React islands, form UX, etc.).
- **Server-side Sentry** only applies if you later add Cloudflare Pages Functions / an Astro SSR adapter. Skip server setup until then.

Follow Part A (account) → Part B (project) → Part C (install in this repo) → Part D (Cloudflare env + verify).

---

## Part A — Create a Sentry account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/).
2. Sign up with GitHub/Google/email (Developer plan is free and enough to start).
3. Complete the org wizard:
   - **Organization name:** e.g. `mike-bagwell` or your GitHub org
   - Skip installing a platform in the wizard if it pushes you into a different stack — you’ll create the project manually next.

---

## Part B — Create a project

1. In Sentry: **Projects → Create Project**.
2. Platform: **Astro** (or **JavaScript** / **Browser** if Astro isn’t listed — same client SDK family).
3. Alert frequency: default is fine.
4. **Project name:** `mike-bagwell-site`
5. Create the project.
6. On the setup screen, copy the **DSN** — looks like:

   ```
   https://<key>@o<orgId>.ingest.sentry.io/<projectId>
   ```

   You’ll also need it as a `PUBLIC_` env var for the browser bundle.

### Optional: auth token for source maps

Source maps make stack traces point at your TypeScript/Astro source instead of minified bundles.

1. Sentry → **Settings → Account → Auth Tokens** (or **Organization → Developer Settings → Auth Tokens**).
2. Create a token with at least:
   - `project:releases`
   - `org:read`
   - (and whatever Sentry’s Astro wizard currently requests for uploads)
3. Save it somewhere safe — you’ll put it in Cloudflare as `SENTRY_AUTH_TOKEN` (secret, build-time only).

---

## Part C — Install in this Astro repo

Official docs: [https://docs.sentry.io/platforms/javascript/guides/astro/](https://docs.sentry.io/platforms/javascript/guides/astro/)

### 1. Install the SDK

```bash
npx astro add @sentry/astro
```

Or manually:

```bash
npm install @sentry/astro
```

### 2. Wire the integration

In `astro.config.mjs`:

```js
import sentry from '@sentry/astro';

export default defineConfig({
  // ...existing config
  integrations: [
    // ...existing integrations
    sentry({
      dsn: process.env.SENTRY_DSN,
      sourceMapsUploadOptions: {
        // Only uploads when SENTRY_AUTH_TOKEN is present (CI / Cloudflare build)
        org: 'YOUR_ORG_SLUG',
        project: 'mike-bagwell-site',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
});
```

Replace `YOUR_ORG_SLUG` with the slug from Sentry (**Settings → Organization → General**).

### 3. Client config

Create `sentry.client.config.ts` at the project root (Sentry’s Astro integration loads this automatically):

```ts
import * as Sentry from '@sentry/astro';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.PROD ? 'production' : 'development',
  // Static portfolio: low traffic — 10% of transactions is plenty
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  // Ignore noisy browser extensions / ad blockers if they show up later
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
});
```

### 4. Server config (skip for now)

`sentry.server.config.ts` is for SSR. This site is static — **do not add** Cloudflare `@sentry/cloudflare` / `functions/_middleware.js` unless you introduce Pages Functions or switch off `output: 'static'`.

If you later add SSR on Cloudflare, follow:
[Astro on Cloudflare (Sentry)](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/astro/)

### 5. Local env

Add to `.env` (never commit secrets):

```bash
PUBLIC_SENTRY_DSN=https://<key>@o<orgId>.ingest.sentry.io/<projectId>
SENTRY_DSN=https://<key>@o<orgId>.ingest.sentry.io/<projectId>
SENTRY_AUTH_TOKEN=sntrys_...
```

`PUBLIC_SENTRY_DSN` and `SENTRY_DSN` are usually the **same DSN**. Astro needs the `PUBLIC_` prefix for client code; the integration may also read `SENTRY_DSN` at build time.

### 6. Smoke-test locally

```bash
npm run build && npm run preview
```

Temporarily add a throw (or button) on a page:

```js
throw new Error('Sentry test error');
```

Confirm the event appears in Sentry → **Issues**. Remove the test throw.

---

## Part D — Cloudflare Pages environment

1. Cloudflare dashboard → **Workers & Pages** → your Pages project.
2. **Settings → Environment variables** → Production (and Preview if you want):

| Variable | Type | Notes |
| --- | --- | --- |
| `PUBLIC_SENTRY_DSN` | Plaintext | Same DSN; required in the browser bundle |
| `SENTRY_DSN` | Secret or plaintext | Build/integration |
| `SENTRY_AUTH_TOKEN` | **Secret** | Source map upload during `npm run build` |
| `SENTRY_ORG` | Plaintext (optional) | If you prefer env over hardcoding the org slug |
| `SENTRY_PROJECT` | Plaintext (optional) | e.g. `mike-bagwell-site` |

3. Redeploy (or push a commit) so the new vars are baked into the build.
4. Open the live site, trigger a test error once, confirm it lands under **environment: production**.

---

## Part E — Alerts & hygiene (recommended)

1. **Alerts:** Project → **Alerts → Create Alert** → “Issues” when a new issue is created → email (or Slack).
2. **Release health:** source maps + a consistent release name (Sentry Astro integration sets this when auth token is present).
3. **Quota:** free tier has a monthly event limit — with `tracesSampleRate: 0.1` and no SSR, a personal site should stay well under it.
4. **Privacy:** this site has no logged-in users; still avoid sending PII. Don’t put form field values into `Sentry.captureMessage` / extras.

---

## Checklist

- [ ] Sentry org + Astro/JS project created  
- [ ] DSN copied  
- [ ] Optional auth token created for source maps  
- [ ] `@sentry/astro` installed and added to `astro.config.mjs`  
- [ ] `sentry.client.config.ts` present  
- [ ] Local `.env` has `PUBLIC_SENTRY_DSN` (+ `SENTRY_DSN` / auth token)  
- [ ] Cloudflare Pages env vars set  
- [ ] Test error appears in Sentry Issues on production  
- [ ] Alert rule for new issues  

## When you don’t need Sentry yet

If the only client JS is decorative motion and a contact form that posts to Web3Forms, Sentry is optional. Add it when you want visibility into production JS failures — especially after shipping GSAP/React islands — or before a bigger interactive feature.

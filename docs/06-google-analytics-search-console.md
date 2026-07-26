# Google Analytics 4 & Search Console

Step-by-step setup for `mikebagwell.me` (Astro static site on Cloudflare Pages). Do this after the site is live on the custom domain.

## What you get

| Tool | Purpose |
| --- | --- |
| **Google Analytics 4 (GA4)** | Traffic, page views, events, referrals |
| **Google Search Console (GSC)** | Indexing, search queries, crawl errors, sitemap status |

Use the **same Google account** for both so you can verify GSC via GA4 and link the two later.

---

## Part A — Google Analytics 4

### 1. Create a GA4 property

1. Go to [https://analytics.google.com](https://analytics.google.com) and sign in.
2. Click **Admin** (gear, bottom left).
3. Under **Account**, create an account if you don’t have one (e.g. “Mike Bagwell”).
4. Under **Property**, click **Create property**:
   - **Property name:** `mikebagwell.me`
   - **Reporting time zone:** your local zone
   - **Currency:** USD (or preference)
5. Answer the business info prompts (they don’t affect tracking).
6. Choose **Web** as the platform when asked to set up a data stream.

### 2. Create a Web data stream

1. **Website URL:** `https://mikebagwell.me`
2. **Stream name:** `mikebagwell.me`
3. Click **Create stream**.
4. Copy the **Measurement ID** — it looks like `G-XXXXXXXXXX`.

Keep this tab open; you’ll need the ID and the snippet.

### 3. Add the gtag snippet to the site

Preferred place: `src/layouts/Base.astro` inside `<head>`, so every page gets it.

1. In the project root, add to `.env` (local) and Cloudflare Pages → **Settings** → **Environment variables** (production):

   ```bash
   PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

   Astro only exposes env vars prefixed with `PUBLIC_` to the browser.

2. In `Base.astro` `<head>`, after the SEO component, add:

   ```astro
   {import.meta.env.PUBLIC_GA_MEASUREMENT_ID && (
     <>
       <script
         async
         src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_GA_MEASUREMENT_ID}`}
       />
       <script
         is:inline
         define:vars={{ gaId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID }}
       >
         window.dataLayer = window.dataLayer || [];
         function gtag() {
           dataLayer.push(arguments);
         }
         gtag('js', new Date());
         gtag('config', gaId);
       </script>
     </>
   )}
   ```

3. Commit, push, wait for Cloudflare Pages to deploy.
4. Visit `https://mikebagwell.me`, then in GA4 go to **Reports → Realtime**. You should see yourself within a minute or two.

### 4. Optional: exclude your own traffic

In GA4 **Admin → Data streams → your stream → Configure tag settings → Define internal traffic**, add your home/office IP, then create a filter that excludes `traffic_type = internal`. Useful so author browsing doesn’t inflate stats.

---

## Part B — Google Search Console

### 1. Add the property

1. Go to [https://search.google.com/search-console](https://search.google.com/search-console).
2. Click **Add property**.
3. Prefer a **Domain** property (`mikebagwell.me`) if you control DNS at Cloudflare — it covers `http`/`https` and `www`/apex in one place.
4. Or use **URL prefix** `https://mikebagwell.me/` if you only want that exact host.

### 2. Verify ownership

Pick one method. **Recommended for this project:** Domain DNS (Cloudflare) or HTML file.

#### Option A — Domain DNS (best if Cloudflare manages DNS)

1. Choose **Domain** property → Google shows a TXT record.
2. In Cloudflare DNS for `mikebagwell.me`, add:

   - **Type:** TXT  
   - **Name:** `@` (or the hostname Google shows)  
   - **Content:** the Google verification string  
   - **Proxy status:** DNS only is fine for TXT

3. Wait a few minutes (sometimes up to an hour), return to GSC, click **Verify**.

#### Option B — HTML file upload

1. Download the `googleXXXX.html` file from GSC.
2. Put it in `public/` so it deploys to `https://mikebagwell.me/googleXXXX.html`.
3. Confirm the URL loads in a browser, then click **Verify**.

#### Option C — HTML meta tag

1. Copy the meta tag from GSC.
2. Add it in `Base.astro` `<head>` (or only on the homepage if you prefer).
3. Deploy, then **Verify**.

#### Option D — Via Google Analytics

Only works if:

- GA4 gtag is in the **homepage `<head>`** (not via Tag Manager alone), and  
- You use the **same Google account** with edit access in GA4.

Then choose **Google Analytics** in GSC and click **Verify**.

### 3. Submit the sitemap

This site already generates a sitemap via `@astrojs/sitemap`.

1. In GSC, open **Sitemaps**.
2. Submit: `https://mikebagwell.me/sitemap-index.xml`
3. Status should move to **Success** after Google fetches it (can take hours).

### 4. Request indexing for key URLs (optional)

1. Use the **URL Inspection** bar at the top.
2. Paste important URLs (`/`, `/writing/`, `/books/`, …).
3. Click **Request indexing** for a few high-priority pages. Don’t spam every URL — the sitemap covers the rest.

### 5. Link GSC ↔ GA4

1. In GA4: **Admin → Product links → Search Console links → Link**.
2. Select your verified GSC property and the web data stream.
3. After linking, Search Console reports appear under GA4 **Reports → Acquisition / Search Console** (data can lag 24–48 hours).

---

## Checklist

- [ ] GA4 property + web stream created; Measurement ID saved  
- [ ] `PUBLIC_GA_MEASUREMENT_ID` set in Cloudflare Pages + local `.env`  
- [ ] gtag snippet in `Base.astro` `<head>` and live on production  
- [ ] Realtime report shows a visit  
- [ ] Search Console property verified (DNS / file / meta / GA)  
- [ ] Sitemap `sitemap-index.xml` submitted  
- [ ] GSC linked to GA4  

## Notes for this repo

- Site URL in `astro.config.mjs` is already `https://mikebagwell.me` — keep that in sync with GA/GSC.
- Trailing slashes are enabled (`trailingSlash: 'always'`). Prefer trailing-slash URLs in GSC inspections.
- Do **not** commit real Measurement IDs into git if you prefer env-only config; `PUBLIC_` vars are fine in client HTML either way (the ID is public by design once shipped).

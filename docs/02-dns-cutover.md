# DNS: Point mikebagwell.me to Cloudflare Pages

How the custom domain is wired to Cloudflare Pages. The registrar for `mikebagwell.me` is DreamHost; Cloudflare manages DNS and Pages hosting.

## Before changing DNS

- ✅ Astro site builds successfully on Cloudflare Pages
- ✅ Site works at your `<project-name>.pages.dev` URL
- ✅ Content, images, and pages look correct on the preview URL
- ✅ Ready for propagation (15 minutes to 48 hours globally)

## Overview: Two Paths

1. **Recommended: Full Cloudflare DNS (via nameservers)** — Cloudflare manages all DNS; automatic SSL, CDN, and one-click custom domain setup
2. **Fallback: External DNS with CNAME** — Keep DNS at DreamHost; add a CNAME manually (apex domain limitations)

This guide focuses on **Path 1**. Path 2 is at the end for reference.

---

## Path 1: Full Cloudflare DNS (Recommended)

Cloudflare becomes the authoritative DNS provider; you point DreamHost nameservers at Cloudflare.

### Step 1: Add Your Domain to Cloudflare (Create a Zone)

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Click **Add a Site** (or **Websites > Add a Site** in the sidebar)
3. Enter your domain: `mikebagwell.me`
4. Click **Add site**
5. Select the **Free** plan
6. Click **Continue**

### Step 2: Review DNS Records (Cloudflare Auto-Import)

1. Cloudflare scans existing DNS records
2. Review A, CNAME, MX, TXT, etc.
3. Keep **MX** (and other email-related) records intact if you use DreamHost or another provider for mail
4. Click **Continue**

> Cloudflare creates the web records you need when you attach the custom domain to Pages. You mainly need to preserve mail and any other non-web records.

### Step 3: Update Nameservers at DreamHost

Cloudflare will display two custom nameservers (something like):

```
nora.ns.cloudflare.com
zack.ns.cloudflare.com
```

**Copy these nameservers**, then in DreamHost:

1. Log in to the [DreamHost Panel](https://panel.dreamhost.com/)
2. Navigate to **Domains > Manage Domains**
3. Find `mikebagwell.me`
4. Click **DNS** (or **Edit**)
5. In **Nameservers**, replace the current values with Cloudflare’s two nameservers
6. **Save**

> DreamHost may label this “Change nameservers” / “Use custom nameservers.” Choose the option that lets you use another host’s nameservers.

### Step 4: Wait for Nameserver Propagation

1. In Cloudflare, click **Done, check nameservers**
2. Propagation can take **15 minutes to 48 hours** (often a few hours)
3. Cloudflare emails when the zone is active
4. Or check with `dig NS mikebagwell.me` / `nslookup -type=NS mikebagwell.me`

### Step 5: Add Custom Domain in Cloudflare Pages

Once the zone is **Active**:

1. Go to **Workers & Pages** → your Pages project (`mike-bagwell-site`)
2. **Custom domains** → **Set up a custom domain**
3. Enter `mikebagwell.me` → **Continue** → **Activate domain**

Repeat for `www.mikebagwell.me`.

> Apex + www redirect can be configured under **Workers & Pages > [project] > Settings > Redirects**.

### Step 6: Verify SSL Certificate

1. Cloudflare provisions a free SSL cert (usually within ~15 minutes)
2. Custom domains tab should show **Active** with a green check
3. Visit `https://mikebagwell.me` and confirm a valid certificate

### Step 7: Verify DNS Resolution

```bash
dig mikebagwell.me
dig www.mikebagwell.me
nslookup mikebagwell.me
nslookup www.mikebagwell.me
```

You should see Cloudflare IPs (or a CNAME to the Pages project), and the site should load over HTTPS.

### Step 8: Smoke-test the Site

In a private window, confirm pages, images, navigation, and SSL all look good at `https://mikebagwell.me`.

---

## Path 2: External DNS with CNAME (Fallback)

Keeping DNS at DreamHost is possible but not recommended.

### Limitations

- Many providers (including DreamHost) disallow a CNAME at the apex (`mikebagwell.me`)
- You lose easy CDN/WAF benefits unless you proxy through Cloudflare anyway
- SSL setup is more manual

### Steps (if you must)

1. In Pages **Custom domains**, add `www.mikebagwell.me`
2. Note the CNAME target Cloudflare shows (e.g. `<project-name>.pages.dev`)
3. In DreamHost DNS, create:
   - **Name:** `www`
   - **Type:** `CNAME`
   - **Value:** the Pages target
   - **TTL:** 300 (or default)
4. For the apex, either redirect to `www` or use Cloudflare anycast A records (ask Cloudflare for current Pages IPs)

**Prefer Path 1.**

---

## Troubleshooting

### Domain not resolving after nameserver change

- Wait up to 48 hours
- `dig NS mikebagwell.me` — if still DreamHost NS, change hasn’t propagated
- Flush local DNS on macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`

### Too many redirects

- Remove conflicting A + CNAME pairs for the same name
- SSL/TLS mode: **Full** (or **Flexible** only if required)

### Stale site after DNS change

- Private window / clear cache
- Check [whatsmydns.net](https://www.whatsmydns.net/)

### SSL pending

- Wait 15–30 minutes after attaching the custom domain
- Nameservers must be on Cloudflare before the cert can issue

---

## Timeline

| Step | Time |
|------|------|
| Add domain to Cloudflare | Instant |
| Nameserver change at DreamHost | 15 min – 48 hours (typically 1–4 hours) |
| Add custom domain in Pages | Instant |
| SSL provisioning | 5–30 minutes after DNS is active |
| Global DNS cache expiry | 24–48 hours (depends on prior TTL) |

**Plan for 1–4 hours** in most cases.

---

**Need help?**

- Cloudflare DNS: https://developers.cloudflare.com/dns/
- Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/

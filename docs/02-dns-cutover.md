# DNS Cutover: Point mikebagwell.me to Cloudflare Pages

This guide covers moving DNS from Squarespace to Cloudflare and pointing your domain to the new Astro site on Cloudflare Pages.

## ⚠️ Pre-Cutover Checklist

**DO NOT proceed with DNS changes until you've verified:**

- ✅ Your Astro site builds successfully on Cloudflare Pages
- ✅ The site is fully functional at your `<project-name>.pages.dev` URL
- ✅ All content, images, and pages load correctly
- ✅ You've compared the new site against the Squarespace site for content parity
- ✅ You're ready to switch (DNS changes can take 15 minutes to 48 hours to propagate globally)

> **Minimize downtime:** The closer your new site matches the old site, and the more you verify on the `.pages.dev` URL first, the less downtime risk you'll have.

## Overview: Two Paths

There are two ways to point your domain to Cloudflare Pages:

1. **Recommended: Full Cloudflare DNS (via nameservers)** — Cloudflare manages all DNS records; you get automatic SSL, CDN, and one-click custom domain setup
2. **Fallback: External DNS with CNAME** — Keep DNS at Dreamhost; add a CNAME record manually (has limitations for apex domain)

This guide focuses on **Path 1 (Recommended)**. Path 2 is documented at the end for reference.

---

## Path 1: Full Cloudflare DNS (Recommended)

This is the best approach: Cloudflare becomes your authoritative DNS provider, and you point your domain's nameservers (at Dreamhost) to Cloudflare.

### Step 1: Add Your Domain to Cloudflare (Create a Zone)

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Click **Add a Site** (or **Websites > Add a Site** in the sidebar)
3. Enter your domain: `mikebagwell.me`
4. Click **Add site**
5. Select the **Free** plan
6. Click **Continue**

### Step 2: Review DNS Records (Cloudflare Auto-Import)

1. Cloudflare will scan your current DNS records (from Squarespace's DNS)
2. It will show you a list of records it found (A, CNAME, MX, TXT, etc.)
3. Review the list:
   - If you see records pointing to Squarespace (e.g., an A record to a Squarespace IP, or a CNAME to `ext-cust.squarespace.com`), those are fine — you'll replace them with the Pages custom domain setup later
   - If you have **MX records** (email), make sure they're imported correctly (if you use email via Dreamhost or another provider)
4. Click **Continue**

> **Note:** If you don't currently have custom DNS records (Squarespace was managing DNS via their built-in setup), the import may be minimal. That's okay — Cloudflare will create the necessary records when you add the custom domain to Pages.

### Step 3: Update Nameservers at Dreamhost

Cloudflare will display two custom nameservers (something like):

```
nora.ns.cloudflare.com
zack.ns.cloudflare.com
```

**Copy these nameservers** (you'll need them in a moment).

Now, switch to Dreamhost:

1. Log in to the [DreamHost Panel](https://panel.dreamhost.com/)
2. Navigate to **Domains > Manage Domains**
3. Find `mikebagwell.me` in the list
4. Click **DNS** next to the domain (or **Edit** if that's the link)
5. Look for the **Nameservers** section
6. Change the nameservers from the current values to the **two Cloudflare nameservers** provided above
   - Remove any existing nameservers
   - Add the two Cloudflare nameservers (copy-paste them exactly)
7. **Save** the changes

> **Dreamhost UI Note (2026):** Dreamhost's panel may label this as "Change nameservers" or "Use custom nameservers." You're replacing Dreamhost's default nameservers with Cloudflare's. If you see an option like "Use Dreamhost's nameservers" vs. "Use another host's nameservers," choose the latter.

### Step 4: Wait for Nameserver Propagation

1. Back in the Cloudflare dashboard, click **Done, check nameservers**
2. Cloudflare will check periodically (this can take **15 minutes to 48 hours**, but typically happens within a few hours)
3. You'll receive an email from Cloudflare when the nameservers are active
4. You can also check manually:
   - Run `dig NS mikebagwell.me` or `nslookup -type=NS mikebagwell.me`
   - When you see Cloudflare's nameservers in the output, propagation is complete

> **During propagation:** Your site will continue to work via the old Squarespace setup until the nameservers fully propagate. There may be a brief period where some visitors see the old site and others see the new site (depending on their DNS cache). This is normal.

### Step 5: Add Custom Domain in Cloudflare Pages

Once nameservers are active (Cloudflare shows the domain as "Active" in the dashboard):

1. Go to **Workers & Pages** in the Cloudflare dashboard
2. Click your Pages project (`mike-bagwell-site`)
3. Click the **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `mikebagwell.me`
6. Click **Continue**
7. Cloudflare will automatically create the necessary DNS records (a `CNAME` for the apex domain or `AAAA`/`A` records as needed)
8. Click **Activate domain**

Repeat for the `www` subdomain:

1. Click **Set up a custom domain** again
2. Enter: `www.mikebagwell.me`
3. Click **Continue** and **Activate domain**

> **Apex + www handling:** Cloudflare will automatically redirect `www.mikebagwell.me` to `mikebagwell.me` (or vice versa, depending on your preference). You can configure this under **Workers & Pages > [project] > Settings > Redirects**.

### Step 6: Verify SSL Certificate

1. Cloudflare automatically provisions a free SSL certificate for your custom domain
2. This usually happens within 15 minutes of adding the domain
3. Check the **Custom domains** tab — each domain should show a green checkmark with "Active" status
4. Visit `https://mikebagwell.me` in a browser (you should see your new Astro site with a valid SSL certificate)

### Step 7: Verify DNS Resolution

Run these commands to confirm DNS is resolving correctly:

```bash
# Check where the domain points
dig mikebagwell.me

# Check the www subdomain
dig www.mikebagwell.me

# Or use nslookup
nslookup mikebagwell.me
nslookup www.mikebagwell.me
```

You should see:
- The domain resolves to Cloudflare's IP addresses (or a CNAME pointing to your Pages project)
- The site loads at `https://mikebagwell.me` and `https://www.mikebagwell.me`

### Step 8: Test the Site

1. Open `https://mikebagwell.me` in an incognito/private browser window (to avoid cache)
2. Verify:
   - The new Astro site loads (not the old Squarespace site)
   - All images and pages work
   - SSL certificate is valid (no browser warnings)
   - Navigation and links work correctly

---

## Path 2: External DNS with CNAME (Fallback)

If you prefer to keep DNS at Dreamhost (not recommended), you can add a CNAME record manually:

### Limitations
- **Apex domain issue:** Many DNS providers (including Dreamhost) do NOT allow a CNAME at the root/apex (`mikebagwell.me`), only on subdomains like `www`. You may need to use `www.mikebagwell.me` as your primary domain or set up an `A` record to Cloudflare's anycast IPs (which is not ideal for Pages).
- **No Cloudflare CDN/WAF benefits** unless you also enable Cloudflare's proxy (which effectively requires using Cloudflare DNS anyway)
- **Manual SSL:** You'll need to ensure SSL is configured via Dreamhost or another method

### Steps (if you must use this path)

1. In Cloudflare Pages, go to **Custom domains** and add `www.mikebagwell.me`
2. Cloudflare will show you a CNAME target (something like `<project-name>.pages.dev`)
3. In Dreamhost DNS settings, create a CNAME record:
   - **Name/Host:** `www`
   - **Type:** `CNAME`
   - **Value/Target:** `<project-name>.pages.dev` (the value Cloudflare provides)
   - **TTL:** 300 (5 minutes) or the default
4. For the apex domain (`mikebagwell.me`), you'll need to either:
   - Redirect `mikebagwell.me` → `www.mikebagwell.me` at the registrar/host level, OR
   - Use an `A` record to Cloudflare's IP (not ideal; contact Cloudflare support for the current Pages anycast IPs)

**We strongly recommend Path 1** instead.

---

## Troubleshooting

### "Domain is not resolving" after nameserver change
- Wait longer (up to 48 hours for full global propagation)
- Check nameservers with `dig NS mikebagwell.me` — if they still show Dreamhost's nameservers, the change hasn't propagated yet
- Clear your local DNS cache: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` (macOS)

### "Too many redirects" error
- Check that you didn't create conflicting DNS records (e.g., both an A record and a CNAME for the same domain)
- Ensure Cloudflare's SSL setting is **Full** or **Flexible** (under **SSL/TLS > Overview**)

### Old site still showing after DNS change
- Clear your browser cache or use an incognito window
- Check DNS propagation at a tool like [https://www.whatsmydns.net/](https://www.whatsmydns.net/)
- Your ISP's DNS cache may take longer to update

### SSL certificate pending
- Wait 15-30 minutes after adding the custom domain
- If it's still pending after an hour, check that your domain's nameservers are pointing to Cloudflare (SSL can't be provisioned until DNS is fully active)

---

## Timeline Expectations

| Step | Time |
|------|------|
| Add domain to Cloudflare | Instant |
| Nameserver change at Dreamhost | Propagates in 15 min – 48 hours (typically 1-4 hours) |
| Add custom domain in Pages | Instant |
| SSL certificate provisioning | 5-30 minutes after DNS is active |
| Global DNS cache expiry | 24-48 hours (depends on previous TTL settings) |

**Plan for 1-4 hours of transition time** in most cases.

---

## Next Steps

Once your custom domain is live and verified, proceed to:

- **[03-decommission-squarespace.md](./03-decommission-squarespace.md)** — Export a backup and cancel your Squarespace subscription

---

**Need help?** 
- Cloudflare DNS docs: https://developers.cloudflare.com/dns/
- Cloudflare Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/

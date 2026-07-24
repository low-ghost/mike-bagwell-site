# Decommission Squarespace

This guide covers safely exporting your Squarespace content as a backup and canceling your Squarespace subscription after the DNS cutover is complete.

## ⚠️ Pre-Decommission Safety Checklist

**DO NOT cancel Squarespace until you've verified:**

- ✅ Your custom domain (`mikebagwell.me`) resolves to the new Cloudflare Pages site (not Squarespace)
- ✅ The new site loads correctly with HTTPS at `https://mikebagwell.me` and `https://www.mikebagwell.me`
- ✅ All content, images, and pages are present and working on the new site
- ✅ You've visually compared the new site to the old site for content parity
- ✅ Navigation, links, and gallery cards all work correctly
- ✅ SSL certificate is active (no browser warnings)
- ✅ DNS propagation is complete (test from multiple locations/networks if possible)
- ✅ You've monitored the new site for at least 24-48 hours with no issues

> **Why wait?** Once you cancel Squarespace, your old site goes offline permanently. If DNS issues or content problems arise, you'll have no fallback. Give yourself a buffer to catch any issues.

## Step 1: Test Content Parity

Before exporting or canceling, do a final side-by-side comparison:

1. Open the old Squarespace site in one browser tab (you can still access it via the Squarespace internal domain: `https://tangerine-maracas-frk6.squarespace.com`)
2. Open the new Cloudflare Pages site in another tab (`https://mikebagwell.me`)
3. Check:
   - All publication cards appear on the Writing page
   - Images load correctly
   - Bio, book, and design pages match the original content
   - Featured publications display correctly on the home page
   - External links to poems/publications work
   - Contact info or other details are current

If anything is missing, now is the time to add it to the new site (via `scripts/add-publication.mjs` or by editing content files).

## Step 2: Export Squarespace Content (Backup)

Even though you've already extracted content via the Squarespace JSON API (using `scripts/extract-squarespace.mjs`), it's good practice to export an official Squarespace backup.

### Export via Squarespace Dashboard

1. Log in to your [Squarespace account](https://account.squarespace.com/)
2. Click on the site (`mikebagwell.me`) to open the dashboard
3. Go to **Settings > Import/Export**
4. Under **Export**, click **WordPress Export**
5. Squarespace will generate a `.xml` file containing your content (blog posts, pages, and some metadata)
6. Download the file and save it somewhere safe (e.g., `~/backups/squarespace-export-mikebagwell-2026.xml`)

> **Limitations of WordPress Export:** The `.xml` format is primarily for blog content and doesn't include full-resolution images or all page types (like collection pages). However, it's a useful fallback for text content and metadata. Your more complete backup is the extracted JSON and images in your git repo (`src/content/publications/` and `src/assets/publications/`).

### Additional Backup (Optional)

If you want a more complete snapshot:

1. Take screenshots of key pages (home, writing, book, design) for visual reference
2. Download any custom CSS or code blocks if you added them in Squarespace (unlikely for this site)
3. Save any custom domain/DNS settings notes (though DNS is now managed by Cloudflare)

**Store these backups** in a safe location outside of the repo (e.g., a `~/backups/squarespace-2026/` folder or cloud storage).

## Step 3: Check for Dependencies on Squarespace

Before canceling, verify that you're not using Squarespace for anything other than the website:

- **Email:** Does your email (`@mikebagwell.me`) route through Squarespace? If so, migrate email to another provider (e.g., Google Workspace, Fastmail, Dreamhost email) BEFORE canceling.
- **Other services:** Are you using Squarespace Commerce, scheduling, or any other features? (Unlikely for this site, but double-check.)
- **Old backlinks/redirects:** If you had blog posts at `/blog/some-post` and they're now gone, consider setting up 301 redirects in your Astro site (via a `_redirects` file or middleware) to preserve SEO. Your new site already handles `/writing/<slug>` redirects (Phase 4 of the plan).

If you find any email or service dependencies, migrate them first. Do NOT proceed until those are resolved.

## Step 4: Remove the Custom Domain from Squarespace

Before canceling, disconnect the domain from Squarespace to avoid confusion:

1. In the Squarespace dashboard, go to **Settings > Domains**
2. Find `mikebagwell.me` in the list
3. Click **Disconnect** (or **Remove Domain**, depending on the UI)
4. Confirm the action

> **Why?** This ensures Squarespace isn't trying to serve your domain anymore. The domain is now fully controlled by Cloudflare/Dreamhost DNS.

## Step 5: Cancel the Squarespace Subscription

1. In the Squarespace dashboard, go to **Settings > Billing & Accounts**
2. Scroll to the **Subscription** section
3. Click **Cancel Subscription** (or **Cancel Site**, depending on the plan)
4. Squarespace will ask why you're canceling — select the appropriate reason (e.g., "I moved to another platform")
5. Confirm cancellation

### Billing Notes

- Squarespace subscriptions are typically billed annually or monthly
- If you cancel mid-billing-cycle, your site will remain active until the end of the paid period (e.g., if your annual plan renews in December and you cancel in July, the site stays up until December)
- Check the **Billing** section for your next renewal date and plan around that if you want to maximize your paid time

> **No immediate downtime:** Canceling doesn't instantly turn off your site (if you're mid-billing-cycle). But once the subscription expires, the site will go offline. If DNS has already been moved to Cloudflare, this won't affect your live site — only the Squarespace internal domain (`tangerine-maracas-frk6.squarespace.com`) will go dark.

## Step 6: Verify the Old Site is Offline (Eventually)

After your billing period ends:

1. Visit the Squarespace internal domain: `https://tangerine-maracas-frk6.squarespace.com`
2. You should see a "This site is no longer available" or similar message
3. Visit `https://mikebagwell.me` — it should still load the new Cloudflare Pages site (unaffected)

This confirms the decommission is complete.

## Step 7: Clean Up (Optional)

- **Delete the Squarespace account** (if you have no other sites on it): Go to **Settings > Account & Security > Delete Account**. This is optional — you can keep the account dormant.
- **Remove any Squarespace bookmarks** from your browser
- **Update any old links** you may have shared (e.g., social media profiles pointing to the Squarespace domain)

---

## Rollback Plan (If Something Goes Wrong)

If you discover a critical issue AFTER canceling Squarespace but BEFORE the billing period ends:

1. **DNS rollback:** In Dreamhost, revert the nameservers to Squarespace's nameservers (or re-add the old DNS records)
2. **Re-enable domain in Squarespace:** In **Settings > Domains**, reconnect `mikebagwell.me`
3. **Wait for DNS propagation** (again, 1-48 hours)
4. The old Squarespace site will come back online at `mikebagwell.me`

> **Important:** This rollback is only possible if your Squarespace subscription is still active (i.e., within the paid period). After the subscription expires, the site is permanently offline.

If the subscription has already expired, you cannot roll back. This is why we emphasize the **48-hour monitoring period** before canceling.

---

## Post-Decommission Checklist

After Squarespace is fully canceled and offline:

- ✅ Verify the new site is stable and serving at `https://mikebagwell.me`
- ✅ Confirm all content, images, and functionality are working
- ✅ Check Google Analytics or traffic logs to ensure visitors are reaching the new site
- ✅ Monitor for any 404s or broken links (check server logs in Cloudflare Pages Analytics)
- ✅ Update any external links (social media, business cards, email signatures) to use the new site
- ✅ Celebrate — you're now fully on Cloudflare Pages! 🎉

---

## Next Steps

Your migration is complete! For ongoing content management, see:

- **[04-github-private-repo.md](./04-github-private-repo.md)** — Verify your repo is private (security best practice)
- **README.md** in the repo root — Instructions for adding new publications via `scripts/add-publication.mjs`

---

**Need help?** If you encounter issues during the decommission, Squarespace support can assist (while your subscription is active): https://support.squarespace.com/

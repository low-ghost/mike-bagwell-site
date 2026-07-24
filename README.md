# Mike Bagwell Personal Site

A modern static website for [mikebagwell.me](https://mikebagwell.me), built with Astro and deployed on Cloudflare Pages.

## Overview

This site showcases published poetry, prose, and publication work. It's a fully static Astro site with:

- **Type-safe content management** via Astro Content Collections
- **Optimized images** committed to the repo and served by Cloudflare's CDN
- **Git-based publishing workflow** — push to GitHub to deploy automatically
- **Perfect SEO** — pre-rendered HTML, sitemap, RSS feed, OpenGraph/JSON-LD metadata
- **Free hosting** — Cloudflare Pages with unlimited bandwidth

## Project Structure

```
/
├── src/
│   ├── assets/books/           # Book cover images
│   ├── assets/publications/    # Publication cover images
│   ├── content/books/          # Book content (JSON) — SSOT for / and /books
│   ├── content/publications/   # Publication content (JSON)
│   ├── components/             # React + Astro components
│   ├── layouts/                # Page layouts
│   └── pages/                  # Routes (home, writing, books, design)
├── scripts/
│   ├── extract-squarespace.mjs # Pull content from Squarespace API
│   ├── add-publication.mjs     # Add new publications easily
│   └── add-book.mjs            # Add new books easily
├── docs/                       # Migration & setup documentation
└── public/                     # Static assets
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs at `http://localhost:4321`.

## Adding a Book

Books are a content collection (`src/content/books/`) — the single source of truth for both the home shelf and `/books`.

```bash
npm run book
# or with a cover path already in hand:
npm run book -- ~/Downloads/cover.jpg
```

You'll be prompted for title, short title, press/year, release date, markdown description, URL, link label, and whether to hide from the home shelf (`hideFromMain`).

The script will:
1. **Move** the cover into `src/assets/books/<slug>.<ext>`
2. Create `src/content/books/<slug>.json`
3. Print git commands to commit

Books sort newest-first by `pubDate`. Set `"hideFromMain": true` to list a book on `/books` only.

## Adding a Publication

```bash
node scripts/add-publication.mjs
```

You'll be prompted to enter:
- **Title** — The publication title
- **Publisher** — The journal/magazine name
- **URL** (optional) — External link to the published work
- **Publication date** — Format: YYYY-MM-DD
- **Featured** — Mark as featured on the home page (y/n)
- **Image path** — Path to the cover image file

The script will:
1. Copy the image to `src/assets/publications/`
2. Create a JSON content file in `src/content/publications/`
3. Print git commands to commit and push

After pushing to GitHub, Cloudflare Pages will automatically rebuild and deploy the site.

**Manual method:**

If you prefer, you can manually create files:
1. Add an image to `src/assets/publications/my-publication.jpg`
2. Create `src/content/publications/my-publication.json`:

```json
{
  "title": "My Publication Title",
  "publisher": "Journal Name",
  "url": "https://example.com/my-work",
  "pubDate": "2024-01-15T00:00:00.000Z",
  "featured": false,
  "image": "../../assets/publications/my-publication.jpg"
}
```

## Migration Documentation

This site was migrated from Squarespace to Cloudflare Pages. Step-by-step setup guides:

1. **[Cloudflare Pages Setup](./docs/01-cloudflare-setup.md)** — Create a free account, connect the GitHub repo, configure build settings
2. **[DNS Cutover](./docs/02-dns-cutover.md)** — Point your domain to Cloudflare Pages (Dreamhost → Cloudflare nameservers)
3. **[Decommission Squarespace](./docs/03-decommission-squarespace.md)** — Export content, verify parity, cancel subscription
4. **[GitHub Private Repo](./docs/04-github-private-repo.md)** — Verify the repo is private and connected

## Tech Stack

- **[Astro](https://astro.build)** — Static site generator with zero JS by default
- **[React](https://react.dev)** — For interactive components (minimal islands)
- **[Tailwind CSS v4](https://tailwindcss.com)** — Utility-first styling
- **[Cloudflare Pages](https://pages.cloudflare.com)** — Free static hosting with global CDN

## License

Content © Mike Bagwell. Code is provided as-is for portfolio/reference purposes.

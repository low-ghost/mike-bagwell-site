# GitHub Private Repository Verification

This guide covers verifying that your GitHub repository is **private** and properly configured as the git remote. Keeping the repo private is a best practice for personal sites (protects drafts, unpublished content, and any sensitive configuration).

## Prerequisites

- Git is installed and configured
- The `gh` CLI (GitHub CLI) is installed (optional but helpful)
- You have access to the GitHub repository

---

## Step 1: Check Current Git Remote

First, verify that your local repository is connected to the correct GitHub remote:

```bash
git remote -v
```

**Expected output:**

```
origin  git@github.com:low-ghost/mike-bagwell-site.git (fetch)
origin  git@github.com:low-ghost/mike-bagwell-site.git (push)
```

✅ If you see this, your remote is correctly configured. Proceed to Step 2.

❌ If you see a different URL or no remote:

- To add the remote: `git remote add origin git@github.com:low-ghost/mike-bagwell-site.git`
- To fix an incorrect remote: `git remote set-url origin git@github.com:low-ghost/mike-bagwell-site.git`

---

## Step 2: Check Repository Visibility

You can verify the repo's visibility using **either** the GitHub CLI or the GitHub web interface.

### Option A: Using GitHub CLI (Recommended)

If you have the `gh` CLI installed and authenticated:

```bash
gh repo view --json visibility
```

**Expected output:**

```json
{
  "visibility": "PRIVATE"
}
```

✅ If you see `"PRIVATE"`, your repo is private. You're all set!

❌ If you see `"PUBLIC"`, proceed to Step 3 to make it private.

#### Troubleshooting: `gh auth login` Required

If you see an error like `HTTP 401: Bad credentials`, you need to authenticate the `gh` CLI:

```bash
gh auth login
```

Follow the prompts to authenticate via your browser (choose "GitHub.com" → "HTTPS" or "SSH" → authorize).

Then re-run:

```bash
gh repo view --json visibility
```

### Option B: Using the GitHub Web Interface

1. Go to [https://github.com/low-ghost/mike-bagwell-site](https://github.com/low-ghost/mike-bagwell-site)
2. Look for a badge near the repo name:
   - 🔒 **Private** (or a lock icon) — your repo is private ✅
   - 🌐 **Public** — your repo is public ❌ (proceed to Step 3)

---

## Step 3: Make the Repository Private (If Needed)

If your repo is currently **public** and you want to make it **private**:

### Option A: Using GitHub CLI

```bash
gh repo edit --visibility private
```

✅ This will immediately change the repo to private.

Verify:

```bash
gh repo view --json visibility
```

You should now see `"PRIVATE"`.

### Option B: Using the GitHub Web Interface

1. Go to your repository: [https://github.com/low-ghost/mike-bagwell-site](https://github.com/low-ghost/mike-bagwell-site)
2. Click the **Settings** tab (top-right, gear icon)
3. Scroll down to the **Danger Zone** section (at the bottom)
4. Click **Change visibility**
5. Select **Make private**
6. Confirm by typing the repository name (`low-ghost/mike-bagwell-site`) and clicking **I understand, make this repository private**

---

## Step 4: Authorize Cloudflare Pages (If Repo is Private)

Cloudflare Pages needs permission to access your private GitHub repo for automatic deployments.

### First-Time Setup (Already Done in Doc 01)

When you connected your GitHub repo to Cloudflare Pages (in [01-cloudflare-setup.md](./01-cloudflare-setup.md)), you authorized the **Cloudflare Pages GitHub App** to access specific repositories. If the repo was already private at that time, the authorization is already in place.

### If You Just Made the Repo Private

If the repo was **public** when you set up Cloudflare Pages, and you just made it **private**, Cloudflare may lose access. You'll need to re-authorize:

1. Go to your [GitHub Apps settings](https://github.com/settings/installations)
2. Find **Cloudflare Pages** in the list
3. Click **Configure**
4. Under "Repository access," ensure `low-ghost/mike-bagwell-site` is selected
   - If it's not listed, click **Select repositories** and add it
5. Click **Save**

Now Cloudflare Pages can access the private repo for builds.

---

## Step 5: Verify Cloudflare Pages Can Access the Repo

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** > `mike-bagwell-site`
3. Make a small change to the repo (e.g., edit `README.md`) and push to GitHub:
   ```bash
   echo "Test push" >> README.md
   git add README.md
   git commit -m "Test private repo access"
   git push
   ```
4. Check the **Deployments** tab in Cloudflare Pages
5. You should see a new build triggered automatically

✅ If the build starts and succeeds, Cloudflare can access the private repo.

❌ If the build fails with an authorization error, re-check the GitHub App permissions (Step 4).

---

## Step 6: Best Practices for Private Repos

### Why Keep It Private?

- **Protects drafts/unpublished content:** Your `src/content/publications/` files may include works in progress
- **Hides configuration:** Your `package.json`, build scripts, and other config files are not exposed
- **Prevents unauthorized forks:** Private repos can't be forked by others without your permission

### Who Can Access the Repo?

- **You** (the repo owner)
- **Collaborators** you explicitly invite via **Settings > Collaborators**
- **Cloudflare Pages** (via the authorized GitHub App)

### Inviting Collaborators (Optional)

If you want to grant someone else access to the repo (e.g., a designer or developer):

1. Go to the repo on GitHub
2. Click **Settings > Collaborators**
3. Click **Add people**
4. Enter their GitHub username
5. Choose a role:
   - **Admin** — full access (can delete repo, change settings)
   - **Write** — can push changes
   - **Read** — can view the repo but not edit
6. Send the invite

They'll receive an email and can accept the invitation.

---

## Alternative: Creating a Private Repo from Scratch (If Needed)

If you're starting fresh and need to create a new private repo, use the `gh` CLI:

```bash
gh repo create mike-bagwell-site --private --source=. --remote=origin --push
```

This will:
1. Create a new **private** repo on GitHub named `mike-bagwell-site` under your account
2. Add it as the `origin` remote
3. Push your local commits to GitHub

Then follow the Cloudflare Pages setup in [01-cloudflare-setup.md](./01-cloudflare-setup.md) to connect the repo.

---

## Troubleshooting

### "Permission denied" when pushing to GitHub

If you see an error like:

```
Permission denied (publickey).
fatal: Could not read from remote repository.
```

You may need to set up SSH keys:

1. Generate a new SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. Add the key to your SSH agent:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```
3. Add the public key to GitHub:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   - Copy the output
   - Go to [GitHub SSH settings](https://github.com/settings/keys)
   - Click **New SSH key**
   - Paste the key and save

4. Test the connection:
   ```bash
   ssh -T git@github.com
   ```

   You should see: `Hi <username>! You've successfully authenticated...`

### Can't find the repo on GitHub

If `gh repo view` or the GitHub web interface says the repo doesn't exist:

1. Verify the repo URL in `git remote -v`
2. Check that you're looking at the correct GitHub account (the repo is under `low-ghost`)
3. If the repo truly doesn't exist, create it (see "Alternative: Creating a Private Repo from Scratch" above)

---

## Summary Checklist

- ✅ Remote is set to `git@github.com:low-ghost/mike-bagwell-site.git`
- ✅ Repository visibility is **PRIVATE**
- ✅ Cloudflare Pages GitHub App has access to the repo
- ✅ Test push triggers a build on Cloudflare Pages

---

**Need help?**
- GitHub SSH setup: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- GitHub CLI docs: https://cli.github.com/manual/
- Cloudflare Pages + private repos: https://developers.cloudflare.com/pages/configuration/git-integration/

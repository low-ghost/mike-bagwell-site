# Contact Form Setup

## Overview

The contact form uses **Web3Forms** (free tier) to handle form submissions. This service:
- Keeps your email address server-side (not exposed in HTML)
- Is completely static-friendly (no server required)
- Includes built-in spam protection via honeypot
- Is free for up to 250 submissions per month
- Sends form submissions directly to your email

## Setup Instructions

### 1. Create Web3Forms Account

1. Go to [https://web3forms.com](https://web3forms.com)
2. Click "Get Started" or "Create Access Key"
3. Enter your email address: **mlbagwell1@gmail.com**
4. You'll receive an access key via email (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Add Access Key to Your Environment

You need to add the access key as an environment variable so it's not exposed in your public code.

#### For Local Development:

Create a `.env` file in the project root:

```bash
WEB3FORMS_ACCESS_KEY=your-access-key-here
```

#### For Cloudflare Pages:

1. Go to your Cloudflare Pages dashboard
2. Select your site
3. Go to **Settings** → **Environment variables**
4. Add a new variable:
   - **Variable name**: `WEB3FORMS_ACCESS_KEY`
   - **Value**: Your access key from Web3Forms
   - Set it for both **Production** and **Preview** environments

### 3. Test the Form

After setting up:

1. Deploy your site to Cloudflare Pages
2. Visit `/contact` on your site
3. Fill out and submit the test form
4. Check your email (mlbagwell1@gmail.com) for the submission

## Spam Protection

The form includes:

1. **Honeypot field**: A hidden checkbox that bots typically fill out but humans don't see
2. **Web3Forms built-in filtering**: Basic spam detection on their end

### Optional: Add hCaptcha (Free)

If you want additional protection:

1. Go to [https://www.hcaptcha.com](https://www.hcaptcha.com)
2. Sign up for a free account
3. Get your site key and secret key
4. Add to your form (see Web3Forms hCaptcha docs)

### Optional: Upgrade to Cloudflare Turnstile (Paid)

For invisible bot protection:
- Requires Web3Forms Pro ($18/month)
- Includes Cloudflare Turnstile support
- See Web3Forms pricing page for details

## How It Works

1. User fills out the contact form
2. Form submits to `https://api.web3forms.com/submit` with your access key
3. Web3Forms validates the submission (checks honeypot, etc.)
4. If valid, Web3Forms sends the message to mlbagwell1@gmail.com
5. User is redirected to `/contact?success=true` with a success message

## Security Notes

- ✅ Your email address (mlbagwell1@gmail.com) is **never exposed** in the HTML
- ✅ The access key is stored server-side as an environment variable
- ✅ Honeypot provides basic bot protection
- ✅ Web3Forms handles all the email sending securely
- ✅ Completely static - no server-side code needed

## Troubleshooting

**Form not working?**
1. Check that `WEB3FORMS_ACCESS_KEY` is set in Cloudflare Pages environment variables
2. Verify the access key is correct (check your email from Web3Forms)
3. Redeploy your site after adding the environment variable

**Not receiving emails?**
1. Check your spam folder
2. Verify the access key is active on web3forms.com
3. Try submitting a test form directly at web3forms.com to verify your account

**Getting spam?**
1. Enable hCaptcha (free) for additional protection
2. Consider upgrading to Web3Forms Pro for more advanced spam filtering
3. Add custom spam filtering rules in your Web3Forms dashboard

## Resources

- Web3Forms Docs: https://docs.web3forms.com
- Web3Forms Pricing: https://web3forms.com/pricing
- Cloudflare Pages Env Vars: https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables

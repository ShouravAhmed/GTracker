# Fix Google OAuth Redirect to Localhost in Production

## Problem
Google OAuth is redirecting to `http://localhost:3000` instead of your Netlify production URL.

## Root Cause
This happens when Supabase is configured with localhost URLs instead of your production URL. Supabase needs to know your production URL to tell Google where to redirect.

## Solution

### Step 1: Configure Supabase Site URL

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Find **Site URL** field
5. Set it to your Netlify production URL:
   ```
   https://your-site-name.netlify.app
   ```
   Or if you have a custom domain:
   ```
   https://yourdomain.com
   ```
6. Click **Save**

### Step 2: Configure Supabase Redirect URLs

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to expand
3. Scroll down to **Redirect URLs** section
4. Make sure you have BOTH URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://your-site-name.netlify.app/auth/callback`
   - (If you have a custom domain, also add: `https://yourdomain.com/auth/callback`)
5. Click **Save**

### Step 3: Verify Google OAuth Console (If Needed)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **Authorized redirect URIs**, make sure you have:
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   (This should already be configured - this is the Supabase callback URL, not your app URL)

### Step 4: Set Environment Variable in Netlify (Optional but Recommended)

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** > **Environment variables**
4. Add a new variable:
   - **Key**: `NEXT_PUBLIC_SITE_URL`
   - **Value**: `https://your-site-name.netlify.app` (your actual Netlify URL)
5. Click **Save**

### Step 5: Redeploy

After making changes in Supabase:
1. Redeploy your site on Netlify (or push a new commit)
2. Clear your browser cache and cookies
3. Try logging in again

## How It Works

1. User clicks "Login with Google" on your Netlify site
2. Your app calls `supabase.auth.signInWithOAuth()` with `redirectTo: window.location.origin + '/auth/callback'`
3. Supabase redirects to Google with the redirect URL configured in Supabase settings
4. Google authenticates and redirects back to Supabase: `https://[project-ref].supabase.co/auth/v1/callback`
5. Supabase processes the OAuth and redirects to your app: `https://your-site.netlify.app/auth/callback`
6. Your app's callback route exchanges the code for a session

## Important Notes

- **Supabase Site URL**: This is the base URL Supabase uses for redirects
- **Supabase Redirect URLs**: These are the allowed callback URLs for your app
- **Google OAuth Redirect URI**: This must be the Supabase callback URL, NOT your app URL
- The code uses `window.location.origin` which automatically gets the correct URL (localhost in dev, Netlify URL in production)

## Troubleshooting

If it still redirects to localhost:

1. **Check Supabase Site URL**: Make sure it's set to your production URL, not localhost
2. **Check Supabase Redirect URLs**: Make sure your production URL is listed
3. **Clear browser cache**: Old OAuth tokens might be cached
4. **Check browser console**: Look for any errors or the redirect URL being logged
5. **Wait a few minutes**: Supabase changes can take a few minutes to propagate

## Testing

After configuration:
1. Open your Netlify site in an incognito/private window
2. Click "Login with Google"
3. Check the browser console - you should see: `[NAVBAR] OAuth redirect URL: https://your-site.netlify.app/auth/callback`
4. After Google authentication, you should be redirected back to your Netlify site, not localhost


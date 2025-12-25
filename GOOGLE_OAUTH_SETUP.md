# Google OAuth Setup Guide - Fix redirect_uri_mismatch Error

## The Problem
You're seeing this error:
```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

This happens when the redirect URI configured in Google OAuth Console doesn't match what Supabase is sending.

## The Solution

### Step 1: Find Your Supabase Project Reference

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Look at your **Project URL** - it will look like: `https://abcdefghijklmnop.supabase.co`
5. The part before `.supabase.co` is your project reference (e.g., `abcdefghijklmnop`)

### Step 2: Configure Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new OAuth project)
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your **OAuth 2.0 Client ID** (or create one if needed)
5. Under **Authorized redirect URIs**, click **+ ADD URI**
6. Add this EXACT URI (replace `[YOUR-PROJECT-REF]` with your actual project reference):
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   Example: If your project ref is `abcdefghijklmnop`, add:
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```
7. Click **SAVE**

### Step 3: Configure Supabase Authentication

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to expand
3. Enable the provider
4. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Your Google OAuth Client ID
   - **Client Secret (for OAuth)**: Your Google OAuth Client Secret
5. Under **Redirect URLs**, add:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback` (replace with your actual domain)
6. Click **Save**

### Step 4: Verify Environment Variables

Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Optional, for development
```

### Step 5: Test

1. Restart your development server
2. Try signing in with Google
3. The error should be resolved!

## Common Mistakes

❌ **Wrong**: Adding `http://localhost:3000/auth/callback` to Google OAuth Console
✅ **Correct**: Adding `https://[project-ref].supabase.co/auth/v1/callback` to Google OAuth Console

❌ **Wrong**: Using your app's callback URL in Google Console
✅ **Correct**: Using Supabase's callback URL in Google Console, and your app's callback URL in Supabase settings

## Why This Happens

When you use Supabase OAuth:
1. Your app redirects to Supabase: `https://[project-ref].supabase.co/auth/v1/authorize`
2. Supabase redirects to Google: `https://accounts.google.com/o/oauth2/v2/auth`
3. Google redirects back to Supabase: `https://[project-ref].supabase.co/auth/v1/callback` ← **This must be in Google Console**
4. Supabase processes the OAuth and redirects to your app: `http://localhost:3000/auth/callback` ← **This is in Supabase settings**

## PKCE Code Verifier Error

If you're seeing this error:
```
PKCE code verifier not found in storage
```

This happens when the PKCE code verifier is stored in localStorage (client-only) but needs to be in cookies for SSR frameworks like Next.js.

**Solution:** The code has been updated to store the PKCE code verifier in cookies instead of localStorage. This allows the server-side callback route to access it.

**What was fixed:**
- Updated `lib/supabase/client.ts` to use cookie storage for PKCE code verifier
- The client now properly stores OAuth state in cookies that can be accessed by both client and server

**If you still see this error:**
1. Clear your browser cookies and localStorage
2. Restart your development server
3. Try signing in again

## Still Having Issues?

1. **Double-check the redirect URI in Google Console** - it must be EXACTLY:
   `https://[your-project-ref].supabase.co/auth/v1/callback`

2. **Check for typos** - One character off will cause the error

3. **Wait a few minutes** - Google OAuth changes can take a few minutes to propagate

4. **Clear browser cache and cookies** - Sometimes cached OAuth responses cause issues

5. **Check Supabase Site URL** - In Supabase Settings > API, make sure Site URL is set correctly

6. **Verify OAuth credentials** - Make sure Client ID and Secret are correct in Supabase

7. **Clear all cookies and localStorage** - If you're still seeing PKCE errors, clear all site data and try again


# GAMAM Technical Interview Tracker

A Next.js 14 application for tracking your progress through GAMAM (Google, Amazon, Microsoft, Apple, Meta) technical interview problems.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** with strict type checking
- **Tailwind CSS** for styling (mobile-first, dark mode support)
- **Lucide React** for icons
- **Supabase** ready for backend integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   - Get these values from your Supabase project settings: https://app.supabase.com/project/_/settings/api

3. Set up the database:
   - Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create the `user_solves` table
   - This table stores user progress and enables syncing across devices
   - You can run the migration SQL directly in the Supabase SQL Editor

4. Configure Google OAuth (CRITICAL - Fixes redirect_uri_mismatch error):

   **Step 1: Get your Supabase Project URL**
   - Go to your Supabase project: https://app.supabase.com
   - Navigate to Settings > API
   - Copy your Project URL (e.g., `https://xxxxx.supabase.co`)

   **Step 2: Configure Google OAuth Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (or create a new one)
   - Go to "APIs & Services" > "Credentials"
   - Click on your OAuth 2.0 Client ID (or create one if you don't have it)
   - Under "Authorized redirect URIs", add:
     ```
     https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     Replace `[YOUR-SUPABASE-PROJECT-REF]` with your actual Supabase project reference
     (e.g., if your URL is `https://abcdefghijklmnop.supabase.co`, use `abcdefghijklmnop`)
   - Click "Save"

   **Step 3: Configure Supabase**
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google provider
   - Add your Google OAuth credentials:
     - **Client ID (for OAuth)**: Your Google OAuth Client ID
     - **Client Secret (for OAuth)**: Your Google OAuth Client Secret
   - Under "Redirect URLs", add:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
   - Click "Save"

   **Important Notes:**
   - The redirect URI in Google Console MUST be: `https://[project-ref].supabase.co/auth/v1/callback`
   - This is different from your app's callback URL (`/auth/callback`)
   - Supabase handles the OAuth flow and then redirects to your app's callback URL
   - If you're still getting errors, verify:
     1. The redirect URI in Google Console exactly matches: `https://[project-ref].supabase.co/auth/v1/callback`
     2. Your Supabase Site URL is set correctly in Settings > API
     3. Your app's redirect URLs are added in Supabase Authentication settings

5. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── gamam-150/         # GAMAM 150 tracker page
│   ├── coding/            # Coding problems page
│   ├── system-design/     # System design problems page
│   └── ...                # Other category pages
├── components/             # Reusable React components
│   ├── Navbar.tsx         # Navigation bar with auth
│   ├── Gamam150.tsx
│   ├── GamamCategory.tsx
│   └── NotFound.tsx
├── lib/                    # Utility functions
│   ├── supabase/          # Supabase client utilities
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   ├── middleware.ts  # Middleware utilities
│   │   └── solves.ts      # Server actions for user solves
│   ├── solves-client.ts   # Client-side hook for managing solves
│   └── localStorage.ts    # Client-side localStorage utilities (fallback)
├── supabase/              # Database migrations
│   └── migrations/        # SQL migration files
├── types/                  # TypeScript type definitions
│   └── gamam.ts
└── src/                    # Legacy React files (can be removed)
    └── assets/            # JSON data and old styles
```

## Features

- **Google Authentication** - Login with Google via Supabase
- **Cloud Sync** - Progress saved to Supabase, accessible from any device
- **Automatic Migration** - Existing localStorage data automatically migrates to Supabase on first login
- **Offline Support** - Falls back to localStorage for unauthenticated users
- Track progress through 150 days of GAMAM interview problems
- Filter by problem category (Coding, System Design, OOD, etc.)
- Mark problems as solved/unsolved
- View progress statistics (days completed, total solved)
- Fixed navigation bar with brand logo and auth buttons
- Mobile-first responsive design
- Dark mode support
- Clean, modern UI with high contrast

## Migration Notes

This project was migrated from Create React App to Next.js 14 with App Router. All components have been converted to TypeScript and styled with Tailwind CSS.

## Deployment

The project is configured for Netlify deployment. The `netlify.toml` file includes the necessary configuration for Next.js.

## License

See LICENSE file for details.

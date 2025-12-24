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

3. Configure Google OAuth in Supabase:
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google provider
   - Add your Google OAuth credentials (Client ID and Client Secret)
   - Add `http://localhost:3000/auth/callback` to the allowed redirect URLs (for development)
   - Add your production URL with `/auth/callback` for production

4. Run the development server:
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
│   │   └── middleware.ts  # Middleware utilities
│   └── localStorage.ts    # Client-side localStorage utilities
├── types/                  # TypeScript type definitions
│   └── gamam.ts
└── src/                    # Legacy React files (can be removed)
    └── assets/            # JSON data and old styles
```

## Features

- **Google Authentication** - Login with Google via Supabase
- Track progress through 150 days of GAMAM interview problems
- Filter by problem category (Coding, System Design, OOD, etc.)
- Mark problems as solved/unsolved (stored in localStorage)
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

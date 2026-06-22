# Inkwell — Personal Diary & Life Journal (V1)

A private journaling app: HTML/CSS/vanilla JS frontend, Supabase backend (auth, Postgres, storage), deployable free on Cloudflare Pages.

## What's included (V1 scope)
- Landing page, signup, login, forgot/reset password
- Dashboard with stats (total entries, streak, favorites, monthly count) + recent entries
- Diary editor: title, rich text (bold/italic/underline/lists/quote), mood picker, category, tags, image upload, autosave, word count + read time
- Entry actions: save, favorite, archive, delete, duplicate
- Calendar view with entry/mood indicators, click a day to see its entries
- Search with text search + favorite/archived/category filters
- Favorites page
- Profile page: edit name/bio, change password, export journal as .txt, delete account
- Dark ("Midnight") and light ("Paper") themes, saved per device
- Fully responsive (mobile sidebar collapses to a toggle)

## 1. Set up Supabase (5 minutes)
1. Create a free project at https://supabase.com
2. Go to **SQL Editor → New query**, paste the entire contents of `schema.sql`, and run it. This creates all tables, Row Level Security policies, and the image storage bucket.
3. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.
4. Open `js/supabase-client.js` and replace:
   ```js
   const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
   const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
   ```
5. In Supabase **Authentication → URL Configuration**, set your Site URL (and redirect URLs) once you have a deployed domain, e.g. `https://craftiva-diary.pages.dev` — this matters for the password-reset email link.
6. (Optional) In **Authentication → Providers → Email**, you can disable "Confirm email" while testing locally, so signup logs you straight in.

## 2. Run locally
No build step — it's static files. Either:
- Open `index.html` directly in a browser, or
- Serve it (recommended, avoids some CORS/storage quirks): `npx serve .` or `python3 -m http.server` from this folder.

## 3. Deploy to Cloudflare Pages (free)
1. Push this folder to a GitHub repo.
2. In Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo. Build command: leave blank. Build output directory: `/` (root).
4. Deploy. You'll get a `*.pages.dev` URL — add that to Supabase's redirect URLs (step 1.5 above).

## File map
```
index.html              landing page
login.html / signup.html / forgot-password.html / reset-password.html
dashboard.html           stats + recent entries
entry.html               create/edit entry
calendar.html            monthly calendar
search.html              search + filters
favorites.html           starred entries
profile.html             account settings, export, delete
css/style.css            full design system (one file)
js/supabase-client.js    ← put your Supabase keys here
js/utils.js              theme, toasts, formatting, streak calc
js/shell.js              injects sidebar nav on authenticated pages
js/auth.js, dashboard.js, entry.js, calendar.js, search.js, favorites.js, profile.js
schema.sql               run once in Supabase SQL Editor
```

## Notes / known limits (V1)
- **PDF export, push notifications, writing-streak badges, and multiple extra themes** are V2 scope per the product plan — V1 ships .txt export, the streak counter, and two themes (Midnight/Paper).
- **Delete account** removes all entries/profile data and signs the user out, but fully deleting the underlying Supabase auth user requires a server-side admin call (the anon key can't do this) — that's a small serverless function to add later (e.g. a Cloudflare Worker calling Supabase's admin API) if you want true self-service account deletion.
- Tags are stored relationally (`tags` + `entry_tags`) so they're ready for tag-based filtering later, even though V1's search only filters by category/favorite/archived + free text.
- Image upload uses a public Supabase Storage bucket scoped by user-id folder; swap to a private bucket + signed URLs later if you want images to not be guessable by URL.

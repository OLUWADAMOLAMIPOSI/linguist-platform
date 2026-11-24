# Linguist Portfolio and Research Platform

A Next.js (App Router) and Supabase web application: a public academic portfolio and language documentation hub, plus a secure admin dashboard that lets the owner manage everything without touching code.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase (Postgres, Auth, Storage), Tiptap, Recharts, React Leaflet, Zod, Resend.

No personal data, publications or language data is built in. Everything shown on the site is entered through the admin dashboard.

---

## 1. What you get

**Public website**
Home, About, Research (filter, search, sort, detail pages), Publications (filter, search, citations in APA, MLA, Chicago and BibTeX), Teaching, Blog (draft, published and scheduled posts, tags, categories, sharing, SEO), Contact, Research collaboration portal, Newsletter (double opt-in, unsubscribe).

**Linguistics hub**
Language archive with profile pages, interactive language map, interactive IPA chart, phonology, syntax and morphology lab with Leipzig-style interlinear glosses and syntax trees, searchable multilingual dictionary, corpus collections with concordance search and frequency charts, audio library with waveform player and time-aligned transcriptions.

**Admin dashboard** (`/admin`)
Overview, profile, education, experience, research, publications, languages, phonology, syntax and morphology, syntax tree builder, dictionary, corpus, audio and transcription tool, blog, teaching, testimonials, newsletter, media library, messages inbox with email replies, SEO, website settings, email settings and user management. Two roles: administrator and editor.

---

## 2. Requirements

- Node.js 18.18 or newer (20 or 22 recommended)
- A free Supabase account (https://supabase.com)
- Optional: a Resend account (https://resend.com) for email
- Optional: a Vercel account for hosting

---

## 3. Install and run locally

```bash
cd linguist-platform
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see section 5), set up the database (section 4), then:

```bash
npm run dev
```

Open http://localhost:3000. Until the environment variables are set, the site shows a "Connect your Supabase project" notice instead of crashing.

Useful commands:

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | Lint |
| `npm run build` | Production build |
| `npm start` | Run the production build |

---

## 4. Database setup

1. In Supabase create a new project. Choose a region close to your visitors.
2. Open **SQL Editor** and run each file from `supabase/migrations` **in order**, one at a time. Paste the contents and press Run.
   1. `001_core.sql`
   2. `002_academic.sql`
   3. `003_blog_forms.sql`
   4. `004_linguistics.sql`
   5. `005_rls_policies.sql`
   6. `006_storage.sql`
   7. `007_ipa_reference_data.sql`
3. Optional: `supabase/seed.sql` adds a few blog categories and SEO rows. Skip it if you prefer to start empty.

If you use the Supabase CLI instead: `supabase link --project-ref YOUR_REF` then `supabase db push`.

What the migrations create:
- All tables, constraints, foreign keys and search indexes (trigram indexes for dictionary search).
- Row Level Security on every table. The public can only read published content. Writes require a staff account.
- Seven storage buckets. Profile images, publication PDFs, research attachments, dictionary audio and the media library are public. **Linguistic recordings and corpus datasets are private** and only reachable through short-lived signed links created after the server checks consent and permissions.
- The IPA reference data (consonants and vowels) for the interactive chart.

### Create the first administrator

Public sign-up is not part of the site, so you create the first account yourself:

1. In Supabase go to **Authentication, Users, Add user, Create new user**. Enter an email and a strong password and tick **Auto Confirm User**.
2. Copy the new user's **UID**.
3. In the **SQL Editor** run (replace the two values):

```sql
insert into public.admin_users (user_id, email, role)
values ('PASTE-THE-USER-UID-HERE', 'you@example.com', 'admin');
```

4. Visit `/admin/login` and sign in. Further users can be added from **Admin, Users**.

Recommended in Supabase **Authentication, Sign In / Providers**: turn off "Allow new users to sign up". Even if it stays on, strangers cannot reach the dashboard because access also requires a row in `admin_users`.

---

## 5. Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Where to find it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project Settings, API | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page (anon or publishable key) | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (service_role key) | **Secret. Server only.** Never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Your site address | `http://localhost:3000` locally, your real domain in production |
| `RESEND_API_KEY` | Resend, API Keys | Optional. Without it forms still save, but no emails are sent |
| `RESEND_FROM_EMAIL` | Resend | Must be on a domain you verified. `onboarding@resend.dev` works for testing only |
| `ADMIN_NOTIFY_EMAIL` | Your inbox | Fallback address for notifications. Can also be set in Admin, Email settings |
| `RATE_LIMIT_SALT` | Any random string | Used to hash visitor IPs for rate limiting |

The service role key is needed for: saving public form submissions (contact, collaboration, testimonials, newsletter), rate limiting, the activity log, signed audio and dataset links, and user management. It is only imported in server-only files.

---

## 6. First-time content checklist

Sign in at `/admin/login`, then:

1. **Website settings**: site name, tagline, institution, contact email, academic profile links.
2. **Profile**: name, title, biography, photograph and CV.
3. Add education, experience, research interests and affiliations.
4. Add research projects and publications.
5. Add languages, then phonology, dictionary entries, examples and recordings.
6. **Email settings** and test the contact form.

Notes on content entry:
- **Published flag**: most content is hidden from the public until you tick Published.
- **Audio**: a recording is only playable publicly when it is published **and** its consent status is "Consent given". Recordings are stored in a private bucket.
- **Languages** appear on the map only when you enter verified latitude and longitude.
- **Interlinear glosses** are validated: the segmentation and gloss lines must have matching word and morpheme counts.
- **Blog scheduling**: set status to Scheduled with a future date. The post becomes visible automatically at that time (no cron job needed).
- Profile **email and phone** are stored in a publicly readable table. Leave them blank if you want the contact form only.

---

## 7. Deploying to Vercel

1. Push the project to a GitHub repository (`.env.local` is already git-ignored).
2. In Vercel choose **Add New, Project** and import the repository. The framework is detected automatically.
3. Under **Environment Variables** add every variable from section 5. Set `NEXT_PUBLIC_SITE_URL` to your production address.
4. Deploy.
5. In Supabase **Authentication, URL Configuration** set **Site URL** to your production address.
6. Optional: add your custom domain in Vercel, then verify the domain in Resend and update `RESEND_FROM_EMAIL`.
7. After deploying, open `/sitemap.xml` and `/robots.txt` to confirm they load.

Large uploads (audio up to 50 MB) go straight from the browser to Supabase Storage, so they are not limited by Vercel's request size.

---

## 8. Project structure

```
app/
  (public)/            Public pages (home, about, research, publications, teaching, blog,
                       languages, phonetics, syntax, dictionary, corpus, audio, contact, newsletter)
  admin/               Login, protected panel and server actions
    (panel)/[resource] Generic list and edit screens driven by lib/admin/resources.ts
  actions/public.ts    Public form handlers (validation, spam checks, rate limit, email)
  sitemap.ts, robots.ts
components/            layout, forms, publications, linguistic-labs, dictionary, corpus, audio, admin, ui
lib/
  supabase/            Browser, server, anonymous and service-role clients
  admin/               Module definitions, validation, save hooks, client upload
  validations/         Public form schemas
  seo.ts, citations.ts, email.ts, rate-limit.ts, sanitize.ts, storage.ts ...
supabase/
  migrations/          SQL for tables, security policies, storage and IPA data
  seed.sql             Optional starter categories
middleware.ts          Session refresh and redirect for /admin
```

To add or change an admin field, edit `lib/admin/resources.ts` and the matching migration. The list screen, form, validation and save logic all follow that one definition.

---

## 9. Security summary

- Row Level Security is enabled on every table. Anonymous visitors can only read published content and approved testimonials.
- The admin area is protected twice: middleware requires a session, and the server checks the account is listed in `admin_users` on every page and every action. Editors cannot open settings or user management.
- Public forms have a honeypot field, a minimum fill time, validation with Zod and database-backed rate limiting (hashed IPs only).
- Rich text is sanitised with an allow-list when saved and again when displayed.
- Uploads are limited by type and size in the browser and by Supabase bucket rules on the server.
- Private recordings and datasets are never exposed by URL. Signed links last one hour (recordings) or two minutes (datasets).
- The service role key is used only in server-only code.
- The activity log is read-only for staff.

---

## 10. Honest limits and things to know

- **No speech recognition.** Transcription is manual and time-aligned. The tool says so.
- **No live publication metrics or API syncing.** Academic profile fields (Google Scholar, ORCID and others) are links only.
- Replacing a file in a form uploads the new file but does not delete the old one from storage. Use the media library or the Supabase dashboard to clean up.
- The language map loads OpenStreetMap tiles from the internet.
- A language whose slug is exactly `map` would be shadowed by the map page. Pick a different slug.
- Dictionary search is a substring search, not full linguistic stemming.
- The IPA chart covers the standard pulmonic consonants, a set of other consonants and the vowel chart. Add audio to any symbol from Admin, IPA symbols.

See `TESTING.md` for a step-by-step checklist to verify your deployment.

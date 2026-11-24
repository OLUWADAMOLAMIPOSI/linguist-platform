# Testing checklist

Work through this after setting up the database and environment variables, first locally and again on the deployed site. Tick each line as you go.

Automated checks (no database needed):

```bash
npm run typecheck
npm run lint
npm run build
```

## A. Access and security
- [ ] Visiting `/admin/dashboard` while signed out redirects to `/admin/login`
- [ ] Signing in with a wrong password shows a clear error
- [ ] An account that exists in Supabase Auth but is not in `admin_users` is refused with "does not have access"
- [ ] An editor account cannot open Website settings, Email settings or Users (shows "Only administrators")
- [ ] Signing out returns to the login page and `/admin/dashboard` is protected again
- [ ] In Supabase, with the anon key only, a draft or unpublished row cannot be read (try Table Editor "as anon" or the REST API)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` does not appear in the browser (search the page source and Network tab)

## B. Profile and settings
- [ ] Website settings saves (site name and links appear in header, footer and contact page)
- [ ] Profile saves with a photograph and a PDF CV
- [ ] Home page shows name, title, photo, introduction and CV button
- [ ] About page shows biography, education, experience, interests and affiliations

## C. Research and publications
- [ ] Create a research project with collaborators and a document attachment; it appears at `/research`
- [ ] Research filters work: search, status, category, sort and pagination
- [ ] Project detail page shows all sections and the download link
- [ ] Create a publication with two authors, DOI and PDF
- [ ] Publication filters work: search, type, year, sort
- [ ] Publication page shows APA, MLA, Chicago and BibTeX, and the Copy button works
- [ ] Unticking Published hides the item from the public site

## D. Blog
- [ ] Draft post is not visible publicly
- [ ] Published post appears at `/blog` with image, category, tags and reading time
- [ ] Scheduled post with a future date is hidden, and appears once the time passes
- [ ] Tag and category filters work
- [ ] Share buttons open and Copy link works

## E. Contact, collaboration, newsletter
- [ ] Contact form shows field errors for empty or invalid input
- [ ] A valid submission shows success, appears in Admin, Messages and emails the notify address
- [ ] Submitting more than five times in fifteen minutes shows the "too many submissions" message
- [ ] Collaboration form saves and appears under the Collaboration tab
- [ ] Opening a message marks it as read; changing status and notes saves
- [ ] "Send reply" emails the sender (requires Resend)
- [ ] Newsletter subscribe sends a confirmation email; the link confirms; the unsubscribe link works
- [ ] Newsletter issue: "Send test to me" works, then "Send to subscribers"
- [ ] Testimonial submitted from the Teaching page is hidden until approved in Admin

## F. Language archive and labs
- [ ] Add a language family and a language with dialects; it appears at `/languages`
- [ ] A language with verified coordinates appears on `/languages/map`; clicking a marker opens its profile
- [ ] Phonetics page: clicking IPA symbols shows details; adding audio to a symbol makes the Play button appear
- [ ] Phonological description and minimal pair examples appear on the language page
- [ ] Interlinear gloss with mismatched word counts is rejected with a clear message
- [ ] A valid gloss displays aligned in columns with small-caps grammatical labels
- [ ] Syntax tree builder: add nodes, rename, change parent, drag, tidy layout, export PNG and SVG, save; the tree shows on the syntax page when linked to an example and published
- [ ] Morphological example appears in the table

## G. Dictionary
- [ ] Add entries with examples and pronunciation audio
- [ ] Typing in the search box updates results without a page reload
- [ ] Filters work: language, category, search by word, search by meaning, alphabet letters, pagination
- [ ] Entry detail page shows examples, audio and related words
- [ ] An unpublished entry never appears

## H. Corpus
- [ ] Create a collection, then a document marked Public and add an annotation
- [ ] Concordance search lists occurrences with context
- [ ] Word frequency chart renders
- [ ] A document not marked Public never appears
- [ ] Dataset download works only when "Allow public download" is ticked

## I. Audio
- [ ] Upload a recording (private bucket) from Admin, Audio recordings
- [ ] With consent set to Pending or Restricted the recording is not visible publicly
- [ ] With Published and "Consent given" it appears in `/audio` and plays
- [ ] Waveform appears and clicking it seeks
- [ ] Transcription tool: add segments, use playhead buttons, play a segment, save
- [ ] Public page highlights the active segment while playing and clicking a segment jumps to it
- [ ] The raw storage URL of the file is not accessible without a signed link

## J. Media library and uploads
- [ ] Upload an image and a PDF in the media library; copy link and open it
- [ ] Uploading a disallowed file type or an oversized file shows a clear error
- [ ] Deleting a file removes it

## K. Users
- [ ] Administrator can add an editor and change their role
- [ ] You cannot change your own role or remove your own account

## L. SEO
- [ ] Page titles and descriptions change per page; Admin, SEO overrides take effect
- [ ] `/sitemap.xml` lists published content only and `/robots.txt` blocks `/admin`
- [ ] "Hide the whole site from search engines" produces `Disallow: /` and a noindex tag
- [ ] Article and publication pages include structured data (view source, search for `application/ld+json`)

## M. Responsive and accessibility
- [ ] Public site and admin work at phone width (about 375 px), tablet and desktop
- [ ] Mobile menu opens and closes; admin sidebar opens and closes
- [ ] Everything can be reached with the keyboard; the "Skip to content" link appears on first Tab
- [ ] Loading, empty and error states look correct (try a search with no results)

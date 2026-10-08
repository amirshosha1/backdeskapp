# SETUP_AUTH.md — Google sign-in for Backdesk (steps Amir does by hand)

Batch 3 (Phase 0a/0b, slice 1). Nothing here is done by Claude: the Google
Cloud console, the Supabase dashboard, Vercel and GitHub settings are yours.
Steps 1–5 and 7 are done (2026-10-08); step 6 and the "After PR B merges"
section are what remains.

**Fixed values used below**

| What | Value |
|---|---|
| Production URL | `https://backdeskapp.com` (`https://www.backdeskapp.com` redirects to it before any page loads) |
| Vercel's own production address | `https://str-money-finder.vercel.app` (still works; not the address people use) |
| Vercel preview URLs | `https://str-money-finder-git-<branch>-amirshosha-2230s-projects.vercel.app` and `https://str-money-finder-<hash>-amirshosha-2230s-projects.vercel.app` |
| Supabase project ref | `kmmfhaypqgzhoptmljki` (West EU, Ireland, `eu-west-1`; Free plan; this project is production) |
| Supabase project URL | `https://kmmfhaypqgzhoptmljki.supabase.co` |
| Google redirect URI (Supabase's callback) | `https://kmmfhaypqgzhoptmljki.supabase.co/auth/v1/callback` |
| The app's own callback (where Supabase sends people back) | exactly `/auth/callback`, no query string |
| Public contact (privacy page, custom plans) | `support@backdeskapp.com` (receives mail, confirmed 2026-10-08) |

## Secrets: what must never be pasted into chat

| Value | Secret? | Where it goes |
|---|---|---|
| Google OAuth **Client secret** | **SECRET** | Only into Supabase (step 2). Never in chat, a commit, an issue or a screenshot. |
| Supabase **secret keys** (`sb_secret_…`) and the legacy **`service_role`** key | **SECRET** | Nowhere. The app never uses them (a test fails if one appears in the code). |
| Supabase **database password** and connection strings | **SECRET** | Nowhere. |
| Supabase **JWT secret** / signing keys | **SECRET** | Nowhere. |
| Google OAuth Client ID | Not secret | Supabase (step 2). |
| Supabase project URL | Public by design | Vercel (step 5). |
| Supabase **publishable key** (`sb_publishable_…`) | Public by design: it ships in every browser; Row Level Security is what protects the data | Vercel (step 5). Still no need to paste it into chat. |

If a secret is ever exposed, rotate it at the source (Google: add a new client
secret and delete the old one; Supabase: Project Settings → API Keys).

## 1. Google Cloud: the OAuth client (done)

[Google Cloud console](https://console.cloud.google.com) → project `Backdesk`
→ **Google Auth Platform**.

1. **Branding**: app name `Backdesk` (the same name everywhere; a mismatch is
   the usual reason Google rejects brand verification). User support and
   developer contact emails: your own Google account email (Google only offers
   your own address or a Google Group you manage). App logo: empty (a logo
   starts a brand review). App domain and authorized domains: step 6.
2. **Audience**: user type **External**, publishing status **Testing**, with
   every tester listed under *Test users* (up to 100). While in Testing, only
   listed accounts can sign in; everyone else sees "access blocked". To open
   sign-in to anyone, press **Publish app**: with only the three basic scopes
   below, Google does not require a review.
3. **Data access**: only `openid`, `.../auth/userinfo.email` and
   `.../auth/userinfo.profile`.
4. **Clients** → the web client `Backdesk web (Supabase)`:
   - Authorized JavaScript origins: `https://backdeskapp.com` (the app never
     uses Google's JavaScript sign-in, so this list is informational; keep it
     to the production address).
   - Authorized redirect URIs: exactly
     `https://kmmfhaypqgzhoptmljki.supabase.co/auth/v1/callback`

## 2. Supabase: the Google provider (done)

Supabase → project `kmmfhaypqgzhoptmljki` → **Authentication → Sign In /
Providers → Google**: enabled, with the Client ID and Client secret. **Skip
nonce checks** off; **Allow users without an email** off. The *Callback URL
(for OAuth)* shown there is the same URI as step 1.4.

## 3. Supabase: close every other way in (done)

Same page: **Email** provider off (with it on, anyone holding the publishable
key could create an email-and-password account through the API, which breaks
"Google only"); **Phone** off; **Allow new users to sign up** on (Google
sign-ups need it); **Allow anonymous sign-ins** off; **Allow manual linking**
off.

## 4. Supabase: where people may be sent back (done; tighten after PR B, below)

**Authentication → URL Configuration**:

- **Site URL**: `https://backdeskapp.com`
- **Redirect URLs** (as set on 2026-10-08):
  - `https://str-money-finder.vercel.app/auth/callback`
  - `https://str-money-finder-*-amirshosha-2230s-projects.vercel.app/auth/callback`
    (`*` matches the `git-<branch>` and `<hash>` parts of both preview forms;
    it never matches a dot or a slash)
  - `http://localhost:3000/auth/callback` (for `pnpm dev`)
  - `https://backdeskapp.com/**`
  - `https://www.backdeskapp.com/**`

The app always returns to exactly `/auth/callback`, with no query string; the
page to come back to travels in a short-lived first-party cookie, never in
the URL. So exact callback paths are all the list needs (see "After PR B
merges").

**Known trade-off (accepted on 2026-10-08):** the preview pattern lets any
deployment whose address fits it receive a sign-in. Because this project is
production, the launch checklist (`docs/BUILD_PLAN.md`, Phase 10) removes this
wildcard or moves previews to a separate Supabase project.

## 4b. Supabase: what the Data API exposes (done)

**Project Settings → Data API** (as checked on 2026-10-08):

- **Exposed schemas**: `public` and `graphql_public` only. The `private`
  schema (the helper and trigger functions) must never be added.
- **Automatically expose new tables**: **off**. Existing grants are unchanged.
  Every future migration grants exactly what it needs, explicitly, as
  `20261008180000_accounts_and_units.sql` already does (it also revokes
  Supabase's default grants in `public`, so a table without a grant is
  unreachable). With this off, a missing grant shows up as a 404 or a 42501
  from the Data API: that is a migration bug to report, never something to
  work around by exposing more.

## 5. Vercel: the two environment variables (done)

Vercel → project `str-money-finder` → **Settings → Environment Variables**,
for **Production** and **Preview**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kmmfhaypqgzhoptmljki.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Project Settings → API Keys** → the **Publishable key** (`sb_publishable_…`). Not a secret key, not the legacy `anon` or `service_role` JWT. |

These are the only Supabase values the app uses. `NEXT_PUBLIC_` values are
built into the pages, so a deployment picks them up only when it is built
(redeploy after changing them). While either is missing (local dev, CI,
e2e), the app hides every account entry point and works for visitors only.

## 6. After PR B is live: the privacy link and the brand on Google's consent screen

Google Auth Platform → **Branding**:

- Application home page: `https://backdeskapp.com`
- Application privacy policy link: `https://backdeskapp.com/privacy`
  (English: `https://backdeskapp.com/en/privacy`)
- Authorized domains: `backdeskapp.com`

**Known limitation:** until the brand is verified, Google's screen says "to
continue to kmmfhaypqgzhoptmljki.supabase.co" instead of "Backdesk". Now that
`backdeskapp.com` is live, verification is possible at no cost: verify the
domain in [Google Search Console](https://search.google.com/search-console)
with the same Google account, then submit the branding for verification
(Branding → *Verify branding*). A Supabase custom domain (so the screen shows
your own domain) is a paid add-on and needs your approval first.

## 7. After PR A merged: check the database (done 2026-10-08: 14 × PASS)

1. Supabase → **Integrations → GitHub**: the migration
   `20261008180000_accounts_and_units` was applied without errors.
2. Supabase → **SQL Editor** → paste all of `docs/verify_after_migration.sql`
   → **Run** (it only reads). Every row PASS. Run it again after every future
   migration and paste the result back in chat.

## Before every merge: the checks must be green (manual rule)

Two GitHub Actions checks run on every pull request:

- **CI / checks**: lint, typecheck, unit tests and a production build
  (`.github/workflows/ci.yml`);
- **Database tests / rls**: the migrations, grants and Row Level Security on
  a throwaway Postgres (`.github/workflows/db-tests.yml`).

Merge only when both are green on the pull request's latest commit, and
always with **Squash and merge**. GitHub cannot enforce this here: required
checks (branch protection or rulesets) need GitHub Pro, or a public
repository, and the API answers 403 on this private repository on GitHub
Free. Until then it is a rule you apply by hand.

## After PR B merges: tighten the redirect list (you, by hand)

Once Google sign-in works on `https://backdeskapp.com` (sign in, land back on
the page you started from):

1. Supabase → **Authentication → URL Configuration → Redirect URLs**.
2. Replace `https://backdeskapp.com/**` with exactly
   `https://backdeskapp.com/auth/callback`.
3. Delete `https://www.backdeskapp.com/**`: `www` redirects to the apex before
   any page or script runs, so sign-in never starts or ends on `www`.
4. Sign in once more on `https://backdeskapp.com` to confirm.

## How to change an account's plan or apartment limit (you only)

Users can read their own `org_entitlements` row but can never change it.
You change it in the Supabase dashboard: **Table Editor → org_entitlements**,
or in the SQL Editor, for example to give one host a custom plan of 10
apartments:

```sql
update public.org_entitlements e
set max_units = 10
from public.org_members m
join auth.users u on u.id = m.user_id
where m.org_id = e.org_id
  and m.role = 'owner'
  and u.email = 'host@example.com';
```

Until Phase 7 builds the trial clock and the gating, `plan`, `trial_*` and
`paid_until` are recorded but nothing reads them: every account works with
everything open, and `max_units` (5 by default) is the only limit enforced.
The app shows it read-only ("3 من 5 شقق") and never blocks an add itself: the
database refuses the 6th apartment and the app shows the custom-plan contact.

# SETUP_AUTH.md — Google sign-in for Backdesk (steps Amir does by hand)

Batch 3 (Phase 0a/0b, slice 1). Do the steps in order. Nothing here is done by
Claude: the Google Cloud console, the Supabase dashboard and Vercel are yours.

**Fixed values used below**

| What | Value |
|---|---|
| Production URL | `https://str-money-finder.vercel.app` |
| Vercel preview URLs | `https://str-money-finder-git-<branch>-amirshosha-2230s-projects.vercel.app` and `https://str-money-finder-<hash>-amirshosha-2230s-projects.vercel.app` |
| Supabase project ref | `kmmfhaypqgzhoptmljki` (West EU, Ireland, `eu-west-1`; Free plan; this project is production) |
| Supabase project URL | `https://kmmfhaypqgzhoptmljki.supabase.co` |
| Google redirect URI (Supabase's callback) | `https://kmmfhaypqgzhoptmljki.supabase.co/auth/v1/callback` |
| The app's own callback (where Supabase sends people back) | `/auth/callback` on each of the URLs above |

## Secrets: what must never be pasted into chat

| Value | Secret? | Where it goes |
|---|---|---|
| Google OAuth **Client secret** | **SECRET** | Only into Supabase (step 2). Never in chat, a commit, an issue or a screenshot. |
| Supabase **secret keys** (`sb_secret_…`) and the legacy **`service_role`** key | **SECRET** | Nowhere. This batch does not use them. |
| Supabase **database password** and connection strings | **SECRET** | Nowhere. |
| Supabase **JWT secret** / signing keys | **SECRET** | Nowhere. |
| Google OAuth Client ID | Not secret | Supabase (step 2). |
| Supabase project URL | Public by design | Vercel (step 5). |
| Supabase **publishable key** (`sb_publishable_…`) | Public by design: it ships in every browser; Row Level Security is what protects the data | Vercel (step 5). Still no need to paste it into chat. |

If a secret is ever exposed, rotate it at the source (Google: add a new client
secret and delete the old one; Supabase: Project Settings → API Keys).

## 1. Google Cloud: the OAuth client

In [Google Cloud console](https://console.cloud.google.com), create a project
named `Backdesk` (or select it), then open **Google Auth Platform**.

1. **Branding**
   - App name: `Backdesk`. Use exactly this name here and on the site; a
     mismatch is the usual reason Google rejects brand verification later.
   - User support email: **your own Google account email** (the one you are
     signed in with). Not `info@backdeskapp.com`: Google only offers your
     own address or a Google Group you manage, and the domain is not live yet.
   - Developer contact email: **your own Google account email** as well.
   - App logo: leave empty (uploading one starts a brand review).
   - App domain (home page, privacy policy) and Authorized domains: leave empty
     for now; see step 6.
2. **Audience**
   - User type: **External**.
   - Publishing status: start in **Testing** and add every tester under
     *Test users* (your Gmail and each host's Gmail; up to 100). While in
     Testing, only listed accounts can sign in; everyone else sees "access
     blocked". When you are ready for anyone to sign in, press **Publish app**:
     with only the three basic scopes below, Google does not require a review.
3. **Data access** → Add or remove scopes: tick only `openid`,
   `.../auth/userinfo.email` and `.../auth/userinfo.profile`. Nothing else.
4. **Clients** → **Create client**
   - Application type: **Web application**. Name: `Backdesk web (Supabase)`.
   - Authorized JavaScript origins: `https://str-money-finder.vercel.app`
   - Authorized redirect URIs: exactly
     `https://kmmfhaypqgzhoptmljki.supabase.co/auth/v1/callback`
   - Create. Copy the **Client ID** and the **Client secret** straight into
     step 2. Google may show the secret only once; if you lose it, add a new
     secret on the client's page and delete the old one.

## 2. Supabase: the Google provider

Supabase dashboard → project `kmmfhaypqgzhoptmljki` → **Authentication** →
**Sign In / Providers** → **Google**:

- Enable **Sign in with Google**.
- Client IDs: paste the Client ID.
- Client Secret (for OAuth): paste the Client secret.
- Leave **Skip nonce checks** off and **Allow users without an email** off.
- Check that the *Callback URL (for OAuth)* shown on that page is
  `https://kmmfhaypqgzhoptmljki.supabase.co/auth/v1/callback`, the same URI as
  in step 1.4. Save.

## 3. Supabase: close every other way in

Same page (**Authentication → Sign In / Providers**):

- **Email**: turn **off** "Enable Email provider" and save. This matters:
  with it on, anyone holding the publishable key (every visitor's browser has
  it) can create an email-and-password account through the API, which breaks
  "Google only".
- **Phone**: off.
- In the general sign-up settings on that page: keep **Allow new users to
  sign up** on (Google sign-ups need it); **Allow anonymous sign-ins** off;
  **Allow manual linking** off.

## 4. Supabase: where people may be sent back

**Authentication → URL Configuration**:

- **Site URL**: `https://str-money-finder.vercel.app`
- **Redirect URLs**: add these three, exactly:
  - `https://str-money-finder.vercel.app/auth/callback`
  - `https://str-money-finder-*-amirshosha-2230s-projects.vercel.app/auth/callback`
    (`*` matches the `git-<branch>` and `<hash>` parts of both preview forms;
    it never matches a dot or a slash)
  - `http://localhost:3000/auth/callback` (for `pnpm dev`)

The app always returns to exactly `/auth/callback`, with no query string, so
these exact paths are enough.

**Known trade-off (accepted on 2026-10-08):** the preview pattern lets any
deployment whose address fits it receive a sign-in. Because this project is
production, the launch checklist (`docs/BUILD_PLAN.md`, Phase 10) removes this
wildcard or moves previews to a separate Supabase project.

## 5. Vercel: the two environment variables

[vercel.com](https://vercel.com) → project `str-money-finder` → **Settings** →
**Environment Variables** → add each, ticking **Production** and **Preview**
(not Development):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kmmfhaypqgzhoptmljki.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Project Settings → API Keys** → the **Publishable key** (starts with `sb_publishable_`). Not a secret key, not the legacy `anon` or `service_role` JWT. |

These are the only Supabase values the app uses, and both reach the browser by
design. `NEXT_PUBLIC_` values are built into the pages, so a deployment only
picks them up when it is built: redeploy after adding them (Deployments → the
latest → Redeploy). Nothing reads them before PR B, so you can add them any
time before PR B's preview.

## 6. After PR B is live: the privacy link on Google's consent screen

Google Auth Platform → **Branding** → App domain:

- Application home page: `https://str-money-finder.vercel.app`
- Application privacy policy link: `https://str-money-finder.vercel.app/privacy`
  (English: `/en/privacy`)

Google may ask for the domain under *Authorized domains* and refuse a
`vercel.app` address you cannot prove you own. If it does, leave these empty
until `backdeskapp.com` is live: sign-in works without them while the app is
unverified.

**Known limitation:** until the brand is verified, Google's screen says
"to continue to kmmfhaypqgzhoptmljki.supabase.co" instead of "Backdesk".
Brand verification realistically needs our own domain (`backdeskapp.com`);
a Supabase custom domain is a paid add-on and needs your approval first.

## 7. After PR A merges: check the database

1. Supabase → **Integrations → GitHub**: confirm the migration
   `20261008180000_accounts_and_units` was applied without errors.
2. Supabase → **SQL Editor** → New query → paste all of
   `docs/verify_after_migration.sql` → **Run**. It only reads. Send the whole
   result table back in chat. Every row should be PASS; the two INFO rows are
   context. If the row "postgres holds DELETE on auth.users" says FAIL, account
   deletion as built cannot work and PR B waits for another deletion method.
3. GitHub → repository **Settings → Branches** (or Rules) → the rule for
   `main` → require the status check **Database tests / rls**, so no later
   migration merges, and gets applied, without passing it.

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

# Move Hub Holidays

Staff holiday tracking portal for The Move Hub — request, approve, and see who's off on a team calendar.

## Stack

Next.js (App Router) + Prisma + Postgres + email/password auth (bcrypt + signed JWT cookie sessions).

## Getting started

```bash
cp .env.example .env   # fill in DATABASE_URL (Postgres) and SESSION_SECRET
npm install
npm run db:push    # creates the schema in your Postgres database
npm run db:seed    # creates the first admin account
npm run dev         # http://localhost:3457
```

Default seeded admin: `admin@move-hub.co.uk` / `changeme123` — sign in and change the password (or reset it) from the **Staff** page once logged in. Override the seeded credentials by setting `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before running `npm run db:seed`.

Further staff accounts are created by an admin **inviting** them from the Staff page (email + role + allowance) — there's no public sign-up. There's no email sending configured, so inviting shows a one-time link on screen for the admin to copy and send themselves (Slack, email, etc.); the invited person opens it to set their own name and password.

If someone forgets their password, they can request a reset from the login page — this doesn't email a link (no mail service configured), it creates a request an admin approves from the Staff page, which then shows the admin a one-time reset link to pass along. This keeps the flow from being a self-service account-takeover vector: nobody gets a working link without an admin manually vouching for the request.

## Roles

- **Admin** — approves/rejects holiday requests, invites and manages staff accounts, roles and allowances, approves password reset requests.
- **Staff** — requests holiday, sees their own request history, sees the whole team's calendar.

## Deploying (e.g. Railway)

1. Add a Postgres service and set `DATABASE_URL` to its connection string.
2. Set `SESSION_SECRET` to a strong random value (generate with `openssl rand -base64 32`) — never reuse the local dev value.
3. Deploy the app (build command `next build`, start command `next start`).
4. Run `npm run db:push` and `npm run db:seed` once against the production database (e.g. via `railway run`), then log in and change the seeded admin's password from the Staff page immediately.

## UK bank holidays

Working-day calculations exclude weekends and the UK bank holidays listed in `src/lib/holidays.ts` — that list needs updating annually.

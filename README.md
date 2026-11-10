# GoHyderabad web application

The customer website, booking pages and staff admin panel for GoHyderabad, in one Next.js application.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 (admin) · plain CSS (public site) · React Aria components · Recharts.

> Read next: [GOHYDERABAD.md](GOHYDERABAD.md) (architecture and requirements coverage) and [FIXES.md](FIXES.md) (what is left to do, by priority). The Django API lives in the sibling project `backend/`.

## Contents

1. [Quick start](#1-quick-start)
2. [Where to open things](#2-where-to-open-things)
3. [Configuration](#3-configuration)
4. [Pages](#4-pages)
5. [Project structure](#5-project-structure)
6. [Two page roots](#6-two-page-roots)
7. [Public site and booking pages](#7-public-site-and-booking-pages)
8. [Customer account](#8-customer-account)
9. [Admin panel](#9-admin-panel)
10. [Talking to the API](#10-talking-to-the-api)
11. [Styling](#11-styling)
12. [Phones and tablets](#12-phones-and-tablets)
13. [Checks and builds](#13-checks-and-builds)
14. [Troubleshooting](#14-troubleshooting)
15. [Deploying](#15-deploying)

---

## 1. Quick start

Use Node.js 22.12 or later. Tailwind's build-time dependency includes ESM-only code that Next.js loads through CommonJS.

```
cd GoHyderabad
cp .env.local.example .env.local     # NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
npm install
npm run dev                          # http://localhost:3000
```

Start the Django API first (see `backend/README.md`), and add `http://localhost:3000` to its `CORS_ALLOWED_ORIGINS`.

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with live reload. |
| `npm run build` | Production build (also type-checks). |
| `npm start` | Serve the production build. |
| `npx tsc --noEmit` | Type check only. |

## 2. Where to open things

| What | Address |
|---|---|
| Public website | <http://localhost:3000/> |
| Trips | <http://localhost:3000/trips> |
| Customer sign in | <http://localhost:3000/login> |
| My account | <http://localhost:3000/account> |
| **Staff admin panel** | <http://localhost:3000/admin> |
| Backend home (links to the Django site and API docs) | <http://127.0.0.1:8000/> |
| Django admin (classic) | <http://127.0.0.1:8000/admin/?classic=1> |

## 3. Configuration

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Where the Django API lives. The one setting for the whole app (default `http://127.0.0.1:8000`). |
| `NEXT_DIST_DIR` | Optional. Builds into another folder so a test build can run beside `npm run dev` without clashing. |

Use `127.0.0.1`, not `localhost`, for the backend address in development. Django's dev server listens on IPv4 only and browsers may try IPv6 first, which shows as "Failed to fetch".

`.env.local` is ignored by git. Only `NEXT_PUBLIC_` variables reach the browser, so never put a secret in one.

## 4. Pages

| Route | What it is | Needs sign-in |
|---|---|---|
| `/` | Home page | No |
| `/trips` | Published trips | No |
| `/trips/<name>` | Trip detail with dates, price, pickup, refund policy, booking panel | No (booking needs it) |
| `/login` | Customer sign in with a WhatsApp code | No |
| `/checkout/<id>` | Participants, waiver, payment, confirmation | Customer |
| `/account` | My bookings | Customer |
| `/account/profile` | My details | Customer |
| `/admin/login` | Staff sign in (code or password) | No |
| `/admin` | Dashboard | Staff |
| `/admin/<module>/<table>` | Records of one table | Staff |

Unknown addresses show a 404 page.

## 5. Project structure

```
GoHyderabad/
├── app/
│   ├── (public)/                 public root layout (own styles and fonts)
│   │   ├── page.tsx              home page
│   │   ├── globals.css, sections.css, animations.css
│   │   └── (site)/               booking pages and their layout
│   │       ├── trips/, trips/[slug]/, login/, checkout/[id]/
│   │       ├── account/, account/profile/   (account.css)
│   │       └── booking.css
│   ├── admin/                    admin root layout (own styles)
│   │   ├── login/page.tsx
│   │   └── (shell)/              signed-in admin: page.tsx, [module]/, [module]/[resource]/
│   └── global-not-found.tsx      404 (two root layouts need a global one)
├── components/
│   ├── site/                     home page sections and typed data (has its own README)
│   ├── booking/                  customer session, header avatar, trip, login, checkout pieces
│   ├── account/                  signed-in customer's area
│   ├── admin/                    admin shell, dashboard bits, the generic table and form screen
│   ├── base/                     shared UI: buttons, inputs, selects, tables, dialogs, toasts…
│   ├── application/              composed UI: sidebar, stat cards, chart cards
│   ├── foundations/              small shared building blocks
│   ├── initPage.ts, PageBehavior.tsx, Motion.tsx, publicContent.ts   home page behaviour
├── lib/
│   ├── api/client.ts             the one API client (tokens, refresh, errors)
│   ├── config.ts                 the backend address
│   ├── customer/                 customer API calls, types, formatting, Razorpay helper
│   └── admin/                    admin API calls and menu grouping
├── styles/                       design tokens and typography for the admin
├── hooks/, utils/                small shared helpers
└── public/                       images, brand logo, icons
```

## 6. Two page roots

The public site and the admin each have their own root layout (`app/(public)/layout.tsx` and `app/admin/layout.tsx`). Because they are separate roots:

- the public site keeps its hand-written stylesheets and fonts;
- the admin uses Tailwind CSS 4 with a token-based theme, and its styles never reach the public site (and the reverse);
- a global 404 page is needed (`app/global-not-found.tsx`, enabled in `next.config.mjs`).

Do not import one side's CSS into the other.

## 7. Public site and booking pages

- **Home page:** built from small components in `components/site` plus typed data files (the 50 plan cards, 8 sample cards, 53 map pins and photo credits). See `components/site/README.md`. Behaviour such as scroll effects, the map and filter chips lives in `components/initPage.ts` and finds elements by `id`, `class` and `data-*`, so keep those names when editing markup.
- **Live content:** when trips or destinations are published in the admin, `components/publicContent.ts` replaces the built-in plan cards and map list with live data at runtime. Publish only when the live data has photos, dates and prices.
- **Trips and trip detail** are rendered on the server from the public API on every request, so they are always current and work well for search engines. A trip that does not exist gives a 404.
- **Booking flow:** choose a date, number of people and pickup point → sign in with a WhatsApp code (new customers give a name) → checkout creates one booking per trip → add participants and accept the waiver → pay the advance with Razorpay → confirmation. The balance is paid later from the account.
- **Header avatar:** "Sign in" (person icon) when signed out; the customer's initial with a menu (My bookings, Book a trip, Sign out) when signed in. It works on the home page and on the booking pages (`components/booking/AccountMenu.tsx`).
- **Phones:** a "From ₹… · Book now" bar is pinned to the bottom of trip pages and hides while the booking panel is visible.

## 8. Customer account

`/account` has a sidebar (profile, My bookings, My details, Browse trips, Support, Log out), summary counts, **Upcoming / Past trips / Cancelled** tabs, and a card per booking: photo, status, date, pickup, reference, total, progress steps (booked → advance paid → balance paid → trip day), pay-balance button, details (price breakdown, people, balance due date) and cancellation with confirmation. The rules that decide a booking's tab, status wording and steps are in `components/account/booking-model.ts`.

## 9. Admin panel

There is no screen per table. `components/admin/ResourceView.tsx` builds a list and a form for **any** table from the API's description of it (`/api/v1/admin/resources/<table>/schema/`), so a new table appears automatically once the backend exposes it and the user has permission.

- **Menu:** `lib/admin/nav.ts` groups the 20 backend modules into seven sidebar items plus Settings. A module the backend adds later still appears under Settings.
- **Lists:** search, sort, paging, edit and delete according to the user's permissions. On phones each row becomes a card.
- **Forms:** text, numbers, dates, choices, linked records, switches, JSON and file upload (type and size are checked before and after sending).
- **Actions:** verify or reject a manual payment, approve a refund, grant a departure exception, check in a participant, publish content. All go through the backend services.
- **Dashboard:** key figures with 30-day change, revenue and bookings charts, recent bookings, upcoming trip dates, and a "Finish setting up" card listing placeholder business values and missing integrations. Staff with trip-create permission can add a trip; schedule-create permission allows adding trip dates. Bookings themselves continue through checkout.
- **Sign in:** a Password / OTP switch; the server confirms the account has staff access.

## 10. Talking to the API

`lib/api/client.ts` creates an API client with its own base address and its own token storage key. The admin (`lib/admin/api.ts`, key `gh_admin_tokens`) and the customer site (`lib/customer/api.ts`, key `gh_customer_tokens`) each use one, so a staff session and a customer session never mix.

- It adds the `Authorization` header, refreshes an expired access token once, and turns failures into readable messages (including "Can't reach the server").
- Calls that create bookings or payments send an `Idempotency-Key`, so retrying never double-charges.
- Tokens are kept in the browser's local storage. Moving to secure cookies is planned (see FIXES.md).
- Razorpay's payment window is loaded on demand by `lib/customer/razorpay.ts`; the server creates the order and verifies the signature.

## 11. Styling

- **Public site:** its own variables and fonts in `app/(public)/globals.css`. Booking pages add `booking.css` and `account.css` using the same colours and fonts.
- **Admin:** design tokens in `styles/theme.css` (colours, radii, shadows, accent), type styles in `styles/typography.css`, dark mode through a `dark` class. Use the semantic token classes (for example `text-text-primary`, `bg-background-secondary-default`) instead of raw colours, so dark mode and re-theming keep working.
- **Accent colour:** one amber ramp defined once in `styles/theme.css` (`--color-accent-*`).
- **Brand files:** `public/brand/` (logo, mark, admin favicon).

## 12. Phones and tablets

Every screen was checked at 360, 390, 768 and 1280 px wide in a real browser: no sideways scrolling. Habits that keep it that way:

- write grid columns as `minmax(0, 1fr)` (a plain `1fr` cannot shrink below its widest child);
- no fixed widths wider than the screen;
- tap targets at least 44 px, input text 16 px (stops iPhone zoom);
- the admin shows tables as cards below 768 px;
- when adding a fixed bar, check `.btn` does not override its position (the public stylesheet sets `position: relative` on buttons).

To check a page: Chrome → F12 → device toolbar → 360 and 390 px, and look for sideways scrolling and tiny buttons.

## 13. Checks and builds

- `npx tsc --noEmit` and `npm run build` must both pass.
- `npm audit --omit=dev` (see FIXES.md, F-11, for the current framework notice).
- There are no automated frontend tests yet (FIXES.md, F-09).
- To build while the dev server is running, use `NEXT_DIST_DIR=.next-verify npm run build`; delete `.next-verify` afterwards. If a build changes `tsconfig.json`, restore it.

## 14. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| "Failed to fetch" / "Can't reach the server" | Backend not running, `localhost` used instead of `127.0.0.1`, or this site's address missing from the backend's `CORS_ALLOWED_ORIGINS`. |
| Sign-in code does not arrive | The backend sends it. See the backend README (worker, template name and language). In development the code is printed in the backend console if WhatsApp refuses it. |
| `/trips` is empty | No trip is published yet (needs a cover photo, schedule, price and all three translations). |
| Admin shows "You don't have access" | The user lacks that table's permission; give them a role (group) in the Django admin. |
| Admin sign in says no staff access | The user needs *Staff* on and an active operator membership with role Staff or Tenant admin; the number must be `+91…`. |
| Page looks unstyled or errors after a build | A build shared the `.next` folder with the dev server: stop the dev server, delete `.next`, run `npm run dev` again. |
| Duplicate React key warning | A list used a non-unique key; use a field that is unique (see the map list, keyed by name and coordinates). |
| Uploads fail with "file storage is not reachable" | The backend's S3 bucket is set without credentials. See the backend README. |

## 15. Deploying

- One deployable: build with `npm run build`, run with `npm start` (or your host's Next.js runtime).
- Set `NEXT_PUBLIC_BACKEND_URL` to the API's public address **at build time**, and add the site's address to the backend's `CORS_ALLOWED_ORIGINS` and the backend host as a verified tenant domain.
- The admin is part of the same application. If it later needs its own release schedule or access boundary, it can be split out (`app/admin`, `components/admin`, `lib/admin`, `styles` are self-contained).
- Full launch checklist with priorities: [FIXES.md](FIXES.md).

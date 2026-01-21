# X402 Ad Platform + ChatGPT Tool Paywall (Demo)

Lightweight in-house ad platform: advertisers register creatives; publishers inject a JS SDK to trigger ads; events are recorded on play/skip and can notify hooks; ChatGPT tools can show an ad before paid content, then auto-pay/unlock after completion.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

### Database
- Postgres URL via `DATABASE_URL` (see `.env.example`).
- Prisma commands: `npm run prisma:generate`, `npm run prisma:migrate`.

## Core pieces

- Next.js 16 + TypeScript, App Router.
- API routes: `/api/advertisers`, `/api/publishers`, `/api/events`.
- Prisma schema (`prisma/schema.prisma`) for advertisers, publishers, ad units, campaigns, creatives, events, webhooks, ledger, rollups.
- In-memory store (`lib/store.ts`) was for the initial demo; API now targets Prisma.
- Lightweight JS SDK: `public/sdk/ad-sdk.js` with `init`, `showAd`, `dismissOverlay`.

## API snippets

- Register advertiser: `POST /api/advertisers` `{ name, contactEmail, website? }`
- Register publisher: `POST /api/publishers` `{ siteName, domain, supportedTypes }`
  - Response includes `appId`, `apiKey`, `embedSnippet`
- Record event: `POST /api/events` `{ appId, adUnitId, event }`
  - Events: impression/start/firstQuartile/midpoint/thirdQuartile/complete/skip/click
  - `GET /api/events` shows current in-memory snapshot

### Auth flows
- Advertiser register: `POST /api/auth/advertiser/register` `{ name, authEmail, contactEmail, password, website? }`
- Advertiser login: `POST /api/auth/advertiser/login` `{ authEmail, password }`
- Publisher register: `POST /api/auth/publisher/register` `{ siteName, domain, authEmail, password, webhookUrl? }`
- Publisher login: `POST /api/auth/publisher/login` `{ authEmail, password }`
- Dashboards: `/advertiser/dashboard` and `/publisher/dashboard` (demo reads first record; wire auth/session for real use).

## SDK usage

```html
<!-- Embed -->
<script src="/sdk/ad-sdk.js" data-app-id="app_xxxx" async></script>
<script>
  window.x402Ad.init({ appId: "app_xxxx", eventsEndpoint: "/api/events" });
  // Trigger an ad
  window.x402Ad.showAd({
    type: "video",
    adUnitId: "player-top",
    onComplete: (result) => {
      // result: complete | click | skip
      // After completion, notify backend to unlock resource
    },
  });
</script>
```

## ChatGPT tool flow (concept)
1. Tool requests a restricted resource → backend decides it is paid and requires an ad view.
2. Frontend/tool calls SDK `showAd`.
3. SDK posts `complete/skip` to `/api/events`; backend verifies, then pays/unlocks.
4. Tool returns the unlocked resource (or re-fetches).

## Next iterations
- Plug in DB (Postgres/Prisma) and auth middleware.
- Webhook signing + retries + replay UI.
- Real creative hosting/CDN, playback metrics, frequency/fraud controls.
- ChatGPT tool manifest/openapi, resource metering and settlement.

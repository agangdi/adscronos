# Adscronos + ChatGPT Tool Paywall (Demo)

Lightweight in-house ad platform: advertisers register creatives; publishers inject a JS SDK to trigger ads; events are recorded on play/skip and can notify hooks; ChatGPT tools can show an ad before paid content, then auto-pay/unlock after completion.

---

## 🎯 The Story

### The Problem
AI assistants like ChatGPT are revolutionizing how we access information and services. But there's a fundamental challenge: **how do content creators and service providers monetize their offerings in an AI-first world?** Traditional paywalls break the conversational flow. Subscription fatigue is real. We needed a better way.

### The "Aha!" Moment
What if AI tools could show a quick ad before delivering premium content—just like YouTube does for videos? Users get instant access without subscriptions, creators get paid, and advertisers reach engaged audiences. It's a win-win-win that preserves the seamless AI experience.

### What We Built
**Adscronos** is a lightweight ad platform designed specifically for the AI era. We created:

- 🎬 **Ad SDK** that works seamlessly with ChatGPT tools and web publishers
- 💰 **Micropayment system** where ad views automatically unlock premium content
- 📊 **Full analytics pipeline** tracking impressions, completions, skips, and clicks
- 🔗 **Webhook infrastructure** for real-time event notifications and settlements
- 🎨 **Dual dashboards** for advertisers to manage campaigns and publishers to track revenue

### The Vision
We're building the infrastructure for **attention-based micropayments in the AI age**. Imagine:
- A ChatGPT tool that shows a 5-second ad before generating a premium report
- AI assistants that unlock paywalled articles after users watch relevant ads
- Content creators earning revenue without forcing subscriptions
- Advertisers reaching users at the exact moment they need something

This is just the beginning. The future of content monetization isn't behind paywalls—it's integrated into the experience itself.

### Why This Matters

**For Content Creators & Publishers:**
- 📈 **New revenue stream** without alienating users with hard paywalls
- 🌍 **Global reach** - anyone can access your content, anywhere
- 🤖 **AI-native** - your content works seamlessly with AI assistants
- 💡 **Micropayments at scale** - earn from every interaction, not just subscribers

**For Users:**
- 🆓 **Instant access** to premium content without credit cards or subscriptions
- ⚡ **Frictionless experience** - watch a quick ad, get what you need
- 🎯 **Relevant ads** - see promotions that actually match your interests
- 🔓 **No commitment** - pay-per-use model, no monthly fees

**For Advertisers:**
- 🎪 **Engaged audiences** - reach users at the moment they're seeking information
- 📊 **Transparent metrics** - track every impression, completion, and conversion
- 🎬 **Multiple formats** - video, display, interactive ads
- 💰 **Performance-based** - pay only for completed views and real engagement

**The Bigger Picture:**
As AI becomes the primary interface for information access, traditional monetization models break down. We're not just building an ad platform—we're creating the economic infrastructure that makes free, AI-powered information access sustainable for everyone.

### What's Next

**Immediate Roadmap (Post-Hackathon):**
- 🔐 **Enhanced security** - webhook signing, fraud detection, and rate limiting
- 🎨 **Creative studio** - drag-and-drop ad builder with templates
- 📱 **Mobile SDK** - native iOS/Android support for mobile apps
- 🧪 **A/B testing** - optimize ad performance with built-in experimentation
- 📈 **Advanced analytics** - conversion tracking, attribution, and ROI dashboards

**Medium-Term Goals:**
- 🤝 **ChatGPT Plugin Marketplace** - official integration with OpenAI's ecosystem
- 🌐 **Multi-AI support** - Claude, Gemini, and other AI assistants
- 💱 **Crypto payments** - blockchain-based micropayments for global reach
- 🎯 **Smart targeting** - ML-powered ad matching based on context and intent
- 🔄 **Programmatic bidding** - real-time ad auctions for premium placements

**Long-Term Vision:**
- 🌟 **The standard for AI monetization** - become the Stripe of attention-based payments
- 🏗️ **Open protocol** - create industry standards for AI-native advertising
- 🌍 **Global marketplace** - connect millions of creators, advertisers, and users
- 🚀 **Beyond ads** - enable any form of micropayment (tips, subscriptions, pay-per-query)

**Join Us:**
This is more than a hackathon project—it's the foundation of how content will be monetized in an AI-first world. We're looking for partners, early adopters, and believers in a future where information is both free and sustainable.

---

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

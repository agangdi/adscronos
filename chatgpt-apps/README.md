# API Data Shop - Apps SDK Example

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

This repository demonstrates an API Data Shop application built with the OpenAI Apps SDK and Model Context Protocol (MCP). It showcases how to create interactive UI widgets that integrate with ChatGPT, featuring an API marketplace with ad-based monetization and a carousel display.

The project is based on the OpenAI Apps SDK examples and has been customized to demonstrate purchasing API data products with advertisement playback functionality.

**Note:** If you are on Chrome and have recently updated to version 142, you will need to disable the [`local-network-access` flag](https://developer.chrome.com/release-notes/142#local_network_access_restrictions) to see the widget UI.

How to disable it:

1. Go to chrome://flags/
2. Find #local-network-access-check
3. Set it to Disabled

⚠️ **Make sure to restart Chrome after changing this flag for the update to take effect.**

## Features

### 🛒 API Data Shop
- Browse 6 different API data products (Weather, Stock Market, News, Geocoding, Cryptocurrency, Translation)
- Filter APIs by type (Free, Premium, Real-time, Batch)
- Shopping cart with quantity management
- **Ad playback system**: Watch a 5-second advertisement before receiving API data
- Mock API data responses for demonstration purposes

### 🎠 API Data Carousel
- Horizontally scrollable carousel displaying 8 API products
- Gradient placeholder backgrounds with letter identifiers
- Smooth navigation with Previous/Next buttons
- Responsive design with edge indicators

## MCP + Apps SDK Overview

The Model Context Protocol (MCP) is an open specification for connecting large language model clients to external tools, data, and user interfaces. An MCP server exposes tools that a model can call during a conversation and returns results according to the tool contracts. Those results can include extra metadata—such as inline HTML—that the Apps SDK uses to render rich UI components (widgets) alongside assistant messages.

Within the Apps SDK, MCP keeps the server, model, and UI in sync. By standardizing the wire format, authentication, and metadata, it lets ChatGPT reason about your connector the same way it reasons about built-in tools. A minimal MCP integration for Apps SDK implements three capabilities:

1. **List tools** – Your server advertises the tools it supports, including their JSON Schema input/output contracts and optional annotations (for example, `readOnlyHint`).
2. **Call tools** – When a model selects a tool, it issues a `call_tool` request with arguments that match the user intent. Your server executes the action and returns structured content the model can parse.
3. **Return widgets** – Alongside structured content, return embedded resources in the response metadata so the Apps SDK can render the interface inline in the Apps SDK client (ChatGPT).

Because the protocol is transport agnostic, you can host the server over Server-Sent Events or streaming HTTP—Apps SDK supports both.

This demo highlights how tools can light up widgets by combining structured payloads with `_meta.openai/outputTemplate` metadata returned from the MCP server.

## Repository Structure

- `src/` – Source code for widget components
  - `api-data-shop/` – Main shopping interface with ad playback
  - `api-data-carousel/` – Carousel display component
- `assets/` – Generated HTML, JS, and CSS bundles after running the build step
- `server_node/` – MCP server implemented with the official TypeScript SDK
- `build-all.mts` – Vite build orchestrator that produces hashed bundles for every widget entrypoint

## Technology Stack

- **Frontend**: React 19, TypeScript, TailwindCSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Carousel**: Embla Carousel
- **Server**: Node.js with MCP SDK
- **Build Tool**: Vite
- **Transport**: Server-Sent Events (SSE)

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Python 3.10+ (for the Python MCP server)
- pre-commit for formatting

## Quick Start

### 1. Install Dependencies

Clone the repository and install the workspace dependencies:

```bash
pnpm install
pre-commit install
```

> Using npm or yarn? Install the root dependencies with your preferred client and adjust the commands below accordingly.

### 2. Build the Widget Components

The components are bundled into standalone assets that the MCP server serves as reusable UI resources.

```bash
pnpm run build
```

This command runs `build-all.mts`, producing versioned `.html`, `.js`, and `.css` files inside `assets/`. Each widget is wrapped with the CSS it needs so you can host the bundles directly or ship them with your own server.

To iterate on your components locally, you can also launch the Vite dev server:

```bash
pnpm run dev
```

### 3. Serve the Static Assets

The MCP server expects the bundled HTML, JS, and CSS to be served from the local static file server. After every build, start the asset server:

```bash
pnpm run serve
```

The assets are exposed at [`http://localhost:4444`](http://localhost:4444) with CORS enabled so that local tooling (including MCP inspectors) can fetch them.

### 4. Start the MCP Server

Navigate to the server directory and start the MCP server:

```bash
cd server_node
pnpm start
```

The API Data MCP server will start on [`http://localhost:8000`](http://localhost:8000) with the following endpoints:
- SSE stream: `GET http://localhost:8000/mcp`
- Message post: `POST http://localhost:8000/mcp/messages?sessionId=...`

## Available Widgets

The API Data Shop MCP server exposes two interactive widgets:

### 1. API Data Shop (`api-data-shop`)
A full-featured shopping interface for browsing and purchasing API data products.

**Features:**
- 6 API products with detailed information
- Filter by type (All, Free, Premium, Real-time, Batch)
- Shopping cart with quantity management
- **Advertisement playback**: 5-second countdown before data access
- Mock API data responses (Weather, Stock Market, News, Geocoding, Crypto, Translation)

**Usage in ChatGPT:**
Ask something like: "Show me the API data shop" or "I want to browse API data products"

### 2. API Data Carousel (`api-data-carousel`)
A horizontally scrollable carousel showcasing 8 API products with visual appeal.

**Features:**
- 8 API products with gradient backgrounds
- Letter identifiers (W, S, N, G, C, T, I, A)
- Smooth navigation with arrow buttons
- Edge indicators for scrollable content
- Database icons for visual consistency

**Usage in ChatGPT:**
Ask something like: "Show me the API data carousel" or "Display available APIs"

## Testing in ChatGPT

To add the API Data Shop to ChatGPT, enable [developer mode](https://platform.openai.com/docs/guides/developer-mode), and add your app in Settings > Connectors.

### Using ngrok for Local Testing

To add your local server without deploying it, use [ngrok](https://ngrok.com/) to expose your local server to the internet.

Once your MCP server is running on port 8000, run:

```bash
ngrok http 8000
```

You will get a public URL that you can use to add your local server to ChatGPT in Settings > Connectors.

**Example connector URL:** `https://<custom_endpoint>.ngrok-free.app/mcp`

### Using the Connector

1. Add your app to the conversation context by selecting it in the "More" options
2. Invoke the widgets by asking questions like:
   - "Show me the API data shop"
   - "I want to browse API data products"
   - "Display the API data carousel"
   - "What APIs are available?"

### How It Works

1. **User requests API data** → ChatGPT calls the MCP tool
2. **Widget loads** → API Data Shop or Carousel appears in the chat
3. **User selects a product** → Ad modal appears with 5-second countdown
4. **Ad completes** → Mock API data is displayed
5. **User can checkout** → Standard purchase flow (mock)

## API Data Products

The shop includes 6 API products with mock data:

| API | Price | Type | Mock Data |
|-----|-------|------|-----------|
| Weather API | Free | Real-time | Temperature, humidity, conditions |
| Stock Market API | $29.99 | Premium | Stock quotes, prices, volume |
| News API | $19.99 | Batch | News articles, headlines |
| Geocoding API | Free | Batch | Address to coordinates |
| Cryptocurrency API | $49.99 | Real-time | Crypto prices, market cap |
| Translation API | $15.99 | Batch | Multi-language translation |

## Customization

### Adding New API Products

Edit `src/api-data-shop/index.tsx` and add new items to the `INITIAL_CART_ITEMS` array:

```typescript
{
  id: "your-api-id",
  name: "Your API Name",
  price: 9.99,
  description: "Your API description",
  shortDescription: "Short desc",
  detailSummary: "API details",
  nutritionFacts: [
    { label: "Requests", value: "10K/mo" },
    { label: "Latency", value: "<100ms" },
  ],
  highlights: ["Feature 1", "Feature 2"],
  quantity: 1,
  image: "",
  tags: ["premium", "realtime"],
  mockData: { /* your mock response */ }
}
```

### Modifying the Ad Duration

In `src/api-data-shop/index.tsx`, change the `AD_DURATION` constant:

```typescript
const AD_DURATION = 5; // seconds
```

### Customizing Server Behavior

Edit `server_node/src/server.ts` to:
- Add new widgets
- Modify tool schemas
- Change response metadata
- Integrate with real APIs

## Deployment

You can deploy the MCP server to any cloud environment that supports Node.js.

### Environment Variables

Set the `BASE_URL` environment variable to your hosted domain:

```bash
BASE_URL=https://your-server.com
```

This will be used to generate the HTML for the widgets so they can serve static assets from the hosted URL.

### Deployment Steps

1. Build the widgets: `pnpm run build`
2. Deploy the `assets/` directory to a CDN or static host
3. Deploy the `server_node/` directory to your Node.js hosting service
4. Update `BASE_URL` to point to your assets location
5. Add the deployed MCP endpoint to ChatGPT Settings > Connectors

## Contributing

You are welcome to open issues or submit PRs to improve this app, however, please note that we may not review all suggestions.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

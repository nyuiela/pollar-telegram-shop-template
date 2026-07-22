# Pollar Telegram Shop Template

Telegram Mini App storefront: log in with **Pollar** (email OTP baseline; Google/GitHub optional), browse a short catalog, and pay in **USDC** on **Stellar testnet** with a custodial Pollar wallet — without leaving Telegram.

## Checklist

Track bounty acceptance in **[CHECKLIST.md](./CHECKLIST.md)** (blocking validation, criteria, setup, demo video).

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4
- `@pollar/core@^0.9.0`, `@pollar/react@^0.9.0`
- `@telegram-apps/sdk` (Telegram Mini Apps bridge only)
- Node ≥ 20

Wallet login, signing, and balances come from Pollar — nothing wallet-related is reimplemented.

## What you get

| Piece | Path |
| --- | --- |
| Blocking validation (login + USDC `signAndSubmitTx`) | `/validate` |
| Catalog / product / checkout | `/`, `/products/[id]`, `/checkout/[id]` |
| `initData` verification (bot token server-only) | `POST /api/telegram/validate` |
| Isolated payment helper | `src/lib/checkout.ts` → `buildCheckoutPayment` |
| Login (email + Google/GitHub + Open Widget) | `src/components/email-login.tsx` → `PollarLogin` |
| Webview findings log | `docs/WEBVIEW-NOTES.md` |
| Acceptance checklist | `CHECKLIST.md` |

## Prerequisites

1. **Pollar publishable key** (`pub_testnet_…`) from [dashboard.pollar.xyz](https://dashboard.pollar.xyz)  
   - Add your Mini App HTTPS origin under allowed domains.
2. **Telegram bot** via [@BotFather](https://t.me/BotFather)
3. **HTTPS host** (Vercel, or ngrok/Cloudflare Tunnel for local)
4. **Merchant testnet address** (your `G…` that receives USDC)
5. **Test funds** — Friendbot (XLM) + [Circle faucet](https://faucet.circle.com) (USDC), unless Pollar funding mode covers it

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

### Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY` | Client | Pollar publishable key (`pub_testnet_…`) |
| `NEXT_PUBLIC_MERCHANT_ADDRESS` | Client | Stellar address receiving USDC |
| `TELEGRAM_BOT_TOKEN` | **Server only** | BotFather token for `initData` HMAC |
| `NEXT_PUBLIC_ALLOW_BROWSER_DEV` | Client | `true` to UI-test outside Telegram |

Never put the bot token in `NEXT_PUBLIC_*` or any client bundle.

## BotFather + Mini App registration

1. Talk to [@BotFather](https://t.me/BotFather) → `/newbot` → save the **bot token** as `TELEGRAM_BOT_TOKEN`.
2. Deploy this app over **HTTPS** (see below).
3. `/newapp` (or Bot settings → Mini App) and set the Mini App URL to your HTTPS origin (e.g. `https://your-app.vercel.app`).
4. Optionally add a menu button: `/setmenubutton` → point at the same URL.
5. Open the bot in Telegram and launch the Mini App.

## Deploy (Vercel)

```bash
npx vercel
```

Set the same env vars in the Vercel project. Redeploy after changing envs.

For local tunnels:

```bash
# example
npx ngrok http 3000
```

Register the tunnel HTTPS URL with BotFather and in the Pollar dashboard allowed origins.

## First validation (blocking)

Before treating the shop as done, prove the wallet path in the real webview:

1. Open `/validate` **from the bot**.
2. Log in with **email OTP**.
3. Confirm `walletAddress`.
4. Send a small USDC amount to `NEXT_PUBLIC_MERCHANT_ADDRESS`.
5. Open the tx on Stellar Expert.
6. Log differences in `docs/WEBVIEW-NOTES.md`.

Auth approach:

- **Email OTP** is the baseline (most reliable in Telegram’s webview).
- **Google / GitHub** are available via Pollar; inside Telegram they open with `openLink` (external browser). If blocked, fall back to email — don’t force OAuth.
- Passkeys are out of scope.

## Shop flow

1. Log in (email OTP or Google/GitHub) → Pollar custodial wallet
2. Browse catalog (static JSON in `src/lib/products.ts`)
3. Product detail → checkout
4. `buildCheckoutPayment({ to, amount })` builds a USDC payment, then `signAndSubmitTx`
5. Confirmation with Stellar Expert link

Checkout pays **Circle testnet USDC** only (issuer `GBBD47IF…FLA5`). Fund the Pollar wallet from the [Circle faucet](https://faucet.circle.com).

States: logged out, logging in, browsing, paying, success, error, unfunded.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Demo video

Record a short phone video inside Telegram: open from bot → login → browse → pay USDC → confirmation. Keep it with your submission (do not commit large binaries unless asked).

## References

- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [@telegram-apps/sdk](https://www.npmjs.com/package/@telegram-apps/sdk)
- [Pollar docs](https://docs.pollar.xyz/)
- [Pollar dashboard](https://dashboard.pollar.xyz)
- [Pollar demo](https://demo.pollar.xyz)

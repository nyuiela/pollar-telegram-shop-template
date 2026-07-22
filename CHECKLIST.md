# Acceptance checklist

Track progress against the Pollar Telegram Shop Template bounty. Check items as you complete them.

## Blocking validation (do this first)

- [ ] Mini App opens from a **real Telegram bot** (not only localhost browser)
- [ ] Email OTP login works **inside** the Telegram webview
- [ ] `walletAddress` is shown after login
- [ ] One USDC `signAndSubmitTx` completes on **Stellar testnet**
- [ ] Tx confirmed on [Stellar Expert testnet](https://stellar.expert/explorer/testnet)
- [ ] Webview vs browser notes recorded in [`docs/WEBVIEW-NOTES.md`](docs/WEBVIEW-NOTES.md)

**Path:** `/validate`

## Product / acceptance criteria

| Criterion | Status | Notes |
| --- | --- | --- |
| Blocking validation (email OTP + USDC tx in Telegram) | ⬜ | Run `/validate` on device |
| Runs as real Mini App (bot, initData, theme params) | ⬜ | BotFather + HTTPS URL |
| `initData` verified server-side; bot token never in client | ✅ | `POST /api/telegram/validate` |
| Catalog + product detail + USDC checkout | ✅ | `/`, `/products/[id]`, `/checkout/[id]` |
| Checkout isolated in `buildCheckoutPayment({ to, amount })` | ✅ | `src/lib/checkout.ts` |
| Uses `PollarProvider` + `usePollar()` only for wallet | ✅ | |
| States: logged out, logging in, paying, success, error, unfunded | ✅ | |
| Pollar branding + Telegram light/dark theme | ✅ | CSS vars from theme params |
| Pins `@pollar/core@^0.9.0`, `@pollar/react@^0.9.0` | ✅ | + `@telegram-apps/sdk` only |
| Only publishable key in client (`pub_testnet_…`) | ✅ | |
| README: BotFather, Mini App URL, deploy, envs | ✅ | |
| `.env.example` included | ✅ | |
| In-Telegram demo video | ⬜ | Phone recording for submission |

## Auth

| Item | Status | Notes |
| --- | --- | --- |
| Email OTP (baseline) | ✅ | Primary path for webview |
| Google OAuth | ✅ | Via Pollar; opens with Telegram `openLink` when available |
| GitHub OAuth | ✅ | Same as Google — may be blocked in webview; don’t force |
| Pollar native login widget | ✅ | Secondary — header **Open Widget** → `openLoginModal()` |
| Passkey / Freighter | ❌ Out of scope | Per bounty |

## Setup you still need locally

- [ ] Valid `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY` (`pub_testnet_…`) from [dashboard.pollar.xyz](https://dashboard.pollar.xyz)
- [ ] Origin allowlisted (`http://localhost:3000` + HTTPS Mini App URL)
- [ ] `TELEGRAM_BOT_TOKEN` in `.env.local` (server only)
- [ ] `NEXT_PUBLIC_MERCHANT_ADDRESS` funded on testnet **with Circle USDC trustline**
- [ ] Payer Pollar wallet funded with **Circle** testnet USDC (issuer `GBBD47IF…FLA5`)
- [ ] HTTPS deploy (Vercel / ngrok) registered with BotFather

## Suggested demo script (video)

1. Open bot → launch Mini App  
2. Log in (email OTP)  
3. Open `/validate` or buy from catalog  
4. Pay small USDC amount  
5. Show confirmation + Stellar Expert link  

## Out of scope (do not build)

- Passkeys / WebAuthn, Freighter  
- Telegram Stars / native payments  
- Fiat / Ramp / KYC  
- Inventory DB / admin  
- Extra npm deps beyond Pollar + Telegram bridge  

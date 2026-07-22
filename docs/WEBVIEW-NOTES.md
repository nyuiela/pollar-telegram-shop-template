# Telegram webview vs browser notes

Fill this in while running the **blocking validation** at `/validate` inside a real Telegram bot. See also [`CHECKLIST.md`](../CHECKLIST.md).

## Goal

Document anything that behaves differently in Telegram’s in-app webview versus a normal browser for:

- Auth (email OTP baseline; Google/GitHub OAuth)
- Popups / redirects
- Storage / session persistence
- Viewport / theme

## Template defaults

| Area | Expected in Telegram webview | Implementation |
| --- | --- | --- |
| Email OTP | Works (plain HTTP Pollar flow) | Baseline — prefer this for demos |
| Google / GitHub OAuth | Often restricted in webview | Pollar `login({ provider })` + Telegram `openLink` (external browser); SDK polls session until ready |
| Passkey / WebAuthn | Unreliable | Out of scope |
| Freighter / extension wallets | Unavailable | Out of scope |
| `localStorage` | Usually available | Watch for `onStorageDegrade` → in-memory session |
| Theme | Telegram theme params | Bound via `@telegram-apps/sdk` |
| Viewport | Expand + safe-area CSS vars | Bound via `@telegram-apps/sdk` |
| USDC | Circle testnet issuer only | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

## Checklist while validating

1. Open Mini App from the bot (not a pasted URL in Safari/Chrome unless testing browser path).
2. Confirm `/api/telegram/validate` returns `ok: true` (bot token server-side only).
3. Complete **email OTP** → `walletAddress` visible.
4. Optionally try Google/GitHub; note if `openLink` / return works.
5. Send a small **Circle** USDC amount via `buildCheckoutPayment` / `signAndSubmitTx`.
6. Confirm the hash on [Stellar Expert testnet](https://stellar.expert/explorer/testnet).
7. Record differences below.

## Findings log

_Add dated notes here as you validate._

```
YYYY-MM-DD
- Environment: Telegram iOS / Android / Desktop
- Email OTP: …
- Google OAuth: …
- GitHub OAuth: …
- Signing: …
- Storage: …
- Other: …
```

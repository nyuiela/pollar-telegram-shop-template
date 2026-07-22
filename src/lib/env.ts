export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY ?? "";
}

export function getMerchantAddress(): string {
  return (
    process.env.NEXT_PUBLIC_MERCHANT_ADDRESS ??
    process.env.MERCHANT_ADDRESS ??
    ""
  );
}

export function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN ?? "";
}

export function isBrowserDevBypass(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEV === "true";
}

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export type TelegramInitUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type VerifiedInitData = {
  authDate: number;
  user: TelegramInitUser | null;
  queryId: string | null;
  startParam: string | null;
  raw: Record<string, string>;
};

export type VerifyInitDataResult =
  | { ok: true; data: VerifiedInitData }
  | { ok: false; error: string };

/**
 * Verifies Telegram Mini App `initData` with the bot token (HMAC-SHA256).
 * Bot token must stay server-side — never ship it to the client.
 *
 * Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  options?: { maxAgeSeconds?: number },
): VerifyInitDataResult {
  if (!initData?.trim()) {
    return { ok: false, error: "Missing initData" };
  }
  if (!botToken?.trim()) {
    return { ok: false, error: "Bot token is not configured" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { ok: false, error: "Missing hash" };
  }

  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  try {
    const a = Buffer.from(calculated, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Invalid initData signature" };
    }
  } catch {
    return { ok: false, error: "Invalid initData signature" };
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number(authDateRaw) : NaN;
  if (!Number.isFinite(authDate)) {
    return { ok: false, error: "Missing auth_date" };
  }

  const maxAgeSeconds = options?.maxAgeSeconds ?? 86_400;
  if (maxAgeSeconds > 0) {
    const age = Math.floor(Date.now() / 1000) - authDate;
    if (age > maxAgeSeconds) {
      return { ok: false, error: "initData expired" };
    }
  }

  let user: TelegramInitUser | null = null;
  const userRaw = params.get("user");
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as TelegramInitUser;
    } catch {
      return { ok: false, error: "Malformed user payload" };
    }
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    raw[key] = value;
  }

  return {
    ok: true,
    data: {
      authDate,
      user,
      queryId: params.get("query_id"),
      startParam: params.get("start_param"),
      raw,
    },
  };
}

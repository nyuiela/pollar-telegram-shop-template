import { NextResponse } from "next/server";
import { getBotToken } from "@/lib/env";
import { verifyTelegramInitData } from "@/lib/telegram/verify-init-data";

export const runtime = "nodejs";

/**
 * POST /api/telegram/validate
 * Body: { initData: string }
 *
 * Verifies Telegram initData with the bot token. The token never leaves the server.
 */
export async function POST(request: Request) {
  const botToken = getBotToken();
  if (!botToken) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const initData =
    typeof body === "object" &&
    body !== null &&
    "initData" in body &&
    typeof (body as { initData: unknown }).initData === "string"
      ? (body as { initData: string }).initData
      : null;

  if (!initData) {
    return NextResponse.json(
      { ok: false, error: "initData string is required" },
      { status: 400 },
    );
  }

  const result = verifyTelegramInitData(initData, botToken);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: result.data.user,
    authDate: result.data.authDate,
    queryId: result.data.queryId,
    startParam: result.data.startParam,
  });
}

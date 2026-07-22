"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  init,
  isTMA,
  retrieveRawInitData,
  miniApp,
  themeParams,
  viewport,
} from "@telegram-apps/sdk";
import { isBrowserDevBypass } from "@/lib/env";

export type TelegramSession = {
  ready: boolean;
  inTelegram: boolean;
  initData: string | null;
  verified: boolean | null;
  verifyError: string | null;
  user: {
    id: number;
    first_name?: string;
    username?: string;
  } | null;
};

const TelegramContext = createContext<TelegramSession>({
  ready: false,
  inTelegram: false,
  initData: null,
  verified: null,
  verifyError: null,
  user: null,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

async function verifyInitData(initData: string) {
  const res = await fetch("/api/telegram/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  const json = (await res.json()) as {
    ok: boolean;
    error?: string;
    user?: TelegramSession["user"];
  };
  return json;
}

function applyTelegramTheme() {
  if (themeParams.mountSync.isAvailable()) {
    themeParams.mountSync();
  }
  if (themeParams.bindCssVars.isAvailable()) {
    themeParams.bindCssVars();
  }
  if (miniApp.mountSync.isAvailable()) {
    miniApp.mountSync();
  }
  if (miniApp.bindCssVars.isAvailable()) {
    miniApp.bindCssVars();
  }
  if (viewport.mount.isAvailable()) {
    void viewport.mount().then(() => {
      if (viewport.bindCssVars.isAvailable()) {
        viewport.bindCssVars();
      }
      if (viewport.expand.isAvailable()) {
        viewport.expand();
      }
    });
  }
  if (miniApp.ready.isAvailable()) {
    miniApp.ready();
  }

  const dark = Boolean(themeParams.isDark());
  document.documentElement.dataset.tgTheme = dark ? "dark" : "light";
  document.documentElement.classList.toggle("dark", dark);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TelegramSession>({
    ready: false,
    inTelegram: false,
    initData: null,
    verified: null,
    verifyError: null,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const inTelegram = isTMA();
      const allowBrowser = isBrowserDevBypass();

      // Yield so session updates are not synchronous inside the effect body.
      await Promise.resolve();
      if (cancelled) return;

      if (!inTelegram) {
        setSession({
          ready: true,
          inTelegram: false,
          initData: null,
          verified: allowBrowser ? true : false,
          verifyError: allowBrowser
            ? null
            : "Open this Mini App from your Telegram bot (or set NEXT_PUBLIC_ALLOW_BROWSER_DEV=true for local UI work).",
          user: null,
        });
        return;
      }

      try {
        init();
        applyTelegramTheme();
      } catch (err) {
        if (cancelled) return;
        setSession({
          ready: true,
          inTelegram: true,
          initData: null,
          verified: false,
          verifyError:
            err instanceof Error ? err.message : "Failed to init Telegram SDK",
          user: null,
        });
        return;
      }

      const initData = retrieveRawInitData() ?? null;
      if (!initData) {
        if (cancelled) return;
        setSession({
          ready: true,
          inTelegram: true,
          initData: null,
          verified: false,
          verifyError: "Telegram initData is empty",
          user: null,
        });
        return;
      }

      try {
        const result = await verifyInitData(initData);
        if (cancelled) return;
        setSession({
          ready: true,
          inTelegram: true,
          initData,
          verified: result.ok,
          verifyError: result.ok
            ? null
            : (result.error ?? "Verification failed"),
          user: result.ok ? (result.user ?? null) : null,
        });
      } catch (err) {
        if (cancelled) return;
        setSession({
          ready: true,
          inTelegram: true,
          initData,
          verified: false,
          verifyError:
            err instanceof Error ? err.message : "Verification request failed",
          user: null,
        });
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => session, [session]);

  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}

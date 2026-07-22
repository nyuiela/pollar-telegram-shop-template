"use client";

import { PollarProvider } from "@pollar/react";
import "@pollar/react/styles.css";
import { useEffect, type ReactNode } from "react";
import { openLink } from "@telegram-apps/sdk";

const OAUTH_POPUP_NAME = "pollar-oauth";

function ShellMessage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--shop-fg)]">
        {title}
      </h1>
      <div className="mt-2 text-sm text-[var(--shop-muted)]">{children}</div>
    </div>
  );
}

/**
 * Close the OAuth popup once Pollar redirects it back to this origin.
 * The opener Mini App / tab keeps polling session status and becomes authenticated.
 */
function OAuthPopupReturn() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.name !== OAUTH_POPUP_NAME) return;
    if (!window.opener || window.opener.closed) return;

    // Landed on our site after hosted OAuth — hand control back to the opener.
    window.close();
  }, []);

  return null;
}

/**
 * Always mounted client-side (parent uses next/dynamic ssr:false).
 *
 * OAuth opener rules:
 * - Telegram: only `openLink` (external browser). Never same-tab redirect —
 *   that drops Mini App `initData` context.
 * - Browser: reserve a popup synchronously, then navigate it after `getUrl()`
 *   (Pollar’s required order for popup blockers). Never combine popup +
 *   `location.assign` — `noopener` makes `window.open` return null even when
 *   the popup opened, which previously caused both.
 */
export function PollarAppProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY ?? "";

  if (!apiKey) {
    return (
      <ShellMessage title="Missing Pollar key">
        <p>
          Set{" "}
          <code className="font-mono text-xs">
            NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY
          </code>{" "}
          to your <code className="font-mono text-xs">pub_testnet_…</code> key
          from{" "}
          <a
            className="underline"
            href="https://dashboard.pollar.xyz"
            target="_blank"
            rel="noreferrer"
          >
            dashboard.pollar.xyz
          </a>
          .
        </p>
      </ShellMessage>
    );
  }

  const oauthRedirectUri =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <PollarProvider
      client={{
        apiKey,
        stellarNetwork: "testnet",
        oauthRedirectUri,
        openAuthUrl: async ({ getUrl }) => {
          // Telegram Mini App: external browser only.
          if (openLink.isAvailable()) {
            const url = await getUrl();
            if (!url) return;
            openLink(url, { tryInstantView: false });
            return;
          }

          // Web: open blank popup in the user-gesture tick, then set URL.
          // Do not pass `noopener` here — it makes the return value `null`
          // even when the window opened, which previously triggered a second
          // same-tab redirect.
          const popup =
            typeof window !== "undefined"
              ? window.open(
                  "about:blank",
                  OAUTH_POPUP_NAME,
                  "width=480,height=720,resizable=yes,scrollbars=yes",
                )
              : null;

          const url = await getUrl();
          if (!url) {
            popup?.close();
            return;
          }

          if (popup && !popup.closed) {
            try {
              popup.location.href = url;
              return;
            } catch {
              popup.close();
            }
          }

          // True popup block only — last resort same-tab navigation.
          window.location.assign(url);
        },
      }}
      onStorageDegrade={() => {
        console.warn(
          "[pollar-telegram-shop] Storage degraded to in-memory — session may not survive reload in this webview.",
        );
      }}
    >
      <OAuthPopupReturn />
      {children}
    </PollarProvider>
  );
}

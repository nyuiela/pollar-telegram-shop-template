"use client";

import { PollarProvider } from "@pollar/react";
import "@pollar/react/styles.css";
import type { ReactNode } from "react";
import { openLink } from "@telegram-apps/sdk";

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
 * Always mounted client-side (parent uses next/dynamic ssr:false).
 * OAuth opens via Telegram `openLink` inside the Mini App webview; otherwise
 * falls back to a normal browser tab/popup.
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

  return (
    <PollarProvider
      client={{
        apiKey,
        stellarNetwork: "testnet",
        openAuthUrl: async ({ getUrl }) => {
          const url = await getUrl();
          if (!url) return;

          if (openLink.isAvailable()) {
            // Prefer system browser — Telegram webview often blocks OAuth popups.
            openLink(url, { tryInstantView: false });
            return;
          }

          const popup = window.open(
            url,
            "pollar-oauth",
            "noopener,noreferrer,width=480,height=720",
          );
          if (!popup) {
            window.location.assign(url);
          }
        },
      }}
      onStorageDegrade={() => {
        console.warn(
          "[pollar-telegram-shop] Storage degraded to in-memory — session may not survive reload in this webview.",
        );
      }}
    >
      {children}
    </PollarProvider>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

/**
 * Pollar + Telegram SDKs must only run in the browser. Disable SSR for the
 * provider tree so we never construct PollarClient on the server or hydrate
 * mismatched shells.
 */
const ClientProviders = dynamic(
  () =>
    import("./client-providers").then((m) => m.ClientProviders),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-md px-4 py-10 text-sm text-[var(--shop-muted)]">
        Starting Pollar…
      </div>
    ),
  },
);

export function AppProviders({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}

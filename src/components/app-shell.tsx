"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePollar } from "@pollar/react";
import { CopyableAddress } from "@/components/copyable-address";
import { useTelegram } from "@/components/telegram-provider";

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const telegram = useTelegram();
  const { isAuthenticated, walletAddress, logout } = usePollar();

  return (
    <div className="shop-shell min-h-[100dvh] overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b border-[var(--shop-border)] bg-[color-mix(in_srgb,var(--shop-bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="group min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--shop-accent)]">
              Pollar × Telegram
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight text-[var(--shop-fg)] group-hover:opacity-90">
              {title ?? "Mini Shop"}
            </h1>
          </Link>

          <div className="flex min-w-0 shrink-0 items-center gap-1.5">
            {isAuthenticated && walletAddress ? (
              <>
                <div className="min-w-0 rounded-lg bg-[var(--shop-surface)] px-1.5 py-0.5">
                  <CopyableAddress address={walletAddress} size="sm" />
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--shop-muted)] hover:text-[var(--shop-fg)]"
                >
                  Log out
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {!telegram.ready ? (
        <main className="mx-auto max-w-lg px-4 py-10 text-sm text-[var(--shop-muted)]">
          Connecting to Telegram…
        </main>
      ) : telegram.verified === false ? (
        <main className="mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-[var(--shop-border)] bg-[var(--shop-surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--shop-fg)]">
              Telegram session required
            </h2>
            <p className="mt-2 break-words text-sm leading-relaxed text-[var(--shop-muted)]">
              {telegram.verifyError ??
                "Open this app from your bot’s Mini App button so initData can be verified."}
            </p>
            <p className="mt-4 text-xs text-[var(--shop-muted)]">
              For local UI work outside Telegram, set{" "}
              <code className="font-mono">NEXT_PUBLIC_ALLOW_BROWSER_DEV=true</code>.
            </p>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-lg min-w-0 overflow-x-hidden px-4 py-5 pb-10">
          {children}
        </main>
      )}
    </div>
  );
}

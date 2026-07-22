"use client";

import Link from "next/link";
import { usePollar } from "@pollar/react";
import { AppShell } from "@/components/app-shell";
import { Catalog } from "@/components/catalog";
import { PollarLogin } from "@/components/email-login";

export default function HomePage() {
  const { isAuthenticated } = usePollar();

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-[var(--shop-border)] bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_srgb,var(--shop-accent)_22%,transparent),transparent_55%),var(--shop-surface)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--shop-accent)]">
            Pollar Mini Shop
          </p>
          <h2 className="mt-2 max-w-[16ch] text-3xl font-semibold tracking-tight text-[var(--shop-fg)]">
            Buy with USDC inside Telegram
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--shop-muted)]">
            Log in with Pollar (email OTP, or Google/GitHub), browse a short
            catalog, and pay from your embedded wallet on Stellar testnet —
            without leaving Telegram.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/validate"
              className="rounded-xl border border-[var(--shop-border)] bg-[var(--shop-bg)] px-3 py-2 text-xs font-medium text-[var(--shop-fg)]"
            >
              Run webview validation
            </Link>
          </div>
        </section>

        {!isAuthenticated ? (
          <PollarLogin />
        ) : (
          <Catalog />
        )}
      </div>
    </AppShell>
  );
}

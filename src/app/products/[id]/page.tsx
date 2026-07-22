"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getProduct } from "@/lib/products";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);

  if (!product) {
    return (
      <AppShell title="Not found">
        <p className="text-sm text-[var(--shop-muted)]">Product not found.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-[var(--shop-accent)]">
          Back to catalog
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Product">
      <article className="space-y-5">
        <Link
          href="/"
          className="text-sm text-[var(--shop-muted)] underline-offset-2 hover:underline"
        >
          ← Catalog
        </Link>

        <div className="rounded-3xl border border-[var(--shop-border)] bg-[var(--shop-surface)] p-6">
          <span
            aria-hidden
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--shop-accent)_14%,transparent)] text-3xl text-[var(--shop-accent)]"
          >
            {product.emoji}
          </span>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--shop-muted)]">
            {product.tagline}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--shop-fg)]">
            {product.name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--shop-muted)]">
            {product.description}
          </p>
          <p className="mt-5 font-mono text-2xl font-semibold text-[var(--shop-accent)]">
            {product.priceUsdc} USDC
          </p>

          <Link
            href={`/checkout/${product.id}`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--shop-accent)] px-4 py-3 text-sm font-semibold text-[var(--shop-accent-fg)] active:scale-[0.99]"
          >
            Buy with Pollar
          </Link>
        </div>
      </article>
    </AppShell>
  );
}

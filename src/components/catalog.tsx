"use client";

import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

export function Catalog() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--shop-fg)]">
          Catalog
        </h2>
        <p className="mt-1 text-sm text-[var(--shop-muted)]">
          Pay in USDC from your Pollar wallet on Stellar testnet.
        </p>
      </div>

      <ul className="space-y-3">
        {PRODUCTS.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.id}`}
              className="flex items-start gap-4 rounded-2xl border border-[var(--shop-border)] bg-[var(--shop-surface)] p-4 transition hover:border-[color-mix(in_srgb,var(--shop-accent)_45%,var(--shop-border))] active:scale-[0.995]"
            >
              <Image
                src={product.image}
                alt={product.name}
                width={96}
                height={96}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--shop-muted)]">
                      {product.tagline}
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold text-[var(--shop-fg)]">
                      {product.name}
                    </h3>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold text-[var(--shop-accent)]">
                    {product.priceUsdc} USDC
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--shop-muted)]">
                  {product.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

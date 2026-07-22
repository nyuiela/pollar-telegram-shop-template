"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CheckoutPanel } from "@/components/checkout-panel";
import { getProduct } from "@/lib/products";

export default function CheckoutPage() {
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
    <AppShell title="Checkout">
      <div className="space-y-4">
        <Link
          href={`/products/${product.id}`}
          className="text-sm text-[var(--shop-muted)] underline-offset-2 hover:underline"
        >
          ← {product.name}
        </Link>
        <CheckoutPanel product={product} />
      </div>
    </AppShell>
  );
}

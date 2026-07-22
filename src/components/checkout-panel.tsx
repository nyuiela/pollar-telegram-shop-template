"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePollar } from "@pollar/react";
import { CopyableAddress } from "@/components/copyable-address";
import { EmailLogin } from "@/components/email-login";
import { ErrorNotice, UnfundedNotice } from "@/components/status-notices";
import { useCircleUsdcBalance } from "@/hooks/use-circle-usdc-balance";
import { buildCheckoutPayment } from "@/lib/checkout";
import { getMerchantAddress } from "@/lib/env";
import { formatPaymentError, shortenAddress } from "@/lib/format";
import type { Product } from "@/lib/products";
import { STELLAR_EXPERT_TX, USDC_TESTNET_ISSUER } from "@/lib/stellar";

type CheckoutPhase =
  | "browsing"
  | "paying"
  | "success"
  | "error"
  | "unfunded";

type Notice = {
  title: string;
  detail: string;
  address: string | null;
  txHash?: string | null;
};

export function CheckoutPanel({ product }: { product: Product }) {
  const {
    isAuthenticated,
    verified,
    walletAddress,
    buildTx,
    signAndSubmitTx,
    tx,
    getClient,
  } = usePollar();

  const {
    amount: usdcBalance,
    loading: usdcLoading,
    mismatchHint,
    refresh: refreshUsdc,
    accountExists,
  } = useCircleUsdcBalance(walletAddress);

  const merchant = getMerchantAddress();
  const [phase, setPhase] = useState<CheckoutPhase>("browsing");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && verified) {
      void refreshUsdc();
    }
  }, [isAuthenticated, verified, refreshUsdc]);

  async function onPay() {
    setNotice(null);
    setTxHash(null);

    if (!merchant || merchant.includes("XXXX")) {
      setPhase("error");
      setNotice({
        title: "Merchant address missing",
        detail:
          "Set NEXT_PUBLIC_MERCHANT_ADDRESS to a real Stellar testnet G-address.",
        address: null,
      });
      return;
    }
    if (!verified) {
      setPhase("error");
      setNotice({
        title: "Session not ready",
        detail: "Wait for session verification before paying.",
        address: null,
      });
      return;
    }

    await refreshUsdc();

    if (accountExists === false) {
      setPhase("unfunded");
      setNotice({
        title: "Account not on testnet yet",
        detail:
          "This wallet has no on-chain account yet. Fund XLM with Friendbot, then get Circle testnet USDC.",
        address: walletAddress || null,
      });
      return;
    }

    if (
      usdcBalance === null ||
      Number(usdcBalance) < Number(product.priceUsdc)
    ) {
      setPhase("unfunded");
      setNotice({
        title: "Not enough Circle USDC",
        detail:
          mismatchHint ??
          (usdcBalance === null
            ? `Need ${product.priceUsdc} Circle USDC (issuer ${shortenAddress(USDC_TESTNET_ISSUER)}). Fund this exact Pollar address on the Circle testnet faucet.`
            : `Need ${product.priceUsdc} USDC; Circle USDC balance is ${usdcBalance}.`),
        address: walletAddress || null,
      });
      return;
    }

    setPhase("paying");
    try {
      const result = await buildCheckoutPayment(
        {
          buildTx,
          signAndSubmitTx,
          getTxState: () => getClient().getTransactionState(),
        },
        { to: merchant, amount: product.priceUsdc },
      );

      if (!result.ok) {
        const formatted = formatPaymentError(result.error);
        setPhase(formatted.kind);
        setNotice({
          title: formatted.title,
          detail: formatted.detail,
          address: formatted.address ?? walletAddress ?? null,
          txHash: result.hash ?? null,
        });
        return;
      }

      setTxHash(result.hash);
      setPhase("success");
      void refreshUsdc();
    } catch (err) {
      const raw =
        err instanceof Error ? err.message : "Unexpected payment error";
      const formatted = formatPaymentError(raw);
      setPhase(formatted.kind);
      setNotice({
        title: formatted.title,
        detail: formatted.detail,
        address: formatted.address ?? walletAddress ?? null,
      });
    }
  }

  if (!isAuthenticated) {
    return (
      <EmailLogin
        title="Log in to checkout"
        subtitle="Email OTP inside Telegram — Pollar creates your custodial wallet and signs on the server."
      />
    );
  }

  return (
    <section className="min-w-0 space-y-4 overflow-hidden">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--shop-border)] bg-[var(--shop-surface)] p-5">
        <div className="flex items-start gap-4">
          <Image
            src={product.image}
            alt={product.name}
            width={80}
            height={80}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--shop-muted)]">
              Checkout
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-[var(--shop-fg)]">
              {product.name}
            </h2>
            <p className="mt-2 font-mono text-2xl font-semibold text-[var(--shop-accent)]">
              {product.priceUsdc}{" "}
              <span className="text-base font-medium">USDC</span>
            </p>
          </div>
        </div>

        <dl className="mt-4 min-w-0 space-y-3 text-sm">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <dt className="shrink-0 text-[var(--shop-muted)]">Your wallet</dt>
            <dd className="min-w-0">
              {walletAddress ? (
                <CopyableAddress address={walletAddress} size="sm" />
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--shop-muted)]">Circle USDC</dt>
              <dd className="flex items-center gap-2 font-mono text-[var(--shop-fg)]">
                {usdcLoading ? "…" : (usdcBalance ?? "—")}
                <button
                  type="button"
                  onClick={() => void refreshUsdc()}
                  className="text-[11px] text-[var(--shop-accent)] underline-offset-2 hover:underline"
                >
                  Refresh
                </button>
              </dd>
            </div>
            <p className="text-[11px] text-[var(--shop-muted)]">
              Issuer {shortenAddress(USDC_TESTNET_ISSUER)} · Stellar testnet
            </p>
            {mismatchHint ? (
              <p className="text-[11px] leading-relaxed text-[var(--shop-danger)]">
                {mismatchHint}
              </p>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <dt className="shrink-0 text-[var(--shop-muted)]">Merchant</dt>
            <dd className="min-w-0">
              {merchant && !merchant.includes("XXXX") ? (
                <CopyableAddress address={merchant} size="sm" />
              ) : (
                <span className="text-[var(--shop-danger)]">not configured</span>
              )}
            </dd>
          </div>
        </dl>

        {phase === "paying" ||
        tx.step === "building" ||
        tx.step === "signing-submitting" ? (
          <p className="mt-4 text-sm text-[var(--shop-muted)]">
            Paying with Pollar… ({tx.step})
          </p>
        ) : null}

        {phase === "success" && txHash ? (
          <div className="mt-4 overflow-hidden rounded-xl bg-[color-mix(in_srgb,var(--shop-accent)_12%,transparent)] p-4">
            <p className="text-sm font-semibold text-[var(--shop-fg)]">
              Payment confirmed
            </p>
            <a
              href={STELLAR_EXPERT_TX(txHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block max-w-full truncate text-sm text-[var(--shop-accent)] underline-offset-2 hover:underline"
            >
              View on Stellar Expert
            </a>
          </div>
        ) : null}

        {phase === "unfunded" && notice ? (
          <UnfundedNotice
            address={notice.address}
            detail={notice.detail}
            txHash={notice.txHash}
          />
        ) : null}

        {phase === "error" && notice ? (
          <ErrorNotice
            title={notice.title}
            detail={notice.detail}
            address={notice.address}
            txHash={notice.txHash}
          />
        ) : null}

        {phase !== "success" ? (
          <button
            type="button"
            onClick={() => void onPay()}
            disabled={phase === "paying" || !verified}
            className="mt-5 w-full rounded-xl bg-[var(--shop-accent)] px-4 py-3 text-sm font-semibold text-[var(--shop-accent-fg)] transition enabled:active:scale-[0.99] disabled:opacity-60"
          >
            {phase === "paying"
              ? "Submitting…"
              : accountExists === false
                ? "Fund wallet to pay"
                : `Pay ${product.priceUsdc} USDC`}
          </button>
        ) : (
          <Link
            href="/"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-[var(--shop-border)] px-4 py-3 text-sm font-semibold text-[var(--shop-fg)]"
          >
            Back to catalog
          </Link>
        )}
      </div>
    </section>
  );
}

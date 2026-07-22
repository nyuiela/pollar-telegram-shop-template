"use client";

import { useEffect, useMemo, useState } from "react";
import { usePollar } from "@pollar/react";
import { AppShell } from "@/components/app-shell";
import { CopyableAddress } from "@/components/copyable-address";
import { EmailLogin } from "@/components/email-login";
import { ErrorNotice, UnfundedNotice } from "@/components/status-notices";
import { useTelegram } from "@/components/telegram-provider";
import { useCircleUsdcBalance } from "@/hooks/use-circle-usdc-balance";
import { buildCheckoutPayment } from "@/lib/checkout";
import { getMerchantAddress } from "@/lib/env";
import { formatPaymentError, shortenAddress } from "@/lib/format";
import {
  STELLAR_EXPERT_ACCOUNT,
  STELLAR_EXPERT_TX,
  USDC_TESTNET_ISSUER,
} from "@/lib/stellar";

type PaymentUi =
  | { kind: "idle" }
  | { kind: "paying" }
  | { kind: "done"; hash: string }
  | {
      kind: "error";
      title: string;
      detail: string;
      address: string | null;
      txHash?: string | null;
    }
  | {
      kind: "unfunded";
      title: string;
      detail: string;
      address: string | null;
      txHash?: string | null;
    };

/**
 * Blocking validation: prove email OTP login + one signAndSubmitTx USDC transfer
 * works end-to-end inside the Telegram webview before relying on the shop UI.
 */
export default function ValidatePage() {
  const telegram = useTelegram();
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
  const [amount, setAmount] = useState("0.10");
  const [payment, setPayment] = useState<PaymentUi>({ kind: "idle" });

  useEffect(() => {
    if (!isAuthenticated || !walletAddress) return;
    void refreshUsdc();
  }, [isAuthenticated, walletAddress, refreshUsdc]);

  const checklistStep = !isAuthenticated
    ? "login"
    : payment.kind === "paying"
      ? "pay"
      : payment.kind === "done"
        ? "done"
        : "wallet";

  const notes = useMemo(() => {
    const observed: string[] = [];
    if (telegram.inTelegram) {
      observed.push("Running inside Telegram Mini App webview.");
    } else {
      observed.push(
        "Running outside Telegram (browser). Auth/storage may differ from in-app webview.",
      );
    }
    if (telegram.verified) {
      observed.push("initData verified server-side with bot token.");
    }
    if (payment.kind === "done") {
      observed.push("signAndSubmitTx USDC transfer confirmed on testnet.");
      observed.push(`Tx: ${shortenAddress(payment.hash, 6, 6)}`);
    }
    return observed;
  }, [telegram.inTelegram, telegram.verified, payment]);

  async function runPayment() {
    if (!merchant || merchant.includes("XXXX")) {
      setPayment({
        kind: "error",
        title: "Merchant address missing",
        detail:
          "Set NEXT_PUBLIC_MERCHANT_ADDRESS to a real Stellar testnet G-address.",
        address: null,
      });
      return;
    }
    if (!verified) {
      setPayment({
        kind: "error",
        title: "Session not ready",
        detail: "Session not verified yet.",
        address: null,
      });
      return;
    }

    await refreshUsdc();

    if (accountExists === false) {
      setPayment({
        kind: "unfunded",
        title: "Account not on testnet yet",
        detail:
          "This wallet has no on-chain account yet. Fund XLM with Friendbot, then get Circle testnet USDC.",
        address: walletAddress || null,
      });
      return;
    }

    if (usdcBalance === null || Number(usdcBalance) < Number(amount)) {
      setPayment({
        kind: "unfunded",
        title: "Not enough Circle USDC",
        detail:
          mismatchHint ??
          (usdcBalance === null
            ? `Need ${amount} Circle USDC (issuer ${shortenAddress(USDC_TESTNET_ISSUER)}). Fund this exact Pollar address on the Circle testnet faucet.`
            : `Need ${amount} USDC; Circle USDC balance is ${usdcBalance}.`),
        address: walletAddress || null,
      });
      return;
    }

    setPayment({ kind: "paying" });
    try {
      const result = await buildCheckoutPayment(
        {
          buildTx,
          signAndSubmitTx,
          getTxState: () => getClient().getTransactionState(),
        },
        { to: merchant, amount },
      );

      if (!result.ok) {
        const formatted = formatPaymentError(result.error);
        setPayment({
          kind: formatted.kind,
          title: formatted.title,
          detail: formatted.detail,
          address: formatted.address ?? walletAddress ?? null,
          txHash: result.hash ?? null,
        });
        return;
      }

      setPayment({ kind: "done", hash: result.hash });
      void refreshUsdc();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Payment failed";
      const formatted = formatPaymentError(raw);
      setPayment({
        kind: formatted.kind,
        title: formatted.title,
        detail: formatted.detail,
        address: formatted.address ?? walletAddress ?? null,
      });
    }
  }

  return (
    <AppShell title="Webview validation">
      <div className="min-w-0 space-y-5 overflow-hidden">
        <section className="overflow-hidden rounded-2xl border border-[var(--shop-border)] bg-[var(--shop-surface)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shop-accent)]">
            Blocking criterion
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--shop-fg)]">
            Prove wallet works in Telegram
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--shop-muted)]">
            Login with email OTP, read your wallet address, then complete one
            USDC transfer on testnet and confirm it on Stellar Expert.
          </p>

          <ol className="mt-4 space-y-2 text-sm text-[var(--shop-muted)]">
            <li
              className={
                checklistStep !== "login" ? "text-[var(--shop-accent)]" : ""
              }
            >
              1. Email OTP login
            </li>
            <li
              className={
                checklistStep === "wallet" ||
                checklistStep === "pay" ||
                checklistStep === "done"
                  ? "text-[var(--shop-accent)]"
                  : ""
              }
            >
              2. Read walletAddress
            </li>
            <li
              className={
                checklistStep === "pay" || checklistStep === "done"
                  ? "text-[var(--shop-accent)]"
                  : ""
              }
            >
              3. USDC transfer via buildCheckoutPayment
            </li>
            <li
              className={
                checklistStep === "done" ? "text-[var(--shop-accent)]" : ""
              }
            >
              4. Confirm on Stellar Expert
            </li>
          </ol>
        </section>

        {!isAuthenticated ? <EmailLogin /> : null}

        {isAuthenticated ? (
          <section className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-[var(--shop-border)] bg-[var(--shop-surface)] p-5">
            <div className="min-w-0">
              <p className="text-xs text-[var(--shop-muted)]">walletAddress</p>
              {walletAddress ? (
                <div className="mt-1.5 min-w-0">
                  <CopyableAddress address={walletAddress} />
                  <a
                    href={STELLAR_EXPERT_ACCOUNT(walletAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-[var(--shop-accent)] underline-offset-2 hover:underline"
                  >
                    Open account on Stellar Expert
                  </a>
                </div>
              ) : (
                <p className="mt-1 font-mono text-sm text-[var(--shop-fg)]">—</p>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--shop-muted)]">Circle USDC</span>
                <span className="flex items-center gap-2 font-mono text-[var(--shop-fg)]">
                  {usdcLoading ? "…" : (usdcBalance ?? "—")}
                  <button
                    type="button"
                    onClick={() => void refreshUsdc()}
                    className="text-[11px] text-[var(--shop-accent)] underline-offset-2 hover:underline"
                  >
                    Refresh
                  </button>
                </span>
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

            <div className="min-w-0">
              <p className="text-xs text-[var(--shop-muted)]">Merchant</p>
              {merchant && !merchant.includes("XXXX") ? (
                <div className="mt-1">
                  <CopyableAddress address={merchant} size="sm" />
                </div>
              ) : (
                <p className="mt-1 text-sm text-[var(--shop-danger)]">
                  not configured
                </p>
              )}
            </div>

            <label className="block text-xs text-[var(--shop-muted)]">
              Amount (USDC)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--shop-border)] bg-[var(--shop-bg)] px-3 py-2.5 font-mono text-sm text-[var(--shop-fg)] outline-none focus:ring-2 focus:ring-[var(--shop-accent)]"
              />
            </label>

            <button
              type="button"
              onClick={() => void runPayment()}
              disabled={payment.kind === "paying" || !verified}
              className="w-full rounded-xl bg-[var(--shop-accent)] px-4 py-3 text-sm font-semibold text-[var(--shop-accent-fg)] disabled:opacity-60"
            >
              {payment.kind === "paying"
                ? `Submitting… (${tx.step})`
                : accountExists === false
                  ? "Fund wallet to continue"
                  : "Send USDC (signAndSubmitTx)"}
            </button>

            {payment.kind === "done" ? (
              <div className="min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-[var(--shop-fg)]">
                  Confirmed
                </p>
                <CopyableAddress
                  address={payment.hash}
                  className="mt-1"
                  size="sm"
                />
                <a
                  href={STELLAR_EXPERT_TX(payment.hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-[var(--shop-accent)] underline-offset-2 hover:underline"
                >
                  View on Stellar Expert
                </a>
              </div>
            ) : null}

            {payment.kind === "unfunded" ? (
              <UnfundedNotice
                address={payment.address}
                detail={payment.detail}
                txHash={payment.txHash}
              />
            ) : null}

            {payment.kind === "error" ? (
              <ErrorNotice
                title={payment.title}
                detail={payment.detail}
                address={payment.address}
                txHash={payment.txHash}
              />
            ) : null}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-dashed border-[var(--shop-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--shop-fg)]">
            Webview notes
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm break-words text-[var(--shop-muted)]">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            <li>
              Prefer email OTP here. OAuth popups/redirects are often blocked in
              Telegram&apos;s webview.
            </li>
            <li>
              Passkeys/WebAuthn are unreliable in in-app webviews — out of scope.
            </li>
            <li>
              If storage degrades, Pollar falls back to in-memory session (see
              console warning). Document that in{" "}
              <code className="font-mono text-xs">docs/WEBVIEW-NOTES.md</code>.
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

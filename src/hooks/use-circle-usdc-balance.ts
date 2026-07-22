"use client";

import { useCallback, useEffect, useState } from "react";
import { usePollar } from "@pollar/react";
import {
  fetchHorizonCircleUsdc,
  resolveUsdcBalance,
  type UsdcBalanceInfo,
} from "@/lib/balances";
import { shortenAddress } from "@/lib/format";
import { USDC_TESTNET_ISSUER } from "@/lib/stellar";

/**
 * Combines Pollar walletBalance with a Horizon cross-check for Circle USDC.
 * Checkout pays Circle testnet USDC only — a different USDC issuer won't spend.
 */
export function useCircleUsdcBalance(walletAddress: string | null | undefined) {
  const { walletBalance, refreshWalletBalance } = usePollar();
  const [horizon, setHorizon] = useState<UsdcBalanceInfo | null>(null);
  const [checking, setChecking] = useState(false);

  const fromPollar: UsdcBalanceInfo | null =
    walletBalance.step === "loaded"
      ? resolveUsdcBalance(walletBalance.data.balances)
      : null;

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      await refreshWalletBalance();
      if (walletAddress) {
        const live = await fetchHorizonCircleUsdc(walletAddress);
        setHorizon(live);
      } else {
        setHorizon(null);
      }
    } finally {
      setChecking(false);
    }
  }, [refreshWalletBalance, walletAddress]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!walletAddress) {
        setHorizon(null);
        return;
      }

      const live = await fetchHorizonCircleUsdc(walletAddress);
      if (!cancelled) setHorizon(live);
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const pollarAmount =
    fromPollar?.amount != null ? Number(fromPollar.amount) : null;
  const horizonAmount = horizon?.amount != null ? Number(horizon.amount) : null;

  let amount: string | null = null;
  let source: "pollar" | "horizon" | "none" = "none";

  if (horizonAmount != null && pollarAmount != null) {
    if (horizonAmount >= pollarAmount) {
      amount = horizon!.amount;
      source = "horizon";
    } else {
      amount = fromPollar!.amount;
      source = "pollar";
    }
  } else if (horizonAmount != null) {
    amount = horizon!.amount;
    source = "horizon";
  } else if (pollarAmount != null) {
    amount = fromPollar!.amount;
    source = "pollar";
  }

  const info: UsdcBalanceInfo = {
    amount,
    issuer: horizon?.issuer ?? fromPollar?.issuer ?? null,
    isCircleUsdc: Boolean(horizon?.isCircleUsdc || fromPollar?.isCircleUsdc),
    otherUsdc: [...(fromPollar?.otherUsdc ?? []), ...(horizon?.otherUsdc ?? [])].filter(
      (row, i, arr) => arr.findIndex((x) => x.issuer === row.issuer) === i,
    ),
  };

  const mismatchHint =
    info.otherUsdc.length > 0 && Number(info.amount ?? 0) === 0
      ? `Found USDC from another issuer ${shortenAddress(info.otherUsdc[0].issuer)} (${info.otherUsdc[0].amount}). Checkout pays Circle USDC only (${shortenAddress(USDC_TESTNET_ISSUER)}).`
      : null;

  return {
    info,
    amount: info.amount,
    loading: walletBalance.step === "loading" || checking,
    source,
    mismatchHint,
    refresh,
    accountExists:
      walletBalance.step === "loaded" ? walletBalance.data.exists : null,
  };
}

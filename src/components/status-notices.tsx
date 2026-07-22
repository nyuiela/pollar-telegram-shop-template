"use client";

import { CopyableAddress } from "@/components/copyable-address";
import {
  CIRCLE_FAUCET_URL,
  FRIENDBOT_URL,
  STELLAR_EXPERT_ACCOUNT,
  STELLAR_EXPERT_TX,
} from "@/lib/stellar";

type UnfundedNoticeProps = {
  address?: string | null;
  detail?: string;
  txHash?: string | null;
};

export function UnfundedNotice({
  address,
  detail,
  txHash,
}: UnfundedNoticeProps) {
  return (
    <div className="mt-4 space-y-3 overflow-hidden text-sm text-[var(--shop-muted)]">
      <div>
        <p className="font-semibold text-[var(--shop-fg)]">
          Wallet needs testnet funds
        </p>
        {detail ? (
          <p className="mt-1 break-words leading-relaxed">{detail}</p>
        ) : (
          <p className="mt-1 leading-relaxed">
            This account is not on Stellar testnet yet (or has no USDC). Fund XLM
            first, then grab testnet USDC.
          </p>
        )}
      </div>

      {address ? (
        <div className="min-w-0">
          <CopyableAddress address={address} size="sm" />
          <a
            href={STELLAR_EXPERT_ACCOUNT(address)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-[var(--shop-accent)] underline-offset-2 hover:underline"
          >
            View on Stellar Expert
          </a>
        </div>
      ) : null}

      {txHash ? (
        <a
          href={STELLAR_EXPERT_TX(txHash)}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-[var(--shop-accent)] underline-offset-2 hover:underline"
        >
          Failed tx on Stellar Expert
        </a>
      ) : null}

      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <a
          href={FRIENDBOT_URL}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--shop-accent)] underline-offset-2 hover:underline"
        >
          Friendbot (XLM)
        </a>
        <a
          href={CIRCLE_FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--shop-accent)] underline-offset-2 hover:underline"
        >
          Circle USDC faucet
        </a>
      </p>
    </div>
  );
}

type ErrorNoticeProps = {
  title?: string;
  detail: string;
  address?: string | null;
  txHash?: string | null;
};

export function ErrorNotice({
  title = "Something went wrong",
  detail,
  address,
  txHash,
}: ErrorNoticeProps) {
  return (
    <div className="mt-4 space-y-2 overflow-hidden text-sm" role="alert">
      <p className="font-semibold text-[var(--shop-danger)]">{title}</p>
      <p className="break-words leading-relaxed text-[var(--shop-muted)]">
        {detail}
      </p>
      {address ? (
        <div className="min-w-0 pt-1">
          <CopyableAddress address={address} size="sm" />
        </div>
      ) : null}
      {txHash ? (
        <a
          href={STELLAR_EXPERT_TX(txHash)}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-[var(--shop-accent)] underline-offset-2 hover:underline"
        >
          Failed tx on Stellar Expert
        </a>
      ) : null}
    </div>
  );
}

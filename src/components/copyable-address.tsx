"use client";

import { useState } from "react";
import { shortenAddress } from "@/lib/format";

type CopyableAddressProps = {
  address: string;
  /** Optional label shown before the shortened address. */
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

export function CopyableAddress({
  address,
  label,
  className = "",
  size = "md",
}: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);
  const short = shortenAddress(address);
  const textClass = size === "sm" ? "text-[11px]" : "text-sm";

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can fail in some webviews — ignore quietly.
    }
  }

  return (
    <div
      className={`inline-flex max-w-full min-w-0 items-center gap-1.5 ${className}`}
    >
      {label ? (
        <span className="shrink-0 text-[var(--shop-muted)]">{label}</span>
      ) : null}
      <code
        className={`min-w-0 truncate font-mono ${textClass} text-[var(--shop-fg)]`}
        title={address}
      >
        {short}
      </code>
      <button
        type="button"
        onClick={() => void onCopy()}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--shop-muted)] transition hover:bg-[color-mix(in_srgb,var(--shop-fg)_8%,transparent)] hover:text-[var(--shop-fg)]"
        aria-label={copied ? "Copied" : "Copy address"}
        title={copied ? "Copied" : "Copy address"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

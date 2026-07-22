/** Shorten a Stellar G-address for compact UI: GABC…XYZ1 */
export function shortenAddress(address: string, head = 4, tail = 4): string {
  const trimmed = address.trim();
  if (trimmed.length <= head + tail + 1) return trimmed;
  return `${trimmed.slice(0, head)}…${trimmed.slice(-tail)}`;
}

const STELLAR_ADDRESS_RE = /\b(G[A-Z2-7]{55})\b/g;

/** Replace full Stellar addresses in prose with shortened forms. */
export function shortenAddressesInText(text: string): string {
  return text.replace(STELLAR_ADDRESS_RE, (match) => shortenAddress(match));
}

export function extractStellarAddress(text: string): string | null {
  const match = text.match(/\b(G[A-Z2-7]{55})\b/);
  return match?.[1] ?? null;
}

export function isAccountNotOnNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("not found on network") ||
    m.includes("does not exist") ||
    (m.includes("account") && m.includes("not found")) ||
    m.includes("unfunded") ||
    m.includes("op_underfunded") ||
    m.includes("insufficient")
  );
}

export type FormattedPaymentError = {
  title: string;
  detail: string;
  kind: "unfunded" | "error";
  address: string | null;
};

/**
 * Turn raw Pollar/Horizon errors into short, non-overflowing copy.
 */
export function formatPaymentError(raw: string): FormattedPaymentError {
  const address = extractStellarAddress(raw);
  const lower = raw.toLowerCase();

  if (
    lower.includes("txfailed") ||
    lower.includes("tx_failed") ||
    lower.includes("0 usdc") ||
    lower.includes("circle testnet faucet")
  ) {
    return {
      kind: "unfunded",
      title: "Payment rejected on-chain",
      detail:
        "Stellar returned txFailed — usually your Pollar wallet has no USDC yet. Copy your wallet address, fund it on the Circle testnet faucet, then retry.",
      address,
    };
  }

  if (isAccountNotOnNetworkError(raw)) {
    return {
      kind: "unfunded",
      title: "Account not on testnet yet",
      detail: address
        ? `${shortenAddress(address)} has no balance on Stellar testnet. Fund it with Friendbot (XLM), then USDC from the Circle faucet.`
        : "This wallet is not funded on Stellar testnet yet. Fund it with Friendbot (XLM), then USDC from the Circle faucet.",
      address,
    };
  }

  if (
    lower.includes("no usdc trustline") ||
    lower.includes("op_no_trust") ||
    lower.includes("op_no_source_trust") ||
    lower.includes("op_src_no_trust") ||
    lower.includes("op_line_full")
  ) {
    return {
      kind: "error",
      title: "USDC trustline required",
      detail: shortenAddressesInText(raw),
      address,
    };
  }

  if (
    lower.includes("merchant") &&
    (lower.includes("not on testnet") || lower.includes("not found"))
  ) {
    return {
      kind: "error",
      title: "Merchant cannot receive yet",
      detail: shortenAddressesInText(raw),
      address,
    };
  }

  if (
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("api key")
  ) {
    return {
      kind: "error",
      title: "Could not reach Pollar",
      detail: shortenAddressesInText(raw),
      address,
    };
  }

  const detail = shortenAddressesInText(raw).trim();
  return {
    kind: "error",
    title: "Payment failed",
    detail:
      !detail || detail.toLowerCase() === "payment failed"
        ? "No details from Pollar. Confirm your API key, network, merchant is funded with a USDC trustline, and your wallet has USDC."
        : detail,
    address,
  };
}

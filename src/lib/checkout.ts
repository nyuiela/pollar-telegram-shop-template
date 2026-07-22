import type { SubmitOutcome, TransactionState } from "@pollar/core";
import { checkMerchantReceivable } from "@/lib/merchant";
import { USDC_ASSET } from "@/lib/stellar";

export type CheckoutPaymentArgs = {
  /** Merchant Stellar address that receives USDC. */
  to: string;
  /** USDC amount as a decimal string, e.g. "1.50". */
  amount: string;
};

type BuildPaymentOutcome =
  | { status: "built"; buildData: { unsignedXdr?: string } }
  | { status: "error"; details?: string };

export type CheckoutPaymentClient = {
  buildTx: (
    operation: "payment",
    params: {
      destination: string;
      amount: string;
      asset: typeof USDC_ASSET;
    },
  ) => Promise<BuildPaymentOutcome>;
  signAndSubmitTx: (unsignedXdr?: string) => Promise<SubmitOutcome>;
  /** Optional — used to surface richer Pollar tx-state errors when outcomes lack details. */
  getTxState?: () => TransactionState | null | undefined;
};

export type CheckoutPaymentResult =
  | { ok: true; hash: string; status: "success" | "pending" }
  | { ok: false; error: string; phase?: string; hash?: string };

const TX_CODE_HINTS: Record<string, string> = {
  txfailed:
    "Stellar rejected the payment (txFailed). Most often your Pollar wallet has 0 USDC or no USDC trustline — fund it via the Circle testnet faucet, then retry.",
  tx_failed:
    "Stellar rejected the payment (txFailed). Most often your Pollar wallet has 0 USDC or no USDC trustline — fund it via the Circle testnet faucet, then retry.",
  op_underfunded:
    "Insufficient USDC (or XLM reserve) in the payer wallet. Fund testnet USDC and retry.",
  op_no_trust:
    "Receiver cannot hold this asset (missing trustline).",
  op_no_source_trust:
    "Your wallet has no USDC trustline. Enable USDC in Pollar / fund via Circle faucet after trustline setup.",
  op_src_no_trust:
    "Your wallet has no USDC trustline. Enable USDC in Pollar / fund via Circle faucet after trustline setup.",
};

function uniqueCodes(
  ...parts: Array<string | undefined | null>
): string[] {
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    for (const piece of part.split(/[·|,/\s]+/)) {
      const code = piece.trim();
      if (!code) continue;
      if (!out.some((x) => x.toLowerCase() === code.toLowerCase())) {
        out.push(code);
      }
    }
  }
  return out;
}

function describeFailure(
  phase: string,
  outcome: { details?: string; resultCode?: string; hash?: string },
  txState?: TransactionState | null,
): string {
  const codes = uniqueCodes(
    outcome.details,
    outcome.resultCode,
    txState && txState.step === "error" ? txState.details : undefined,
  );

  for (const code of codes) {
    const hint = TX_CODE_HINTS[code.toLowerCase()];
    if (hint) return hint;
  }

  if (codes.length) return codes.join(" · ");

  if (txState && txState.step === "error" && txState.phase) {
    return `Payment failed during ${txState.phase}.`;
  }

  return `Payment failed during ${phase}. No details from Pollar — check payer USDC balance, trustlines, and network.`;
}

function networkHint(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message.toLowerCase();
  if (
    err.name === "TypeError" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed")
  ) {
    return "Network error reaching Pollar. Check connectivity, that your pub_testnet_ key is valid, and that this origin is allowlisted.";
  }
  return err.message || null;
}

/**
 * Isolated checkout payment: build a USDC payment, then sign+submit via Pollar.
 * Keep all wallet work here so the shop UI stays thin and this function can move later.
 */
export async function buildCheckoutPayment(
  client: CheckoutPaymentClient,
  { to, amount }: CheckoutPaymentArgs,
): Promise<CheckoutPaymentResult> {
  if (!to?.startsWith("G") || to.length !== 56) {
    return { ok: false, error: "Invalid merchant address", phase: "validate" };
  }
  if (!amount || Number(amount) <= 0) {
    return { ok: false, error: "Invalid amount", phase: "validate" };
  }

  const merchant = await checkMerchantReceivable(to);
  if (!merchant.ok) {
    return { ok: false, error: merchant.error, phase: "merchant" };
  }

  let built: BuildPaymentOutcome;
  try {
    built = await client.buildTx("payment", {
      destination: to,
      amount,
      asset: USDC_ASSET,
    });
  } catch (err) {
    return {
      ok: false,
      error: networkHint(err) ?? "Failed to build USDC payment",
      phase: "building",
    };
  }

  if (built.status === "error") {
    return {
      ok: false,
      error: describeFailure("building", built, client.getTxState?.()),
      phase: "building",
    };
  }

  const unsignedXdr = built.buildData.unsignedXdr;
  if (!unsignedXdr) {
    return {
      ok: false,
      error:
        "Build returned no unsigned transaction. Check the Pollar session is verified and the wallet can spend USDC.",
      phase: "building",
    };
  }

  let submitted: SubmitOutcome;
  try {
    submitted = await client.signAndSubmitTx(unsignedXdr);
  } catch (err) {
    return {
      ok: false,
      error: networkHint(err) ?? "Failed to sign and submit payment",
      phase: "signing-submitting",
    };
  }

  if (submitted.status === "error") {
    return {
      ok: false,
      error: describeFailure(
        "signing-submitting",
        submitted,
        client.getTxState?.(),
      ),
      phase: "signing-submitting",
      hash: submitted.hash,
    };
  }

  return {
    ok: true,
    hash: submitted.hash,
    status: submitted.status,
  };
}

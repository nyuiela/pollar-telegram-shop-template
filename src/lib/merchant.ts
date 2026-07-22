import { shortenAddress } from "@/lib/format";
import { USDC_TESTNET_ISSUER } from "@/lib/stellar";

type HorizonBalance = {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
};

type MerchantCheck =
  | { ok: true }
  | { ok: false; error: string; address: string };

/**
 * Checkout destination must exist on testnet and hold a USDC trustline,
 * otherwise Stellar rejects the payment.
 */
export async function checkMerchantReceivable(
  address: string,
): Promise<MerchantCheck> {
  if (!address?.startsWith("G") || address.length !== 56) {
    return {
      ok: false,
      error: "Merchant address is invalid. Set NEXT_PUBLIC_MERCHANT_ADDRESS.",
      address,
    };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${address}`,
    );
  } catch {
    return {
      ok: false,
      error:
        "Could not reach Stellar testnet to verify the merchant account. Check your network and retry.",
      address,
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      error: `Merchant ${shortenAddress(address)} is not on testnet yet. Fund it with Friendbot, then add a USDC trustline.`,
      address,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `Could not verify merchant account (HTTP ${res.status}).`,
      address,
    };
  }

  const data = (await res.json()) as { balances?: HorizonBalance[] };
  const hasUsdc = (data.balances ?? []).some(
    (b) =>
      b.asset_code === "USDC" && b.asset_issuer === USDC_TESTNET_ISSUER,
  );

  if (!hasUsdc) {
    return {
      ok: false,
      error: `Merchant ${shortenAddress(address)} has no USDC trustline. Add Circle testnet USDC trustline before receiving payments.`,
      address,
    };
  }

  return { ok: true };
}

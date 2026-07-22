import { USDC_TESTNET_ISSUER } from "@/lib/stellar";

export type BalanceRow = {
  type: string;
  code: string;
  issuer?: string;
  balance: string;
  available: string;
};

export type UsdcBalanceInfo = {
  /** Best spendable amount string, or null if no matching row. */
  amount: string | null;
  /** Issuer of the matched row, if any. */
  issuer: string | null;
  /** True when amount is for Circle testnet USDC. */
  isCircleUsdc: boolean;
  /** Other USDC rows (different issuers) that hold a positive balance. */
  otherUsdc: Array<{ issuer: string; amount: string }>;
};

function pickAmount(row: BalanceRow): string {
  // Prefer `available` when present; fall back to `balance`.
  const available = row.available?.trim();
  const balance = row.balance?.trim();
  if (available !== undefined && available !== "") return available;
  if (balance !== undefined && balance !== "") return balance;
  return "0";
}

function isUsdcRow(row: BalanceRow): boolean {
  return row.type !== "native" && row.code === "USDC";
}

/**
 * Resolve USDC from Pollar (or Horizon-shaped) balance rows.
 * Prefer Circle testnet issuer — that is the asset checkout pays.
 */
export function resolveUsdcBalance(balances: BalanceRow[]): UsdcBalanceInfo {
  const usdcRows = balances.filter(isUsdcRow);
  const circle = usdcRows.find((r) => r.issuer === USDC_TESTNET_ISSUER);
  const otherUsdc = usdcRows
    .filter((r) => r.issuer && r.issuer !== USDC_TESTNET_ISSUER)
    .map((r) => ({
      issuer: r.issuer!,
      amount: pickAmount(r),
    }))
    .filter((r) => Number(r.amount) > 0);

  if (circle) {
    return {
      amount: pickAmount(circle),
      issuer: circle.issuer ?? USDC_TESTNET_ISSUER,
      isCircleUsdc: true,
      otherUsdc,
    };
  }

  // No Circle USDC trustline — surface another USDC only as a hint.
  const first = usdcRows[0];
  if (first) {
    return {
      amount: pickAmount(first),
      issuer: first.issuer ?? null,
      isCircleUsdc: false,
      otherUsdc,
    };
  }

  return {
    amount: null,
    issuer: null,
    isCircleUsdc: false,
    otherUsdc,
  };
}

type HorizonBalance = {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
};

/**
 * Live Horizon check for Circle testnet USDC (source of truth on-chain).
 */
export async function fetchHorizonCircleUsdc(
  address: string,
): Promise<UsdcBalanceInfo | null> {
  if (!address?.startsWith("G")) return null;

  try {
    const res = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${address}`,
    );
    if (res.status === 404) {
      return {
        amount: null,
        issuer: null,
        isCircleUsdc: false,
        otherUsdc: [],
      };
    }
    if (!res.ok) return null;

    const data = (await res.json()) as { balances?: HorizonBalance[] };
    const rows: BalanceRow[] = (data.balances ?? []).map((b) => ({
      type: b.asset_type === "native" ? "native" : "credit_alphanum4",
      code: b.asset_code ?? "XLM",
      issuer: b.asset_issuer,
      balance: b.balance,
      available: b.balance,
    }));

    return resolveUsdcBalance(rows);
  } catch {
    return null;
  }
}

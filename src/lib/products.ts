export type Product = {
  id: string;
  name: string;
  description: string;
  /** USDC price on Stellar testnet. */
  priceUsdc: string;
  emoji: string;
  tagline: string;
};

/** Static catalog — no inventory backend required for this template. */
export const PRODUCTS: Product[] = [
  {
    id: "stellar-sticker",
    name: "Stellar Sticker Pack",
    description:
      "Digital sticker pack celebrating Stellar testnet. Pays out in USDC via Pollar.",
    priceUsdc: "0.50",
    emoji: "✦",
    tagline: "Mini collectible",
  },
  {
    id: "testnet-mug",
    name: "Testnet Mug (voucher)",
    description:
      "A voucher for a limited testnet mug. Checkout settles on-chain in USDC.",
    priceUsdc: "1.00",
    emoji: "◎",
    tagline: "Merch voucher",
  },
  {
    id: "pollar-cap",
    name: "Pollar Cap (voucher)",
    description:
      "Claim a Pollar-branded cap voucher. Paid from your embedded Pollar wallet.",
    priceUsdc: "2.50",
    emoji: "◇",
    tagline: "Brand drop",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Circle USDC on Stellar testnet. */
export const USDC_TESTNET_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const USDC_ASSET = {
  type: "credit_alphanum4" as const,
  code: "USDC",
  issuer: USDC_TESTNET_ISSUER,
};

export const STELLAR_EXPERT_TX = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export const STELLAR_EXPERT_ACCOUNT = (address: string) =>
  `https://stellar.expert/explorer/testnet/account/${address}`;

export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const CIRCLE_FAUCET_URL = "https://faucet.circle.com";

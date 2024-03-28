export const NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// export const MULTICALL_ADDRESS: { [chainId: number]: string } = {
//   1: "",
//   137: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
//   56: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
//   43114: "0xF2FD8219609E28C61A998cc534681f95D2740f61",
//   250: "0x878dFE971d44e9122048308301F540910Bbd934c",
//   25: "0x63Abb9973506189dC3741f61d25d4ed508151E6d",
//   42161: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
//   199: "0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54",
//   106: "0x1877Ec0770901cc6886FDA7E7525a78c2Ed4e975",
//   1313161554: "0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54",
//   42262: "0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54",
//   10: "0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974",
//   59144: "0xcA11bde05977b3631167028862bE2a173976CA11",
//   1101: "0xcA11bde05977b3631167028862bE2a173976CA11",
//   324: "0xF9cda624FBC7e059355ce98a31693d299FACd963",
//   8453: "0xcA11bde05977b3631167028862bE2a173976CA11",
// };

export const NetworkInfo: {
  [chainId: number]: {
    name: string;
    logo: string;
    scanLink: string;
    multiCall: string;
    defaultRpc: string;
  };
} = {
  1: {
    name: "Ethereum",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/fd07cf5c-3ddf-4215-aa51-e6ee2c60afbc1697031732146.png",
    scanLink: "https://etherscan.io",
    multiCall: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    defaultRpc: "https://ethereum.kyberengineering.io",
  },
  137: {
    name: "Polygon POS",
    logo: "https://polygonscan.com/assets/poly/images/svg/logos/token-light.svg?v=24.2.3.1",
    scanLink: "https://polygonscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://polygon.kyberengineering.io",
  },

};

export const UNI_V3_BPS = 10_000;

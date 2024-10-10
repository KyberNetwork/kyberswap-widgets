import { ChainId } from "@kyberswap/ks-sdk-core";
import { NetworkInfo } from "@/constants";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getEtherscanLink(
  chainId: ChainId,
  data: string,
  type: "transaction" | "token" | "address" | "block"
): string {
  const prefix = NetworkInfo[chainId].scanLink;

  switch (type) {
    case "transaction": {
      return `${prefix}/tx/${data}`;
    }
    case "token": {
      if (chainId === ChainId.ZKSYNC) return `${prefix}/address/${data}`;
      return `${prefix}/token/${data}`;
    }
    case "block": {
      return `${prefix}/block/${data}`;
    }
    case "address":
    default: {
      return `${prefix}/address/${data}`;
    }
  }
}

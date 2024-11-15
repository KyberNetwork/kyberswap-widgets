import { useWeb3Provider } from "./useProvider";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

export default function useMarketPrice(tokensAddress: string) {
  const { chainId } = useWeb3Provider();

  const { prices } = useTokenPrices({
    addresses: tokensAddress.split(","),
    chainId,
  });
  return Object.keys(prices).map((key) => {
    return prices[key] || 0;
  });
}

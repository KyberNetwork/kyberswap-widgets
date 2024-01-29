import { Contract, ContractInterface } from "ethers";
import { useMemo } from "react";
import { isAddress } from "../utils";
import { useWeb3Provider } from "./useProvider";
import MulticallABI from "../abis/multicall.json";
import { NetworkInfo } from "../constants";

export function useContract(
  address: string,
  ABI: ContractInterface
): Contract | null {
  const { provider, account } = useWeb3Provider();
  return useMemo(() => {
    const checksumAddress = isAddress(address);
    if (!checksumAddress) return null;
    try {
      return new Contract(
        checksumAddress,
        ABI,
        account ? provider.getSigner(account) : provider
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  }, [address, ABI, provider, account]);
}

export const useMulticalContract = () => {
  const { chainId } = useWeb3Provider();

  return useContract(NetworkInfo[chainId].multiCall, MulticallABI);
};

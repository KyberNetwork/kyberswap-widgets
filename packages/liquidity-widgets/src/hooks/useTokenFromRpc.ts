import { useContract } from "./useContract";
import ERC20ABI from "../abis/erc20.json";
import { useEffect, useState } from "react";
import { useWeb3Provider } from "./useProvider";
import { Token } from "../entities/Pool";

export const useTokenFromRpc = (address: string) => {
  const tokenContract = useContract(address, ERC20ABI);
  const { chainId } = useWeb3Provider();

  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);

  useEffect(() => {
    const getInfo = async () => {
      const [name, symbol, decimals] = await Promise.all([
        tokenContract?.name(),
        tokenContract?.symbol(),
        tokenContract?.decimals(),
      ]);

      setTokenInfo({
        address,
        name,
        symbol,
        decimals,
        chainId,
        logoURI: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${name}`,
      });
    };

    getInfo();
  }, [tokenContract, address, chainId]);

  return tokenInfo;
};

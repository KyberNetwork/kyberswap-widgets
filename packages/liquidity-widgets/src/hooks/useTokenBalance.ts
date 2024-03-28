import { useEffect, useState } from "react";
import { useContract } from "./useContract";
import ERC20ABI from "../abis/erc20.json";
import { useWeb3Provider } from "./useProvider";
import { BigNumber } from "ethers";

export default function useTokenBalance(address: string) {
  const erc20Contract = useContract(address, ERC20ABI, true);
  const { account } = useWeb3Provider();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (account && erc20Contract) {
      setLoading(true);
      erc20Contract
        .balanceOf(account)
        .then((res: BigNumber) => {
          setBalance(res.toString());
        })
        .finally(() => setLoading(false));
    }
  }, [account, erc20Contract]);

  return {
    loading,
    balance,
  };
}

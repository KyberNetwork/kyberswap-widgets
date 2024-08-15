import { useCallback, useEffect, useState } from "react";
import multicallABI from "../abis/multicall.json";
import { useContract } from "./useContract";
import ERC20ABI from "../abis/erc20.json";
import { useWeb3Provider } from "./useProvider";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "../constants";
import { Interface } from "ethers/lib/utils";

export default function useTokenBalance(address: string) {
  const erc20Contract = useContract(address, ERC20ABI, true);
  const { account } = useWeb3Provider();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getBalance = () => {
      if (account && erc20Contract) {
        setLoading(true);
        erc20Contract
          .balanceOf(account)
          .then((res: BigNumber) => {
            setBalance(res.toString());
          })
          .finally(() => setLoading(false));
      } else setBalance("0");
    };
    getBalance();
    const i = setInterval(() => getBalance(), 10_000);
    return () => clearInterval(i);
  }, [account, erc20Contract]);

  return {
    loading,
    balance,
  };
}

export function useNativeBalance() {
  const { account, provider } = useWeb3Provider();
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getBalance = () => {
      if (account)
        provider.getBalance(account).then((res) => setBalance(res.toString()));
      else setBalance("0");
    };

    getBalance();
    const i = setInterval(() => getBalance(), 10_000);
    return () => clearInterval(i);
  }, [provider, account]);

  return balance;
}

const erc20Interface = new Interface(ERC20ABI);
export const useTokenBalances = (tokenAddresses: string[]) => {
  const { provider, chainId, account } = useWeb3Provider();
  const multicallContract = useContract(
    NetworkInfo[chainId]?.multiCall,
    multicallABI
  );
  const [balances, setBalances] = useState<{ [address: string]: BigNumber }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!provider || !account) {
      setBalances({});
      return;
    }
    try {
      setLoading(true);
      const nativeBalance = await provider.getBalance(account);

      const fragment = erc20Interface.getFunction("balanceOf");
      const callData = erc20Interface.encodeFunctionData(fragment, [account]);

      const addresses = tokenAddresses.filter(
        (item) => item.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
      );

      const chunks = addresses.map((address) => ({
        target: address,
        callData,
      }));

      const res = await multicallContract?.callStatic.tryBlockAndAggregate(
        false,
        chunks
      );
      const balances = res.returnData.map((item: any) => {
        return erc20Interface.decodeFunctionResult(fragment, item.returnData);
      });
      setLoading(false);

      setBalances({
        [NATIVE_TOKEN_ADDRESS]: nativeBalance,
        [NATIVE_TOKEN_ADDRESS.toLowerCase()]: nativeBalance,
        ...balances.reduce(
          (
            acc: { [address: string]: BigNumber },
            item: { balance: BigNumber },
            index: number
          ) => {
            if (
              addresses[index].toLowerCase() ===
              NATIVE_TOKEN_ADDRESS.toLowerCase()
            )
              return acc;
            return {
              ...acc,
              [addresses[index].toLowerCase()]: item.balance,
            };
          },
          {} as { [address: string]: BigNumber }
        ),
      });
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, account, chainId, JSON.stringify(tokenAddresses)]);

  useEffect(() => {
    fetchBalances();

    const i = setInterval(() => {
      fetchBalances();
    }, 10_000);

    return () => {
      clearInterval(i);
    };
  }, [provider, fetchBalances]);

  return {
    loading,
    balances,
    refetch: fetchBalances,
  };
};

import { useEffect, useState } from "react";
import Univ3PoolABI from "../abis/univ3_pool.json";
import { useMulticalContract } from "./useContract";
import { Interface } from "ethers/lib/utils";
import { useWeb3Provider } from "./useProvider";

export interface Token {
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  address: string;
  logoURI: string;
}

const Univ3PoolInterface = new Interface(Univ3PoolABI);

export default function useTokenFromPoolAddress(poolAddress: string) {
  const [loading, setLoading] = useState(true);
  const [poolInfo, setPoolInfo] = useState<{
    token0: Token;
    token1: Token;
    fee: number;
  } | null>(null);

  const multicallContract = useMulticalContract();
  const { chainId } = useWeb3Provider();

  useEffect(() => {
    const getPoolInfo = async () => {
      const fns = ["token0", "token1", "fee"];
      const fragments = fns.map((fn) => Univ3PoolInterface.getFunction(fn));
      const chunks = fragments.map((fragment) => ({
        target: poolAddress,
        callData: Univ3PoolInterface.encodeFunctionData(fragment),
      }));
      const multiCallRes =
        await multicallContract?.callStatic.tryBlockAndAggregate(false, chunks);

      const [address0, address1, fee] = multiCallRes.returnData.map(
        (item: { returnData: string }, index: number) => {
          return Univ3PoolInterface.decodeFunctionResult(
            fragments[index],
            item.returnData
          )[0];
        }
      );

      const tokens = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/tokens?chainIds=${chainId}&addresses=${address0},${address1}`
      )
        .then((res) => res.json())
        .then((res) => res?.data?.tokens || []);
      let token0 = tokens.find(
        (tk: Token) => tk.address.toLowerCase() === address0.toLowerCase()
      );
      let token1 = tokens.find(
        (tk: Token) => tk.address.toLowerCase() === address1.toLowerCase()
      );
      const addressToImport = [
        ...(token0 ? [address0] : []),
        ...(token1 ? [address1] : []),
      ];

      if (addressToImport.length) {
        const tokens = await fetch(
          "https://ks-setting.kyberswap.com/api/v1/tokens/import",
          {
            method: "POST",
            body: JSON.stringify({
              tokens: addressToImport.map((item) => ({
                chainId: chainId.toString(),
                address: item,
              })),
            }),
          }
        )
          .then((res) => res.json())
          .then((res) =>
            res?.data?.tokens.map(
              (item: { data: Token }) =>
                ({
                  ...item.data,
                  chainId: +item.data.chainId,
                } || [])
            )
          );

        if (!token0)
          token0 = tokens.find(
            (item: Token) =>
              item.address.toLowerCase() === address0.toLowerCase()
          );
        if (!token0)
          token1 = tokens.find(
            (item: Token) =>
              item.address.toLowerCase() === address1.toLowerCase()
          );
      }
      if (token0 && token1 && fee)
        setPoolInfo({
          token0,
          token1,
          fee,
        });
      setLoading(false);
    };
    getPoolInfo();
  }, [chainId, multicallContract, poolAddress]);

  return { loading, poolInfo };
}

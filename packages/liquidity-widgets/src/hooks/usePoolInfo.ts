import { useEffect, useState } from "react";
import Univ3PoolABI from "../abis/univ3_pool.json";
import { useContract, useMulticalContract } from "./useContract";
import { Interface } from "ethers/lib/utils";
import { useWeb3Provider } from "./useProvider";
import { FeeAmount, Pool as UniPool } from "@uniswap/v3-sdk";
import { BigintIsh, Token as UniToken } from "@uniswap/sdk-core";

export class Token extends UniToken {
  public readonly logoURI?: string;

  constructor(
    chainId: number,
    address: string,
    decimals: number,
    symbol?: string,
    name?: string,
    logoURI?: string
  ) {
    super(chainId, address, decimals, symbol, name);
    this.logoURI = logoURI;
  }
}

export class Pool extends UniPool {
  constructor(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
    sqrtRatioX96: BigintIsh,
    liquidity: BigintIsh,
    tickCurrent: number
  ) {
    super(tokenA, tokenB, fee, sqrtRatioX96, liquidity, tickCurrent);
  }
}

interface TokenInfo {
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  address: string;
  logoURI: string;
}

const Univ3PoolInterface = new Interface(Univ3PoolABI);

export default function usePoolInfo(poolAddress: string) {
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<Pool | null>(null);

  const multicallContract = useMulticalContract();
  const { chainId } = useWeb3Provider();
  const poolContract = useContract(poolAddress, Univ3PoolABI, true);

  useEffect(() => {
    const getPoolInfo = async () => {
      if (!multicallContract || !!pool) return;
      const fns = ["token0", "token1", "fee", "slot0", "liquidity"];
      const fragments = fns.map((fn) => Univ3PoolInterface.getFunction(fn));
      const chunks = fragments.map((fragment) => ({
        target: poolAddress,
        callData: Univ3PoolInterface.encodeFunctionData(fragment),
      }));
      const multiCallRes =
        await multicallContract.callStatic.tryBlockAndAggregate(false, chunks);

      const [addr0, addr1, f, slot0, liq] = multiCallRes.returnData.map(
        (item: { returnData: string }, index: number) => {
          return Univ3PoolInterface.decodeFunctionResult(
            fragments[index],
            item.returnData
          );
        }
      );

      const [address0, address1, fee, liquidity] = [addr0, addr1, f, liq].map(
        (item) => item[0]
      );

      const tokens = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/tokens?chainIds=${chainId}&addresses=${address0},${address1}`
      )
        .then((res) => res.json())
        .then((res) => res?.data?.tokens || []);

      let token0Info = tokens.find(
        (tk: TokenInfo) => tk.address.toLowerCase() === address0.toLowerCase()
      );
      let token1Info = tokens.find(
        (tk: TokenInfo) => tk.address.toLowerCase() === address1.toLowerCase()
      );

      const addressToImport = [
        ...(!token0Info ? [address0] : []),
        ...(!token1Info ? [address1] : []),
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
              (item: { data: TokenInfo }) =>
                ({
                  ...item.data,
                  chainId: +item.data.chainId,
                } || [])
            )
          );

        if (!token0Info)
          token0Info = tokens.find(
            (item: Token) =>
              item.address.toLowerCase() === address0.toLowerCase()
          );
        if (!token1Info)
          token1Info = tokens.find(
            (item: Token) =>
              item.address.toLowerCase() === address1.toLowerCase()
          );
      }
      if (token0Info && token1Info && fee) {
        const initToken = (t: TokenInfo) =>
          new Token(
            t.chainId,
            t.address,
            t.decimals,
            t.symbol,
            t.name,
            t.logoURI
          );

        const token0 = initToken(token0Info);
        const token1 = initToken(token1Info);

        const pool = new Pool(
          token0,
          token1,
          fee,
          slot0.sqrtPriceX96,
          liquidity,
          slot0.tick
        );
        setPool(pool);
      }
      setLoading(false);
    };
    getPoolInfo();
  }, [chainId, multicallContract, poolAddress, pool]);

  useEffect(() => {
    let i: NodeJS.Timeout | undefined;
    if (!!pool && poolContract) {
      const getSlot0 = async () => {
        const [slot0, liquidity] = await Promise.all([
          poolContract.slot0(),
          poolContract.liquidity(),
        ]);

        setPool(
          new Pool(
            pool.token0,
            pool.token1,
            pool.fee,
            slot0.sqrtPriceX96,
            liquidity,
            slot0.tick
          )
        );
      };

      i = setInterval(() => {
        getSlot0();
      }, 15_000);
    }

    return () => {
      i && clearInterval(i);
    };
  }, [pool, poolContract]);

  return { loading, pool };
}

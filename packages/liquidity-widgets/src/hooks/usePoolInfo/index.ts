import { PoolType } from "../useWidgetInfo";
import { PancakeToken, PancakeV3Pool } from "./pancakev3";
import { UniToken, UniV3Pool } from "./univ3";
import { Price as UniPrice } from "@uniswap/sdk-core";
import { Price as PancakePrice } from "@pancakeswap/swap-sdk-core";
import { tickToPrice as uniTickToPrice } from "@uniswap/v3-sdk";
import { tickToPrice } from "@pancakeswap/v3-sdk";

export { default as useUniV3PoolInfo } from "./univ3";
export * from "./univ3";
export { default as usePancakeV3PoolInfo } from "./pancakev3";
export * from "./pancakev3";

export type TokenGeneric<T> = T extends PoolType.DEX_PANCAKESWAPV3
  ? PancakeToken
  : UniToken;
export type PoolGeneric<T> = T extends PoolType.DEX_UNISWAPV3
  ? UniV3Pool
  : PancakeV3Pool;
export type PriceGeneric<T> = T extends PoolType.DEX_UNISWAPV3
  ? UniPrice<
      TokenGeneric<PoolType.DEX_UNISWAPV3>,
      TokenGeneric<PoolType.DEX_UNISWAPV3>
    >
  : PancakePrice<
      TokenGeneric<PoolType.DEX_PANCAKESWAPV3>,
      TokenGeneric<PoolType.DEX_PANCAKESWAPV3>
    >;

export type Token = TokenGeneric<keyof PoolType>;
export type Pool = PoolGeneric<keyof PoolType>;
export type Price = PriceGeneric<keyof PoolType>;

export function tickToPriceByPoolType(
  poolType: PoolType,
  tokenA: Token,
  tokenB: Token,
  tick: number
) {
  if (poolType === PoolType.DEX_PANCAKESWAPV3) {
    return uniTickToPrice(tokenA, tokenB, tick);
  }

  return tickToPrice(tokenA as PancakeToken, tokenB as PancakeToken, tick);
}

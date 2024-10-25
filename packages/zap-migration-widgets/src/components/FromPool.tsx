import { Skeleton } from "@kyber/ui/skeleton";
import { usePoolsStore } from "../stores/usePoolsStore";
import { Image } from "./Image";
import { usePositionStore } from "../stores/useFromPositionStore";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import {
  formatDollarAmount,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";

export const LiquiditySkeleton = () => (
  <>
    <Skeleton className="w-16 h-5" />
    <div className="flex flex-col items-end">
      <Skeleton className="w-10 h-4" />
      <Skeleton className="w-14 h-3 mt-1" />
    </div>
  </>
);

export function FromPool() {
  const { pools } = usePoolsStore();
  const { position } = usePositionStore();

  let amount0 = 0n;
  let amount1 = 0n;
  if (position !== "loading" && pools !== "loading") {
    ({ amount0, amount1 } = getPositionAmounts(
      pools[0].tick,
      position.tickLower,
      position.tickUpper,
      BigInt(pools[0].sqrtPriceX96),
      position.liquidity
    ));
  }

  return (
    <div className="flex-1 border border-stroke rounded-md px-4 py-3">
      <div className="text-subText text-sm">
        Your Current Position Liquidity
      </div>
      <div className="mt-2 flex items-start justify-between">
        {pools === "loading" || position === "loading" ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image
                src={pools[0].token0.logo || ""}
                alt={pools[0].token0.symbol}
                className="w-4 h-4"
              />
              <span className="text-base">{pools[0].token0.symbol}</span>
            </div>
            <div className="text-base flex flex-col items-end">
              {formatTokenAmount(amount0, pools[0].token0.decimals, 10)}
              <div className="text-subText text-xs">
                {formatDollarAmount(
                  (pools[0].token0.price || 0) *
                    Number(toRawString(amount0, pools[0].token0.decimals))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex items-start justify-between">
        {pools === "loading" || position === "loading" ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image
                src={pools[0].token1.logo || ""}
                alt={pools[0].token1.symbol}
                className="w-4 h-4"
              />
              <span className="text-base">{pools[0].token1.symbol}</span>
            </div>
            <div className="text-base flex flex-col items-end">
              {formatTokenAmount(amount1, pools[0].token1.decimals, 10)}
              <div className="text-subText text-xs">
                {formatDollarAmount(
                  (pools[0].token1.price || 0) *
                    Number(toRawString(amount1, pools[0].token1.decimals))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

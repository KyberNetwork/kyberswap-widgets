import {
  UniV3Position,
  univ2PoolNormalize,
  univ3PoolNormalize,
} from "@/schema";
import questionImg from "@/assets/svg/question.svg?url";
import { useZapOutContext } from "@/stores/zapout";
import { assertUnreachable } from "@/utils";
import { Skeleton } from "@kyber/ui/skeleton";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import CircleChevronRight from "@/assets/svg/circle-chevron-right.svg";
import { useZapOutUserState } from "@/stores/zapout/zapout-state";
import { useEffect } from "react";

export function ZapTo() {
  const { position, pool, poolType } = useZapOutContext((s) => s);
  const loading = position === "loading" || pool === "loading";

  const { liquidityOut, tokenOut, setTokenOut } = useZapOutUserState();

  useEffect(() => {
    if (!tokenOut && pool !== "loading") setTokenOut(pool.token0);
  }, [tokenOut, pool]);

  let amount0 = 0n;
  let amount1 = 0n;
  if (!loading) {
    const { success: isUniv3, data: univ3Pool } =
      univ3PoolNormalize.safeParse(pool);

    const { success: isUniv2, data: univ2Pool } =
      univ2PoolNormalize.safeParse(pool);

    if (isUniv3) {
      ({ amount0, amount1 } = getPositionAmounts(
        univ3Pool.tick,
        (position as UniV3Position).tickLower,
        (position as UniV3Position).tickUpper,
        BigInt(univ3Pool.sqrtPriceX96),
        liquidityOut
      ));
    } else if (isUniv2) {
      // TODO: handle univ2
      console.log(univ2Pool);
    } else assertUnreachable(poolType as never, `${poolType} is not handled`);
  }

  return (
    <>
      <div className="rounded-lg border border-stroke px-4 py-3 text-subText text-sm">
        <div>Your Position Liquidity</div>

        <div className="flex justify-between mt-4 items-start">
          {loading ? (
            <>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                <img
                  src={pool.token0.logo || ""}
                  alt=""
                  className="w-4 h-4"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = questionImg;
                  }}
                />
                {pool.token0.symbol}
              </div>
              <div className="text-xs text-subText text-right">
                <div className="text-text text-base">
                  {formatTokenAmount(amount0, pool.token0.decimals, 8)}
                </div>
                {formatDisplayNumber(
                  (pool.token0.price || 0) *
                    Number(toRawString(amount0, pool.token0.decimals)),
                  { style: "currency" }
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between mt-2 items-start">
          {loading ? (
            <>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                <img
                  src={pool.token1.logo || ""}
                  alt=""
                  className="w-4 h-4"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = questionImg;
                  }}
                />
                {pool.token1.symbol}
              </div>
              <div className="text-xs text-subText text-right">
                <div className="text-text text-base">
                  {formatTokenAmount(amount1, pool.token1.decimals, 8)}
                </div>
                {formatDisplayNumber(
                  (pool.token1.price || 0) *
                    Number(toRawString(amount1, pool.token1.decimals)),
                  { style: "currency" }
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <CircleChevronRight className="text-subText w-8 h-8 p-1 rotate-90 -mt-3 -mb-3 mx-auto" />

      <div className="rounded-lg border border-stroke px-4 py-3 text-subText text-sm">
        <div>Zap to </div>
        <div className="flex justify-between items-center">xxx</div>
      </div>
    </>
  );
}

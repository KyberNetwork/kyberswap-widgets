import { Price, Token } from "@uniswap/sdk-core";
import {
  FeeAmount,
  TICK_SPACINGS,
  TickMath,
  encodeSqrtRatioX96,
  nearestUsableTick,
  priceToClosestTick,
} from "@uniswap/v3-sdk";

export function tryParsePrice(
  baseToken?: Token,
  quoteToken?: Token,
  value?: string
) {
  if (!baseToken || !quoteToken || !value) {
    return undefined;
  }

  if (!value.match(/^\d*\.?\d+$/)) {
    return undefined;
  }

  const [whole, fraction] = value.split(".");

  const decimals = fraction?.length ?? 0;
  const withoutDecimals = BigInt((whole ?? "") + (fraction ?? ""));

  return new Price(
    baseToken,
    quoteToken,
    (BigInt(10 ** decimals) * BigInt(10 ** baseToken.decimals)).toString(),
    (withoutDecimals * BigInt(10 ** quoteToken.decimals)).toString()
  );
}

export function tryParseTick(
  baseToken?: Token,
  quoteToken?: Token,
  feeAmount?: FeeAmount,
  value?: string
): number | null {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return null;
  }

  const price = tryParsePrice(baseToken, quoteToken, value);

  if (!price) {
    return null;
  }

  let tick: number;

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator);

  if (
    BigInt(sqrtRatioX96.toString()) >=
    BigInt(TickMath.MAX_SQRT_RATIO.toString())
  ) {
    tick = TickMath.MAX_TICK;
  } else if (
    BigInt(sqrtRatioX96.toString()) <=
    BigInt(TickMath.MIN_SQRT_RATIO.toString())
  ) {
    tick = TickMath.MIN_TICK;
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price as any);
  }

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount]);
}

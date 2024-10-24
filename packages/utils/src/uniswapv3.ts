import { decodeAddress, decodeInt24, decodeUint } from "./crypto";

// Constants
const Q96: bigint = 2n ** 96n; // 2^96 as BigInt

// Function to convert tick to sqrt(price)
export function getSqrtPriceX96FromTick(tick: number): bigint {
  // 1.0001^tick, sqrt
  const base: number = 1.0001;
  const sqrtPrice: number = Math.sqrt(base ** tick);
  // Convert sqrtPrice to BigInt by scaling it to a precision level (e.g., 10^18)
  return BigInt(Math.floor(sqrtPrice * 10 ** 18)); // Return as BigInt
}

// Calculate amount0
export function getAmount0(
  L: bigint,
  sqrtPriceA: bigint,
  sqrtPriceB: bigint,
  currentSqrtPrice: bigint
): bigint {
  if (currentSqrtPrice <= sqrtPriceA) {
    // All liquidity is in amount0
    return (L * (sqrtPriceB - sqrtPriceA)) / (sqrtPriceA * sqrtPriceB);
  } else if (currentSqrtPrice < sqrtPriceB) {
    // Liquidity is spread between amount0 and amount1
    return (
      (L * (sqrtPriceB - currentSqrtPrice)) / (currentSqrtPrice * sqrtPriceB)
    );
  } else {
    // No amount0 is available if price is above upper bound
    return 0n;
  }
}

// Calculate amount1
export function getAmount1(
  L: bigint,
  sqrtPriceA: bigint,
  sqrtPriceB: bigint,
  currentSqrtPrice: bigint
): bigint {
  if (currentSqrtPrice <= sqrtPriceA) {
    // No amount1 is available if price is below lower bound
    return 0n;
  } else if (currentSqrtPrice < sqrtPriceB) {
    // Liquidity is spread between amount0 and amount1
    return L * (currentSqrtPrice - sqrtPriceA);
  } else {
    // All liquidity is in amount1
    return L * (sqrtPriceB - sqrtPriceA);
  }
}

/*
struct Position {
    uint96 nonce;
    address operator;
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
    uint256 feeGrowthInside0LastX128;
    uint256 feeGrowthInside1LastX128;
    uint128 tokensOwed0;
    uint128 tokensOwed1;
}
*/
export function decodePosition(rawData: string) {
  // Remove the "0x" prefix
  let hexData = rawData.slice(2);

  // Decode fields according to the ABI layout
  const nonce = decodeUint(hexData.slice(0, 64)); // uint96: first 12 bytes and padding (64 hex chars)
  const operator = decodeAddress(hexData.slice(64, 128)); // address: next 32 bytes (64 hex chars)
  const token0 = decodeAddress(hexData.slice(128, 192)); // address: next 32 bytes (64 hex chars)
  const token1 = decodeAddress(hexData.slice(192, 256)); // address: next 32 bytes (64 hex chars)
  const fee = parseInt(hexData.slice(256, 320), 16); // uint24: next 32 bytes (64 hex chars)
  const tickLower = decodeInt24(hexData.slice(320, 384));
  const tickUpper = decodeInt24(hexData.slice(384, 448));
  const liquidity = decodeUint(hexData.slice(448, 512));
  const feeGrowthInside0LastX128 = decodeUint(hexData.slice(512, 576));
  const feeGrowthInside1LastX128 = decodeUint(hexData.slice(576, 640));
  const tokensOwed0 = decodeUint(hexData.slice(640, 704));
  const tokensOwed1 = decodeUint(hexData.slice(704, 768));

  return {
    nonce,
    operator,
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    liquidity,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    tokensOwed0,
    tokensOwed1,
  };
}

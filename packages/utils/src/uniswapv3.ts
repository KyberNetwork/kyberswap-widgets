import { decodeAddress, decodeInt24, decodeUint } from "./crypto";

// Constants
const Q96: bigint = 2n ** 96n; // 2^96 as BigInt

// Function to convert sqrtPriceX96 to the actual price
export function getPriceFromSqrtPriceX96(sqrtPriceX96: bigint): bigint {
  // (sqrtPriceX96 / Q96) ^ 2
  const ratio: bigint = (sqrtPriceX96 * sqrtPriceX96) / Q96;
  return ratio; // This is already in BigInt format.
}

// Function to convert tick to sqrt(price)
export function getSqrtPriceFromTick(tick: number): bigint {
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
  const nonce = decodeUint(hexData.slice(0, 64)); // uint96: first 12 bytes (24 hex chars)
  const operator = decodeAddress(hexData.slice(64, 128)); // address: next 32 bytes
  const token0 = decodeAddress(hexData.slice(128, 192)); // address: next 32 bytes
  const token1 = decodeAddress(hexData.slice(192, 256)); // address: next 32 bytes
  const fee = parseInt(hexData.slice(144, 150), 16); // uint24: next 3 bytes (6 hex chars)
  const tickLower = decodeInt24(hexData.slice(150, 156)); // int24: next 3 bytes (6 hex chars)
  const tickUpper = decodeInt24(hexData.slice(156, 162)); // int24: next 3 bytes (6 hex chars)
  const liquidity = decodeUint(hexData.slice(162, 194)); // uint128: next 16 bytes (32 hex chars)
  const feeGrowthInside0LastX128 = decodeUint(hexData.slice(194, 258)); // uint256: next 32 bytes
  const feeGrowthInside1LastX128 = decodeUint(hexData.slice(258, 322)); // uint256: next 32 bytes
  const tokensOwed0 = decodeUint(hexData.slice(322, 354)); // uint128: next 16 bytes (32 hex chars)
  const tokensOwed1 = decodeUint(hexData.slice(354, 386)); // uint128: next 16 bytes (32 hex chars)

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

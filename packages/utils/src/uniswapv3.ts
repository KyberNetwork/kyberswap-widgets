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

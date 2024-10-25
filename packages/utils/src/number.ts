export function toRawString(amountInWei: bigint, decimals: number): string {
  const factor = BigInt(10 ** decimals);

  // Calculate the whole and fractional parts
  const wholePart = amountInWei / factor;
  const fractionalPart = amountInWei % factor;

  // Convert whole part to string
  const wholeStr = wholePart.toString();

  // Convert fractional part to string with leading zeros to maintain decimal precision
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  // Trim trailing zeros in the fractional part
  fractionalStr = fractionalStr.replace(/0+$/, "");

  // If there's no fractional part after trimming, return only the whole part
  return fractionalStr ? `${wholeStr}.${fractionalStr}` : wholeStr;
}

export function formatTokenAmount(
  amountInWei: bigint,
  decimals: number,
  significantFigures = 8
): string {
  const factor = BigInt(10 ** decimals);
  const wholePart = amountInWei / factor;
  const fractionalPart = amountInWei % factor;

  // Count digits in whole part
  const wholeStr = wholePart.toString();
  const wholeDigits = wholeStr.length;

  // If total significant figures is less than or equal to digits in whole part,
  // round the whole part and return without fractional part
  if (significantFigures <= wholeDigits) {
    const roundedWhole = Number(wholePart).toPrecision(significantFigures);
    return Intl.NumberFormat().format(Number(roundedWhole));
  }

  // Calculate how many decimal places we need for the fractional part
  const fractionalDigits = significantFigures - wholeDigits;

  // Format the whole part
  const formattedWholePart = Intl.NumberFormat().format(wholePart);

  // Convert fractional part to a string with leading zeros if needed
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  // Limit fractional part to the number of needed significant digits
  fractionalStr = fractionalStr.slice(0, fractionalDigits);

  // Remove trailing zeros from fractional part
  fractionalStr = fractionalStr.replace(/0+$/, "");

  // Combine whole part and fractional part
  return fractionalStr
    ? `${formattedWholePart}.${fractionalStr}`
    : formattedWholePart;
}

export const formatDollarAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return "$0.00";
  if (!num) return "-";
  if (num < 0.01 && digits <= 3) {
    return "<$0.01";
  }
  const fractionDigits = num > 1000 ? 2 : digits;
  return Intl.NumberFormat("en-US", {
    notation: num < 10_000_000 ? "standard" : "compact",
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
    .format(num)
    .toLowerCase();
};

import { TokenInfo } from "@/hooks/useMarketTokenInfo";
import { isAddress } from "@/utils";
import Numeral from "numeral";

const toK = (num: string) => {
  return Numeral(num).format("0.[00]a");
};

const formatDollarFractionAmount = (num: number, digits: number) => {
  const formatter = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatter.format(num);
};

// Take only 6 fraction digits
// This returns a different result compared to toFixed
// 0.000297796.toFixed(6) = 0.000298
// truncateFloatNumber(0.000297796) = 0.000297
const truncateFloatNumber = (num: number, maximumFractionDigits = 6) => {
  const [wholePart, fractionalPart] = String(num).split(".");

  if (!fractionalPart) {
    return wholePart;
  }

  return `${wholePart}.${fractionalPart.slice(0, maximumFractionDigits)}`;
};

const formatLongNumber = (num: string, usd?: boolean): string => {
  return usd ? `$${Numeral(num).format("0,0")}` : Numeral(num).format("0,0");
};

const formattedNum = (
  number: string | number,
  usd = false,
  fractionDigits = 5
): string => {
  if (number === 0 || number === "" || number === undefined) {
    return usd ? "$0" : "0";
  }

  const num = parseFloat(String(number));

  if (num > 500000000) {
    return (usd ? "$" : "") + toK(num.toFixed(0));
  }

  if (num >= 1000) {
    return usd
      ? formatDollarFractionAmount(num, 0)
      : Number(num.toFixed(0)).toLocaleString();
  }

  if (num === 0) {
    if (usd) {
      return "$0";
    }
    return "0";
  }

  if (num < 0.0001) {
    return usd ? "< $0.0001" : "< 0.0001";
  }

  if (usd) {
    if (num < 0.1) {
      return formatDollarFractionAmount(num, 4);
    } else {
      return formatDollarFractionAmount(num, 2);
    }
  }

  // this function can be replaced when `roundingMode` of `Intl.NumberFormat` is widely supported
  // this function is to avoid this case
  // 0.000297796.toFixed(6) = 0.000298
  // truncateFloatNumber(0.000297796) = 0.000297
  return truncateFloatNumber(num, fractionDigits);
};

export const parseMarketTokenInfo = (tokenInfo: TokenInfo | null) => {
  if (!tokenInfo) return [];

  const NOT_AVAILABLE = "--";
  const listData = [
    {
      label: "Price",
      value: tokenInfo.price
        ? formattedNum(tokenInfo.price.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "Market Cap Rank",
      value: tokenInfo.marketCapRank
        ? `#${formattedNum(tokenInfo.marketCapRank.toString())}`
        : NOT_AVAILABLE,
    },
    {
      label: "Trading Volume (24H)",
      value: tokenInfo.tradingVolume
        ? formatLongNumber(tokenInfo.tradingVolume.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "Market Cap",
      value: tokenInfo.marketCap
        ? formatLongNumber(tokenInfo.marketCap.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "All-Time High",
      value: tokenInfo.allTimeHigh
        ? formattedNum(tokenInfo.allTimeHigh.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "All-Time Low",
      value: tokenInfo.allTimeLow
        ? formattedNum(tokenInfo.allTimeLow.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "Circulating Supply",
      value: tokenInfo.circulatingSupply
        ? formatLongNumber(tokenInfo.circulatingSupply.toString())
        : NOT_AVAILABLE,
    },
    {
      label: "Total Supply",
      value: tokenInfo.totalSupply
        ? formatLongNumber(tokenInfo.totalSupply.toString())
        : NOT_AVAILABLE,
    },
  ];

  return listData;
};

export const shortenAddress = (
  chainId: number,
  address: string,
  chars = 4,
  checksum = true
): string => {
  const parsed = isAddress(address);
  if (!parsed && checksum) {
    throw Error(
      `Invalid 'address' parameter '${address}' on chain ${chainId}.`
    );
  }
  const value = (checksum && parsed ? parsed : address) ?? "";
  return `${value.substring(0, chars + 2)}...${value.substring(42 - chars)}`;
};

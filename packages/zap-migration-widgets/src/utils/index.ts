import { formatUnits } from "@kyber/utils/crypto";
import { ProtocolFeeAction } from "../stores/useZapStateStore";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumSignificantDigits: 6 }).format(value);

export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals)
    return formatNumber(+formatUnits(value, decimals).toString());

  return "--";
};

export enum PairType {
  Stable = "stable",
  Correlated = "correlated",
  Common = "common",
  Exotic = "exotic",
}

export enum PI_LEVEL {
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
  NORMAL = "NORMAL",
  INVALID = "INVALID",
}
// basis point is 100k
const feeConfig = {
  [PairType.Stable]: 10,
  [PairType.Correlated]: 25,
  [PairType.Common]: 100,
  [PairType.Exotic]: 250,
};

// basis point is 10k
export const getWarningThreshold = (zapFee: ProtocolFeeAction) => {
  if (zapFee.protocolFee.pcm <= feeConfig[PairType.Stable]) return 0.1;
  if (zapFee.protocolFee.pcm <= feeConfig[PairType.Correlated]) return 0.25;
  return 1;
};

export const getPriceImpact = (
  pi: number | null | undefined,
  type: "Swap Price Impact" | "Zap Impact",
  zapFeeInfo?: ProtocolFeeAction
) => {
  if (pi === null || pi === undefined || isNaN(pi))
    return {
      msg: `Unable to calculate ${type}`,
      level: PI_LEVEL.INVALID,
      display: "--",
    };

  const piDisplay = pi < 0.01 ? "<0.01%" : pi.toFixed(2) + "%";

  const warningThreshold = zapFeeInfo ? getWarningThreshold(zapFeeInfo) : 1;

  if (pi > 10 * warningThreshold) {
    return {
      msg: `Warning: The ${type} seems high, and you may lose funds in this swap. Click ‘Zap Anyway’ if you wish to continue to Zap in by enabling Degen Mode.`,
      level: PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg: `${type} is high`,
      level: PI_LEVEL.HIGH,
      display: piDisplay,
    };
  }

  return {
    msg: "",
    level: PI_LEVEL.NORMAL,
    display: piDisplay,
  };
};

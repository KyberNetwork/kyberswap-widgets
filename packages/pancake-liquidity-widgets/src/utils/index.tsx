import { isAddress as _isAddress, getAddress, formatUnits } from "viem";
import { ProtocolFeeAction } from "@/types/zapInTypes";
import pancakeLogo from "@/assets/pancake.png";

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: string): string | false {
  if (!_isAddress(value)) {
    return false;
  }

  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

export function copyToClipboard(textToCopy: string) {
  // navigator clipboard api needs a secure context (https)
  if (navigator.clipboard && window.isSecureContext) {
    // navigator clipboard api method'
    return navigator.clipboard.writeText(textToCopy);
  } else {
    // text area method
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    // make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((res, rej) => {
      // here the magic happens
      document.execCommand("copy") ? res(textToCopy) : rej();
      textArea.remove();
    });
  }
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);
export const formatNumber = (
  value: number,
  maximumSignificantDigits?: number
) =>
  new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: maximumSignificantDigits || 6,
  }).format(value);

// TODO: handle decimals = 0
export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals)
    return formatNumber(+formatUnits(BigInt(value), decimals).toString());

  return "--";
};

enum ErrorCode {
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,

  // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
  CHAIN_NOT_ADDED = 4902,
  MM_ALREADY_PENDING = -32002,

  ACTION_REJECTED = "ACTION_REJECTED",
  WALLETCONNECT_MODAL_CLOSED = "Error: User closed modal",
  WALLETCONNECT_CANCELED = "The transaction was cancelled",
  COINBASE_REJECTED_REQUEST = "Error: User denied account authorization",
  ALPHA_WALLET_REJECTED_CODE = -32050,
  ALPHA_WALLET_REJECTED = "Request rejected",
}

const rejectedPhrases: readonly string[] = [
  "user rejected transaction",
  "User declined to send the transaction",
  "user denied transaction",
  "you must accept",
].map((phrase) => phrase.toLowerCase());

function didUserReject(
  error: { code: number; message: string; errorMessage: string } | string
): boolean {
  const message = String(
    typeof error === "string"
      ? error
      : error?.message || error?.code || error?.errorMessage || ""
  ).toLowerCase();
  return (
    [
      ErrorCode.USER_REJECTED_REQUEST,
      ErrorCode.ACTION_REJECTED,
      ErrorCode.ALPHA_WALLET_REJECTED_CODE,
    ]
      .map(String)
      .includes((error as { code: number })?.code?.toString?.()) ||
    [
      ErrorCode.USER_REJECTED_REQUEST,
      ErrorCode.ALPHA_WALLET_REJECTED,
      ErrorCode.WALLETCONNECT_MODAL_CLOSED,
      ErrorCode.WALLETCONNECT_CANCELED,
      ErrorCode.WALLETCONNECT_MODAL_CLOSED,
    ]
      .map(String)
      .includes(message) ||
    rejectedPhrases.some((phrase) => message?.includes?.(phrase))
  );
}

function capitalizeFirstLetter(str?: string) {
  const string = str || "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function parseKnownPattern(text: string): string | undefined {
  const error = text?.toLowerCase?.() || "";

  if (!error || error.includes("router: expired"))
    return "An error occurred. Refresh the page and try again ";

  if (
    error.includes("mintotalamountout") ||
    error.includes("err_limit_out") ||
    error.includes("return amount is not enough") ||
    error.includes("code=call_exception") ||
    error.includes("none of the calls threw an error")
  )
    return `An error occurred. Try refreshing the price rate or increase max slippage`;

  if (error.includes("header not found") || error.includes("swap failed"))
    return `An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.`;

  if (didUserReject(error)) return `User rejected the transaction.`;

  // classic/elastic remove liquidity error
  if (error.includes("insufficient"))
    return `An error occurred. Please try increasing max slippage`;

  if (error.includes("permit"))
    return `An error occurred. Invalid Permit Signature`;

  if (error.includes("burn amount exceeds balance"))
    return `Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later`;

  if (error === "[object Object]")
    return `Something went wrong. Please try again`;

  return undefined;
}

const patterns: {
  pattern: RegExp;
  getMessage: (match: RegExpExecArray) => string;
}[] = [
  {
    pattern: /{"originalError":.+"message":"execution reverted: ([^"]+)"/,
    getMessage: (match) => match[1],
  },
  { pattern: /^([\w ]*\w+) \(.+?\)$/, getMessage: (match) => match[1] },
  { pattern: /"message": ?"[^"]+?"/, getMessage: (match) => match[1] },
];
function parseKnownRegexPattern(text: string): string | undefined {
  const pattern = patterns.find((pattern) => pattern.pattern.exec(text));
  if (pattern)
    return capitalizeFirstLetter(
      pattern.getMessage(pattern.pattern.exec(text)!)
    );
  return undefined;
}

export function friendlyError(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message; // || (error as any)?.data.message

  const knownPattern = parseKnownPattern(message);
  if (knownPattern) return knownPattern;

  if (message.length < 100) return message;
  const knownRegexPattern = parseKnownRegexPattern(message);
  if (knownRegexPattern) return knownRegexPattern;

  return `An error occurred`;
}

export const getDexName = () => {
  return "PancakeSwap V3";
};

export const getDexLogo = () => {
  return pancakeLogo;
};

export enum PI_LEVEL {
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
  NORMAL = "NORMAL",
  INVALID = "INVALID",
}

export enum ImpactType {
  ZAP = "Zap",
  SWAP = "Swap price",
}

export const getPriceImpact = (
  pi: number | null | undefined,
  type: ImpactType,
  zapFeeInfo?: ProtocolFeeAction
) => {
  if (pi === null || pi === undefined || isNaN(pi))
    return {
      msg: `Unable to calculate ${type} impact`,
      level: PI_LEVEL.INVALID,
      display: "--",
    };

  const piDisplay = pi < 0.01 ? "<0.01%" : pi.toFixed(2) + "%";

  const warningThreshold = zapFeeInfo ? getWarningThreshold(zapFeeInfo) : 1;

  if (pi > 10 * warningThreshold) {
    return {
      msg: (
        <div>
          {type} impact is <span className="text-error">very high</span>. You
          will lose funds!
        </div>
      ),
      level: PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg: (
        <>
          {type} impact is <span className="text-warning">high</span>
        </>
      ),
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

export enum PairType {
  Stable = "stable",
  Correlated = "correlated",
  Common = "common",
  Exotic = "exotic",
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

export function calculateGasMargin(value: bigint): bigint {
  const defaultGasLimitMargin = BigInt(20_000);
  const gasMargin = (value * BigInt(2000)) / BigInt(10000);

  return gasMargin >= defaultGasLimitMargin
    ? value + gasMargin
    : value + defaultGasLimitMargin;
}

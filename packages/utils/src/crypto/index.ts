import { keccak256 } from "js-sha3";

export * from "./address";

// Function to encode a uint256 parameter to hex (minimal ABI encoding)
export function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, "0"); // Encode bigint as hex, pad to 32 bytes
}

export function getFunctionSelector(signature: string): string {
  // Convert the function signature to bytes and hash it using keccak256
  const hash = keccak256(signature);

  // Take the first 4 bytes (8 hex characters) as the function selector
  return hash.slice(0, 8);
}

// Function to decode an Ethereum address from hex (last 20 bytes of a 32-byte field)
export function decodeAddress(hex: string): string {
  return `0x${hex.slice(-40)}`; // Last 20 bytes = 40 hex chars
}

// Decode a uint256 (or smaller) field from the hex string
export function decodeUint(hex: string): bigint {
  return BigInt(`0x${hex}`);
}

// Function to decode an int24 from hex (handles negative values)
export function decodeInt24(hex: string): number {
  const last3Bytes = hex.slice(-6);
  const int = parseInt(last3Bytes, 16);
  // If the int is greater than the max signed value for 24 bits (2^23), it’s negative
  return int >= 0x800000 ? int - 0x1000000 : int;
}

export async function getCurrentGasPrice(rpcUrl: string) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_gasPrice",
      params: [],
      id: 1,
    }),
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(result.error.message);
  }
  return parseInt(result.result, 16); // Convert from hex to decimal
}

export async function estimateGas(
  rpcUrl: string,
  {
    from,
    to,
    value = "0x0",
    data = "0x",
  }: { from: string; to: string; value: string; data: string }
): Promise<bigint> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_estimateGas",
      params: [
        {
          from: from,
          to: to,
          value: value, // Optional if no ETH transfer
          data: data, // Optional if no function call
        },
      ],
      id: 1,
    }),
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(result.error.message);
  }
  return BigInt(result.result); // Gas estimate as a hex string
}

export async function isTransactionSuccessful(
  rpcUrl: string,
  txHash: string
): Promise<boolean> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [txHash],
      id: 1,
    }),
  });

  const result = await response.json();

  // Check if the transaction receipt was found
  if (!result.result) {
    console.log("Transaction not mined yet or invalid transaction hash.");
    return false;
  }

  // `status` is "0x1" for success, "0x0" for failure
  return result.result.status === "0x1";
}

export async function checkApproval({
  rpcUrl,
  token,
  owner,
  spender,
}: {
  rpcUrl: string;
  token: string;
  owner: string;
  spender: string;
}): Promise<bigint> {
  const allowanceFunctionSig = getFunctionSelector(
    "allowance(address,address)"
  );
  const paddedOwner = owner.replace("0x", "").padStart(64, "0");
  const paddedSpender = spender.replace("0x", "").padStart(64, "0");
  const data = `0x${allowanceFunctionSig}${paddedOwner}${paddedSpender}`;

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: token,
            data,
          },
          "latest",
        ],
        id: 1,
      }),
    });
    const result = await response.json();
    const allowance = BigInt(result.result);
    return allowance;
  } catch (e) {
    throw e;
  }
}

export function calculateGasMargin(value: bigint): string {
  const defaultGasLimitMargin = 20_000n;
  const gasMargin = (value * 2000n) / 10_000n;

  return (
    "0x" +
    (gasMargin < defaultGasLimitMargin
      ? value + gasMargin
      : value + defaultGasLimitMargin
    ).toString(16)
  );
}
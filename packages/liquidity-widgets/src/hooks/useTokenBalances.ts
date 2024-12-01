import { useState, useEffect, useCallback } from "react";
import { useWidgetContext } from "@/stores/widget";
import { NetworkInfo } from "@/constants";

// Helper to manually encode ABI data
function encodeMulticallInput(
  requireSuccess: boolean,
  calls: { target: string; callData: string }[]
): string {
  const requireSuccessEncoded = requireSuccess ? "01" : "00";
  const callsEncoded = calls
    .map(({ target, callData }) => {
      const targetEncoded = target
        .toLowerCase()
        .replace("0x", "")
        .padStart(64, "0");
      const callDataLength = (callData.length / 2 - 1)
        .toString(16)
        .padStart(64, "0");
      return `${targetEncoded}${callDataLength}${callData.replace("0x", "")}`;
    })
    .join("");
  const callsLength = calls.length.toString(16).padStart(64, "0");

  return `0x${requireSuccessEncoded}${callsLength}${callsEncoded}`;
}

// Decode the results from the Multicall response
function decodeMulticallOutput(result: string | undefined): bigint[] {
  if (!result) return [];

  const offset = parseInt(result.slice(2, 66), 16); // Offset of the results
  const data = result.slice(2 + offset * 2); // Extract the results array
  const count = parseInt(data.slice(0, 64), 16); // Number of results

  const balances: bigint[] = [];
  let currentOffset = 64; // Start of the results
  for (let i = 0; i < count; i++) {
    const returnLength =
      parseInt(data.slice(currentOffset, currentOffset + 64), 16) * 2;
    currentOffset += 64;
    const returnData = data.slice(currentOffset, currentOffset + returnLength);
    currentOffset += returnLength;

    // Decode the balance
    try {
      balances.push(BigInt("0x" + returnData.slice(0, 64)));
    } catch {
      balances.push(BigInt(0));
    }
  }

  return balances;
}

const ERC20_BALANCE_OF_SELECTOR = "70a08231"; // Function selector for "balanceOf(address)";

const useTokenBalances = (tokenAddresses: string[]) => {
  const { chainId, connectedAccount } = useWidgetContext((s) => s);
  const { address: account } = connectedAccount;
  const { defaultRpc: rpcUrl, multiCall } = NetworkInfo[chainId];

  const [balances, setBalances] = useState<{ [address: string]: bigint }>({});
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!rpcUrl || !account) {
      setBalances({});
      return;
    }

    setLoading(true);

    try {
      // Prepare calls for the Multicall contract
      const calls = tokenAddresses.map((token) => {
        const paddedAccount = account.replace("0x", "").padStart(64, "0");
        const callData = `0x${ERC20_BALANCE_OF_SELECTOR}${paddedAccount}`;
        return {
          target: token,
          callData,
        };
      });

      const encodedData = encodeMulticallInput(false, calls);

      // Encode multicall transaction
      const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: multiCall,
            data: encodedData,
          },
          "latest",
        ],
      };

      // Send request to the RPC endpoint
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Decode balances from the multicall output
      const decodedBalances = decodeMulticallOutput(result.result);

      // Map balances to token addresses
      const balancesMap = tokenAddresses.reduce(
        (acc, token, index) => ({
          ...acc,
          [token]: decodedBalances[index],
        }),
        {}
      );

      setBalances(balancesMap);
    } catch (error) {
      setBalances({});
      console.error("Failed to fetch balances:", error);
    } finally {
      setLoading(false);
    }
  }, [rpcUrl, account, JSON.stringify(tokenAddresses)]);

  useEffect(() => {
    fetchBalances();

    const interval = setInterval(() => {
      fetchBalances();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    loading,
    balances,
    refetch: fetchBalances,
  };
};

export default useTokenBalances;

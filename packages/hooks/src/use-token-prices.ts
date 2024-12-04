import { useCallback, useEffect, useState } from "react";

const TOKEN_API_URL = "https://token-api.kyberengineering.io/api";

interface PriceResponse {
  data: {
    [chainId: string]: {
      [address: string]: { PriceBuy: number; PriceSell: number };
    };
  };
}

export function useTokenPrices({
  addresses,
  chainId,
}: {
  addresses: string[];
  chainId: number;
}) {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<{ [key: string]: number }>(() => {
    return addresses.reduce((acc, address) => {
      return {
        ...acc,
        [address]: { price: 0 },
      };
    }, {});
  });

  const fetchPrices = useCallback(
    async (_addresses: string[]) => {
      const r: PriceResponse = await fetch(
        `${TOKEN_API_URL}/v1/public/tokens/prices`,
        {
          method: "POST",
          body: JSON.stringify({
            [chainId]: _addresses,
          }),
        }
      ).then((res) => res.json());

      return r?.data?.[chainId] || {};
    },
    [chainId]
  );

  useEffect(() => {
    if (addresses.length === 0) {
      setPrices({});
      return;
    }

    fetchPrices(addresses)
      .then((fetchedPrices) => {
        setPrices(
          addresses.reduce((acc, address) => {
            return {
              ...acc,
              [address]: fetchedPrices[address]?.PriceBuy || 0,
            };
          }, {})
        );
      })
      .catch((_error) => {
        // console.log("Failed to fetch token prices:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchPrices, addresses.join(",")]);

  return {
    loading,
    prices,
    fetchPrices,
  };
}

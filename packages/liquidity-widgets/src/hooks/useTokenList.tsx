import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Token } from "../entities/Pool";
import { useWeb3Provider } from "./useProvider";

interface TokenListState {
  tokens: Token[];
  loading: boolean;
}

const TokenListContext = createContext<TokenListState>({
  tokens: [],
  loading: false,
});

export const TokenListProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const { chainId } = useWeb3Provider();

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://ks-setting.kyberswap.com/api/v1/tokens?page=1&pageSize=100&isWhitelisted=true&chainIds=${chainId}`
    )
      .then((res) => res.json())
      .then((res) => {
        setTokens(res.data.tokens);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [chainId]);

  return (
    <TokenListContext.Provider
      value={{
        tokens,
        loading,
      }}
    >
      {children}
    </TokenListContext.Provider>
  );
};

export const useTokenList = () => {
  const context = useContext(TokenListContext);
  if (context === undefined) {
    throw new Error("useWidgetInfo must be used within a WidgetProvider");
  }
  return context;
};

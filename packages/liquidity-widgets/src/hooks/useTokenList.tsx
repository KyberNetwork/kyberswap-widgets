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

  importedTokens: Token[];
  addToken: (token: Token) => void;
  removeToken: (token: Token) => void;
}

const TokenListContext = createContext<TokenListState>({
  tokens: [],
  loading: false,
  importedTokens: [],
  addToken: () => {
    //
  },
  removeToken: () => {
    //
  },
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

  const [importedTokens, setImportedTokens] = useState<Token[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const localStorageTokens = JSON.parse(
          localStorage.getItem("importedTokens") || "[]"
        );

        return localStorageTokens;
      } catch (e) {
        return [];
      }
    }

    return [];
  });

  const addToken = (token: Token) => {
    const newTokens = [
      ...importedTokens.filter((t) => t.address !== token.address),
      token,
    ];
    setImportedTokens(newTokens);
    if (typeof window !== "undefined")
      localStorage.setItem("importedTokens", JSON.stringify(newTokens));
  };

  const removeToken = (token: Token) => {
    const newTokens = importedTokens.filter(
      (t) =>
        t.address.toLowerCase() !== token.address.toLowerCase() &&
        t.chainId === token.chainId
    );

    setImportedTokens(newTokens);
    if (typeof window !== "undefined")
      localStorage.setItem("importedTokens", JSON.stringify(newTokens));
  };

  return (
    <TokenListContext.Provider
      value={{
        tokens,
        loading,
        importedTokens,
        addToken,
        removeToken,
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

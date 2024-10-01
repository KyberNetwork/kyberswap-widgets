import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Token } from "@/entities/Pool";
import { useWeb3Provider } from "./useProvider";
import { PATHS } from "@/constants";

type TokenListContextState = {
  tokens: Token[];
  loading: boolean;
  importedTokens: Token[];
  addToken: (token: Token) => void;
  removeToken: (token: Token) => void;
};

const TokenListContext = createContext<TokenListContextState>({
  tokens: [],
  loading: false,
  importedTokens: [],
  addToken: () => {},
  removeToken: () => {},
});

export const TokenListProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const { chainId } = useWeb3Provider();

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

  const fetchTokenList = useCallback(() => {
    setLoading(true);
    fetch(
      `${PATHS.KYBERSWAP_SETTING_API}?page=1&pageSize=100&isWhitelisted=true&chainIds=${chainId}`
    )
      .then((res) => res.json())
      .then((res) => setTokens(res.data.tokens))
      .finally(() => {
        setLoading(false);
      });
  }, [chainId]);

  useEffect(() => {
    fetchTokenList();
  }, [fetchTokenList]);

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
    throw new Error("useTokenList must be used within a TokenListProvider");
  }
  return context;
};

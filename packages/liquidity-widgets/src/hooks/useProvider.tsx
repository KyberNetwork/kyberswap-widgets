import { providers } from "ethers";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NetworkInfo } from "../constants";

const Web3Context = createContext<
  | {
      provider: providers.Web3Provider | providers.JsonRpcProvider;
      readProvider: providers.JsonRpcProvider;
      chainId: number;
      account: string | undefined;
    }
  | undefined
>(undefined);

export const Web3Provider = ({
  provider,
  chainId,
  children,
}: {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
  children: ReactNode;
}) => {
  const readProvider = useMemo(
    () => new providers.JsonRpcProvider(NetworkInfo[chainId].defaultRpc),
    [chainId]
  );

  const [account, setAccount] = useState<string | undefined>();

  useEffect(() => {
    provider.listAccounts().then((res) => setAccount(res[0]));
  }, [provider]);

  return (
    <Web3Context.Provider value={{ provider, chainId, account, readProvider }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3Provider = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3Provider must be used within a Web3Provider");
  }
  return context;
};

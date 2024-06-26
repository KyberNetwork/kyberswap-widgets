import {
  ConnectButton,
  RainbowKitProvider,
  getDefaultConfig,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import { arbitrum, mainnet, polygon, bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useChainId,
  WagmiProvider,
  createStorage,
} from "wagmi";

import { LiquidityWidget } from "./components";

import "@rainbow-me/rainbowkit/styles.css";

const { wallets } = getDefaultWallets();
const wagmiConfig = getDefaultConfig({
  appName: "Liquidity Widgets",
  projectId: "d5fd1fd479f2a155c151efdf91c12c9e",
  wallets,
  chains: [mainnet, arbitrum, polygon, bsc],
  storage: createStorage({
    storage: localStorage,
  }),
});
const queryClient = new QueryClient();

function Provider({ children }: React.PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default function App() {
  return (
    <Provider>
      <ConnectButton />
      <CurrentWallet />
      <LiquidityWidgetWrapper />
    </Provider>
  );
}

function CurrentWallet() {
  const account = useAccount();

  if (!account.address) {
    return <span>not connected</span>;
  }

  return <span>{account.address}</span>;
}

function LiquidityWidgetWrapper() {
  const publicClient = usePublicClient();
  const walletClientQuery = useWalletClient();
  const { address: account } = useAccount();
  const chainId = useChainId();
  const walletClient = walletClientQuery.data;

  return (
    <LiquidityWidget
      theme={{
        text: "#FFFFFF",
        subText: "#B6AECF",
        icons: "#a9a9a9",
        layer1: "#27262C",
        dialog: "#27262C",
        layer2: "#363046",
        stroke: "#363046",
        chartRange: "#5DC5D2",
        chartArea: "#457F89",
        accent: "#5DC5D2",
        warning: "#F4B452",
        error: "#FF5353",
        success: "#189470",
        fontFamily: "Kanit, Sans-serif",
        borderRadius: "20px",
        buttonRadius: "16px",
        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
      }}
      publicClient={publicClient}
      walletClient={walletClient}
      account={account}
      networkChainId={chainId}
      chainId={56}
      positionId="1288027"
      poolAddress="0x92b7807bf19b7dddf89b706143896d05228f3121"
      feeAddress="0x7E59Be2D29C5482256f555D9BD4b37851F1f3411"
      feePcm={50}
      onDismiss={() => {
        window.location.reload();
      }}
      source="zap-widget-demo"
    />
  );
}

// chainId={137}
// poolAddress="0xB6e57ed85c4c9dbfEF2a68711e9d6f36c56e0FcB"

// chainId={42161}
// positionId="24654"
// poolAddress="0x0bacc7a9717e70ea0da5ac075889bd87d4c81197"

// chainId={56}
// positionId="1288027"
// poolAddress="0x92b7807bf19b7dddf89b706143896d05228f3121"
// owner: 0x2078a88E7035f7f8B3D7A321E40A156AEca0276C

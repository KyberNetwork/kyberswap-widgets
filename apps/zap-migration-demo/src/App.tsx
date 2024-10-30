import "./App.css";
import { Dex, ZapMigration, ChainId } from "@kyber/zap-migration-widgets";
import "@kyber/zap-migration-widgets/dist/style.css";
import "@rainbow-me/rainbowkit/styles.css";
import {
  ConnectButton,
  RainbowKitProvider,
  getDefaultConfig,
  getDefaultWallets,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { arbitrum, mainnet, polygon, bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAccount,
  useWalletClient,
  useChainId,
  WagmiProvider,
  createStorage,
} from "wagmi";

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

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectButton />
          <div className="ks-demo-app">
            <div className="ks-demo-app-wrapper">
              <ZapMigration
                onClose={() => {
                  window.location.reload();
                }}
                chainId={ChainId.Bsc}
                from={{
                  dex: Dex.Pancakev3,
                  poolId: "0x36696169C63e42cd08ce11f5deeBbCeBae652050",
                  positionId: 1314637,
                }}
                to={{
                  dex: Dex.Pancakev3,
                  poolId: "0xBe141893E4c6AD9272e8C04BAB7E6a10604501a5",
                  //dex: Dex.Uniswapv3,
                  //poolId: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
                }}
                client="zap-migration-demo"
                connectedAccount={{
                  address: undefined,
                  chainId: ChainId.Ethereum,
                }}
              />
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

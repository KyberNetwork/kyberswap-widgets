import { useState, useEffect } from "react";
import "./App.css";
import { Widget } from "@kyberswap/widgets";
import { init, useWallets, useConnectWallet } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers } from "ethers";
import walletConnectModule from "@web3-onboard/walletconnect";

const injected = injectedModule();
const walletConnect = walletConnectModule();

// initialize Onboard
init({
  wallets: [injected, walletConnect],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: "https://ethereum.kyberengineering.io",
    },
    {
      id: "0x89",
      token: "MATIC",
      label: "Polygon",
      rpcUrl: "https://polygon.kyberengineering.io",
    },
  ],
});

function App() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();

  // create an ethers provider
  let ethersProvider: any;

  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, "any");
  }

  const connectedWallets = useWallets();

  const [chainId, setChainId] = useState(1);

  useEffect(() => {
    ethersProvider?.getNetwork().then((res: any) => setChainId(res.chainId));
  }, [ethersProvider]);

  useEffect(() => {
    if (!connectedWallets.length) return;

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    );
    window.localStorage.setItem(
      "connectedWallets",
      JSON.stringify(connectedWalletsLabelArray)
    );
  }, [connectedWallets, wallet]);

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem("connectedWallets") || "[]"
    );

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        const walletConnected = await connect({
          autoSelect: previouslyConnectedWallets[0],
        });
      }
      setWalletFromLocalStorage();
    }
  }, [connect]);

  const lightTheme = {
    text: "#222222",
    subText: "#5E5E5E",
    primary: "#FFFFFF",
    dialog: "#FBFBFB",
    secondary: "#F5F5F5",
    interactive: "#E2E2E2",
    stroke: "#505050",
    accent: "#28E0B9",
    success: "#189470",
    warning: "#FF9901",
    error: "#FF537B",
    fontFamily: "Work Sans",
    borderRadius: "16px",
    buttonRadius: "999px",
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
  };

  const darkTheme = {
    text: "#FFFFFF",
    subText: "#A9A9A9",
    primary: "#1C1C1C",
    dialog: "#313131",
    secondary: "#0F0F0F",
    interactive: "#292929",
    stroke: "#505050",
    accent: "#28E0B9",
    success: "#189470",
    warning: "#FF9901",
    error: "#FF537B",
    fontFamily: "Work Sans",
    borderRadius: "16px",
    buttonRadius: "999px",
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
  };

  const [theme, setTheme] = useState<any>(darkTheme);

  const defaultTokenOut: { [chainId: number]: string } = {
    1: "0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202",
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    56: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    250: "0x049d68029688eAbF473097a2fC38ef61633A3C7A",
    25: "0x66e428c3f67a68878562e79A0234c1F83c208770",
    42161: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    199: "0x9B5F27f6ea9bBD753ce3793a07CbA3C74644330d",
    106: "0x01445C31581c354b7338AC35693AB2001B50b9aE",
    1313161554: "0x4988a896b1227218e4a686fde5eabdcabd91571f",
    42262: "0x6Cb9750a92643382e020eA9a170AbB83Df05F30B",
    10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  };

  const [feeSetting, setFeeSetting] = useState({
    feeAmount: 0,
    feeReceiver: "",
    chargeFeeBy: "currency_in" as "currency_in" | "currency_out",
    isInBps: true,
  });

  return (
    <div className="App">
      
      <div className="WidgetBox">
        <div className="WidgetContainer">
          <div className="buttonContainer">
        <button
              onClick={() => (wallet ? disconnect(wallet) : connect())}
              className="button"
            >
              {!wallet ? "Connect Wallet" : "Disconnect"}
            </button>
            </div>
        <Widget
          theme={theme}
          tokenList={[]}
          provider={ethersProvider}
          defaultTokenOut={defaultTokenOut[chainId]}
          feeSetting={
            feeSetting.feeAmount && feeSetting.feeReceiver
              ? feeSetting
              : undefined
          }
        />
        </div>
        </div>
    </div>
  );
}

export default App;

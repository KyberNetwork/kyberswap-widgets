import "./index.css";
import "./index.scss";
import { Preview } from "./components/Preview";
import "@kyber/ui/styles.css";

import { cn } from "@kyber/utils/tailwind-helpers";
import { ChainId, Dex, DexFrom, DexTo } from "./schema";
import { usePoolsStore } from "./stores/usePoolsStore";
import { usePositionStore } from "./stores/usePositionStore";
import { useEffect } from "react";
import { Header } from "./components/Header";
import { FromPool } from "./components/FromPool";
import { ToPool } from "./components/ToPool";
import CircleChevronRight from "./assets/icons/circle-chevron-right.svg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kyber/ui/dialog";
import { SourcePoolState } from "./components/SourcePoolState";
import { TargetPoolState } from "./components/TargetPoolState";
import { EstimateLiqValue } from "./components/EstimateLiqValue";
import { useZapStateStore } from "./stores/useZapStateStore";
import { Theme } from "./theme";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

export { Dex, ChainId };

export interface ZapMigrationProps {
  theme?: Theme;
  source: string;
  chainId: ChainId;
  className?: string;
  from: DexFrom;
  to: DexTo;
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  onClose: () => void;
  client: string;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
  }) => Promise<string>;
}

// createModalRoot.js
const createModalRoot = () => {
  let modalRoot = document.getElementById("ks-lw-modal-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "ks-lw-modal-root";
    modalRoot.className = "ks-lw-migration-style";
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

export const ZapMigration = ({
  client,
  className,
  chainId,
  from,
  to,
  onClose,
  connectedAccount,
  onConnectWallet,
  onSwitchChain,
  onSubmitTx,
  theme,
}: //aggregatorOptions,
//feeConfig,
ZapMigrationProps) => {
  const { getPools, error: poolError, setTheme } = usePoolsStore();
  const {
    fetchPosition,
    error: posError,
    setToPositionNull,
  } = usePositionStore();

  const { showPreview } = useZapStateStore();
  const { fetchPrices } = useTokenPrices({ addresses: [], chainId });

  useEffect(() => {
    if (!theme) return;
    setTheme(theme);
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  // fetch position on load
  useEffect(() => {
    fetchPosition(from.dex, chainId, +from.positionId, true);
    if (to.positionId) fetchPosition(to.dex, chainId, +to.positionId, false);
    else setToPositionNull();

    const interval = setInterval(() => {
      fetchPosition(from.dex, chainId, +from.positionId, true);
    }, 15_000);

    return () => clearInterval(interval);
  }, [chainId, fetchPosition, from, from.dex]);

  // fetch pool on load
  useEffect(() => {
    const params = {
      chainId,
      poolFrom: from.poolId,
      poolTo: to.poolId,
      dexFrom: from.dex,
      dexTo: to.dex,
      fetchPrices,
    };
    getPools(params);

    // refresh pools every 10s
    const interval = setInterval(() => {
      getPools(params);
    }, 15_000);

    return () => clearInterval(interval);
  }, [chainId, from.poolId, to.poolId, from.dex, to.dex, getPools]);

  return (
    <div
      className="ks-lw-migration-style"
      style={{ width: "100%", height: "100%" }}
    >
      <Dialog onOpenChange={onClose} open={Boolean(poolError || posError)}>
        <DialogContent containerClassName="ks-lw-migration-style">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription className="text-red-500 mt-4">
              {poolError || posError}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "bg-background w-full h-full max-w-[800px] border rounded-md p-6 border-stroke",
          "text-text",
          className
        )}
      >
        <Header onClose={onClose} chainId={chainId} />
        <div className="flex gap-3 items-center mt-5">
          <FromPool />
          <CircleChevronRight className="text-primary w-8 h-8 p-1" />
          <ToPool />
        </div>

        <div className="flex gap-[48px] mt-4">
          <SourcePoolState />
          <TargetPoolState />
        </div>
        <EstimateLiqValue
          client={client}
          chainId={chainId}
          connectedAccount={connectedAccount}
          onConnectWallet={onConnectWallet}
          onSwitchChain={onSwitchChain}
          onClose={onClose}
          onSubmitTx={onSubmitTx}
        />

        {showPreview && (
          <Preview
            chainId={chainId}
            onSubmitTx={onSubmitTx}
            account={connectedAccount.address}
            client={client}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

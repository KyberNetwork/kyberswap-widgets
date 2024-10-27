import "./index.css";
import "@kyber/ui/styles.css";

import { cn } from "@kyber/utils/tailwind-helpers";
import { ChainId, Dex, DexFrom, DexTo } from "./schema";
import { usePoolsStore } from "./stores/usePoolsStore";
import { usePositionStore } from "./stores/useFromPositionStore";
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

export { Dex, ChainId };

export interface ZapMigrationProps {
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
}

export const ZapMigration = ({
  className,
  chainId,
  from,
  to,
  onClose,
}: //aggregatorOptions,
//feeConfig,
ZapMigrationProps) => {
  const { getPools, error: poolError } = usePoolsStore();
  const { fetchPosition, error: posError } = usePositionStore();

  // fetch position on load
  useEffect(() => {
    fetchPosition(from.dex, chainId, +from.positionId);

    const interval = setInterval(() => {
      fetchPosition(from.dex, chainId, +from.positionId);
    }, 10_000);

    return () => clearInterval(interval);
  }, [chainId, from, from.dex]);

  // fetch pool on load
  useEffect(() => {
    const params = {
      chainId,
      poolFrom: from.poolId,
      poolTo: to.poolId,
      dexFrom: from.dex,
      dexTo: to.dex,
    };
    getPools(params);

    // refresh pools every 10s
    const interval = setInterval(() => {
      getPools(params);
    }, 10_000);

    return () => clearInterval(interval);
  }, [chainId, from.poolId, to.poolId, from.dex, to.dex]);

  return (
    <>
      <Dialog onOpenChange={onClose} open={Boolean(poolError || posError)}>
        <DialogContent>
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
          "bg-background w-full max-w-[800px] border rounded-md p-6 border-stroke",
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
      </div>
    </>
  );
};

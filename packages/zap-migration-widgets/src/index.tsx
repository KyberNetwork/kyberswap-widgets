import "./index.css";

import { cn } from "@kyber/utils/tailwind-helpers";
import { ChainId, Dex, DexFrom, DexTo } from "./schema";
import { usePoolsStore } from "./stores/usePoolsStore";
import { useEffect } from "react";
import { Header } from "./components/Header";

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
  const { pools, getPools } = usePoolsStore();

  useEffect(() => {
    getPools({ chainId, poolFrom: from.poolId, poolTo: to.poolId });
  }, []);
  console.log(pools);

  return (
    <div
      className={cn(
        "bg-background w-full max-w-[760px] border rounded-md p-6 border-stroke",
        "text-text",
        className
      )}
    >
      <Header onClose={onClose} />
    </div>
  );
};

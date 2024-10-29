import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kyber/ui/dialog";
import { useZapStateStore } from "../stores/useZapStateStore";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { usePoolsStore } from "../stores/usePoolsStore";
import CopyIcon from "../assets/icons/copy.svg";
import { Image } from "./Image";
import { DexInfos, NetworkInfo } from "../constants";
import { ChainId } from "../schema";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";

export function Preview({ chainId }: { chainId: ChainId }) {
  const { showPreview, togglePreview, tickLower, tickUpper, route } =
    useZapStateStore();
  const { pools } = usePoolsStore();

  if (route === null || pools === "loading") return null;
  let amount0 = 0n;
  let amount1 = 0n;
  if (route !== null && tickLower !== null && tickUpper !== null) {
    ({ amount0, amount1 } = getPositionAmounts(
      route.poolDetails.uniswapV3.newTick,
      tickLower,
      tickUpper,
      BigInt(route.poolDetails.uniswapV3.newSqrtP),
      BigInt(route.positionDetails.addedLiquidity)
    ));
  }

  return (
    <Dialog open={showPreview} onOpenChange={() => togglePreview()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Migrate Liquidity via Zap</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          <div>
            Migrate{" "}
            {formatDisplayNumber(route.zapDetails.initialAmountUsd, {
              style: "currency",
            })}{" "}
            value
          </div>
          <div className="border border-stroke rounded-md p-4 mt-4 flex gap-2 items-start">
            <div className="flex items-end">
              <Image
                src={pools[0].token0.logo || ""}
                alt={pools[0].token0.symbol}
                className="w-9 h-9 z-0"
              />
              <Image
                src={pools[0].token1.logo || ""}
                alt={pools[0].token1.symbol}
                className="w-9 h-9 -ml-3 z-10"
              />
              <Image
                src={NetworkInfo[chainId].logo}
                alt={NetworkInfo[chainId].name}
                className="w-4 h-4 -ml-1.5 z-20"
              />
            </div>
            <div>
              <div className="flex gap-1 items-center">
                {pools[0].token0.symbol}/{pools[0].token1.symbol}{" "}
                <CopyIcon className="text-subText w-4 h-4" />
              </div>
              <div className="flex gap-1 items-center text-subText mt-1">
                <Image
                  src={DexInfos[pools[0].dex].icon}
                  alt={DexInfos[pools[0].dex].name}
                  className="w-3 h-3"
                />
                <div className="text-sm opacity-70">
                  {DexInfos[pools[0].dex].name}
                </div>
                <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">
                  Fee {pools[0].fee}%
                </div>
              </div>
            </div>
          </div>

          <div className="border border-stroke rounded-md p-4 mt-4 flex gap-2 items-start">
            <div className="flex items-end">
              <Image
                src={pools[1].token0.logo || ""}
                alt={pools[1].token0.symbol}
                className="w-9 h-9 z-0"
              />
              <Image
                src={pools[1].token1.logo || ""}
                alt={pools[1].token1.symbol}
                className="w-9 h-9 -ml-3 z-10"
              />
              <Image
                src={NetworkInfo[chainId].logo}
                alt={NetworkInfo[chainId].name}
                className="w-4 h-4 -ml-1.5 z-20"
              />
            </div>
            <div>
              <div className="flex gap-1 items-center">
                {pools[1].token0.symbol}/{pools[1].token1.symbol}{" "}
                <CopyIcon className="text-subText w-4 h-4" />
              </div>
              <div className="flex gap-1 items-center text-subText mt-1">
                <Image
                  src={DexInfos[pools[1].dex].icon}
                  alt={DexInfos[pools[1].dex].name}
                  className="w-3 h-3"
                />
                <div className="text-sm opacity-70">
                  {DexInfos[pools[1].dex].name}
                </div>
                <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">
                  Fee {pools[1].fee}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md px-5 py-4 bg-interactive">
            <span className="text-subText text-sm">New Pool Liquidity</span>
            <div className="flex justify-between items-start text-base">
              <div className="flex items-center gap-1">
                <Image
                  className="w-4 h-4"
                  src={pools[1].token0.logo || ""}
                  alt=""
                />
                {formatTokenAmount(amount0, pools[1].token0.decimals, 10)}{" "}
                {pools[1].token0.symbol}
              </div>
              <div className="text-subText">
                ~
                {formatDisplayNumber(
                  (pools[1].token0.price || 0) *
                    Number(toRawString(amount0, pools[1].token0.decimals)),
                  { style: "currency" }
                )}
              </div>
            </div>

            <div className="flex justify-between items-start text-base">
              <div className="flex items-center gap-1">
                <Image
                  className="w-4 h-4"
                  src={pools[1].token1.logo || ""}
                  alt=""
                />
                {formatTokenAmount(amount1, pools[1].token1.decimals, 10)}{" "}
                {pools[1].token0.symbol}
              </div>
              <div className="text-subText">
                ~
                {formatDisplayNumber(
                  (pools[1].token0.price || 0) *
                    Number(toRawString(amount1, pools[1].token1.decimals)),
                  { style: "currency" }
                )}
              </div>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

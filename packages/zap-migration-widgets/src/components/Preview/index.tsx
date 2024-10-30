import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kyber/ui/dialog";
import { useZapStateStore } from "../../stores/useZapStateStore";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { usePoolsStore } from "../../stores/usePoolsStore";
import CopyIcon from "../../assets/icons/copy.svg";
import { Image } from "../Image";
import { ZAP_URL, DexInfos, NetworkInfo } from "../../constants";
import { ChainId } from "../../schema";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useEffect, useState } from "react";
import { estimateGas, getCurrentGasPrice } from "@kyber/utils/crypto";
import { MigrationSummary } from "./MigrationSummary";

export function Preview({ chainId }: { chainId: ChainId }) {
  const { showPreview, togglePreview, tickLower, tickUpper, route, slippage } =
    useZapStateStore();
  const { pools } = usePoolsStore();

  const [buildData, setBuildData] = useState<{
    callData: string;
    routerAddress: string;
    value: string;
  } | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!route?.route || !showPreview) return;
    fetch(
      `${ZAP_URL}/${NetworkInfo[chainId].zapPath}/api/v1/migrate/route/build`,
      {
        method: "POST",
        body: JSON.stringify({
          // TODO:
          sender: "0xDcFCD5dD752492b95ac8C1964C83F992e7e39FA9",
          route: route.route,
          burnNft: false,
          // TODO: x-client-id
          source: "VietNV",
        }),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setBuildData(res.data);
        else setError(res.message || "build failed");
      })
      .catch((err) => {
        setError(err.message || JSON.stringify(err));
      });
  }, [route?.route, showPreview]);

  const rpcUrl = NetworkInfo[chainId].defaultRpc;

  const [gasUsd, setGasUsd] = useState<number | null>(null);
  useEffect(() => {
    if (!buildData) return;
    (async () => {
      const [gasEstimation, gasPrice, nativeTokenPrice] = await Promise.all([
        estimateGas(rpcUrl, {
          from: "0xDcFCD5dD752492b95ac8C1964C83F992e7e39FA9",
          to: buildData.routerAddress,
          value: "0x0",
          data: buildData.callData,
        }).catch((err) => {
          setError(`Estimate Gas Failed: ${err.message}`);
          return "0";
        }),
        getCurrentGasPrice(rpcUrl).catch(() => 0),
        fetch(
          `https://price.kyberswap.com/${NetworkInfo[chainId].pricePath}/api/v1/prices?ids=${NetworkInfo[chainId].wrappedToken.address}`
        )
          .then((res) => res.json())
          .then((res) => res?.data?.prices[0])
          .then((res) => res?.marketPrice || res?.price || 0),
      ]);
      console.log(gasEstimation, gasPrice, nativeTokenPrice);
      const gasUsd =
        (parseInt(gasEstimation, 16) / 10 ** 18) * gasPrice * nativeTokenPrice;

      setGasUsd(gasUsd);
    })();
  }, [buildData]);

  console.log(error);

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
            <div className="flex justify-between items-start text-base mt-2">
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

            <div className="flex justify-between items-start text-base mt-2">
              <div className="flex items-center gap-1">
                <Image
                  className="w-4 h-4"
                  src={pools[1].token1.logo || ""}
                  alt=""
                />
                {formatTokenAmount(amount1, pools[1].token1.decimals, 10)}{" "}
                {pools[1].token1.symbol}
              </div>
              <div className="text-subText">
                ~
                {formatDisplayNumber(
                  (pools[1].token1.price || 0) *
                    Number(toRawString(amount1, pools[1].token1.decimals)),
                  { style: "currency" }
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Remaining Amount
            </div>
            <div>TODO</div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Max Slippage
            </div>
            <div className="text-sm">
              {formatDisplayNumber((slippage * 100) / 10_000, {
                style: "percent",
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Swap Price Impact
            </div>
            <div>TODO</div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Est. Gas Fee
            </div>
            <div className="text-sm">
              {gasUsd
                ? formatDisplayNumber(gasUsd, { style: "currency" })
                : "--"}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Migration Fee
            </div>
            <div>TODO</div>
          </div>

          <div className="flex gap-5 mt-8">
            <button
              className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
              onClick={() => togglePreview()}
            >
              Cancel
            </button>
            <button
              className={cn(
                "flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium",
                "disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed"
              )}
              onClick={() => {
                console.log(buildData);
              }}
            >
              Migrate
            </button>
          </div>

          <MigrationSummary route={route} />
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

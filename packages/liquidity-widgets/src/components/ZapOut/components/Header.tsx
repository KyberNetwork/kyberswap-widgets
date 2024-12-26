import { useZapOutContext } from "@/stores/zapout";
import SettingIcon from "@/assets/svg/setting.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import { Skeleton } from "@kyber/ui/skeleton";
import X from "@/assets/svg/x.svg";
import { UniV3Pool, UniV3Position, univ3PoolType } from "@/schema";
import { cn } from "@kyber/utils/tailwind-helpers";
import { DexInfos, NetworkInfo } from "@/constants";
import { SyntheticEvent } from "react";
import { MouseoverTooltip } from "@/components/Tooltip";
import { useZapOutUserState } from "@/stores/zapout/zapout-state";
import Setting from "./Setting";

export const Header = () => {
  const { onClose, poolType, pool, position, positionId, theme, chainId } =
    useZapOutContext((s) => s);
  const isUniV3 = univ3PoolType.safeParse(poolType).success;

  const { degenMode, toggleSetting } = useZapOutUserState();

  const loading = pool === "loading" || position === "loading";

  const isOutOfRange =
    isUniV3 && !loading
      ? (position as UniV3Position).tickLower > (pool as UniV3Pool).tick ||
        (pool as UniV3Pool).tick >= (position as UniV3Position).tickUpper
      : false;

  const onImgError = ({
    currentTarget,
  }: SyntheticEvent<HTMLImageElement, Event>) => {
    currentTarget.onerror = null;
    currentTarget.src = defaultTokenLogo;
  };

  const { icon: logo, name: rawName } = DexInfos[poolType];
  const name = typeof rawName === "string" ? rawName : rawName[chainId];

  return (
    <>
      <div className="flex justify-between text-xl font-medium">
        {loading ? (
          <Skeleton className="w-[400px] h-7" />
        ) : (
          <div className="flex items-center gap-2">
            Zap Out {pool.token0.symbol}/{pool.token1.symbol}{" "}
            {isUniV3 && (
              <>
                #{positionId}
                <div
                  className={cn(
                    "flex gap-1 items-center rounded-full text-xs px-2 py-1 font-medium",
                    isOutOfRange ? "text-warning" : "text-success"
                  )}
                  style={{
                    background: `${
                      isOutOfRange ? theme.warning : theme.success
                    }33`,
                  }}
                >
                  <div
                    className={cn("w-3 h-3 rounded-full")}
                    style={{
                      background: `${
                        isOutOfRange ? theme.warning : theme.success
                      }`,
                    }}
                  />{" "}
                  {isOutOfRange ? "Inactive" : "In Range"}
                </div>
              </>
            )}
          </div>
        )}

        <div role="button" onClick={onClose}>
          <X />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 relative">
        {loading ? (
          <Skeleton className="w-[300px] h-6 mt-1" />
        ) : (
          <div className="flex items-center gap-1">
            <div className="relative flex items-end">
              <img
                src={pool.token0.logo}
                alt="token0 logo"
                onError={onImgError}
                className="w-6 h-6"
              />
              <img
                className="w-6 h-6 -ml-2"
                src={pool.token1.logo}
                alt="token1 logo"
                onError={onImgError}
              />
              <img
                className="w-3 h-3 -ml-1"
                src={NetworkInfo[chainId].logo}
                onError={onImgError}
              />
            </div>
            <span className="text-xl">
              {pool.token0.symbol}/{pool.token1.symbol}
            </span>
            <div className="rounded-full text-xs bg-layer2 text-text px-3 py-[2px]">
              Fee {pool.fee}%
            </div>

            <img
              src={logo}
              width={16}
              height={16}
              alt=""
              onError={onImgError}
            />
            <span className="text-sm">{name}</span>
          </div>
        )}

        <MouseoverTooltip text={degenMode ? "Degen Mode is turned on!" : ""}>
          <div
            className="w-9 h-9 flex items-center justify-center rounded-full bg-layer2 hover:opacity-60"
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleSetting();
            }}
            style={{
              background: degenMode ? theme.warning + "33" : undefined,
              color: degenMode ? theme.warning : undefined,
            }}
          >
            <SettingIcon />
          </div>
        </MouseoverTooltip>
        <Setting />
      </div>
    </>
  );
};

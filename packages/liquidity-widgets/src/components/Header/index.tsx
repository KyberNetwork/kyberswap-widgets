import { useWeb3Provider } from "../../hooks/useProvider";
import SettingIcon from "@/assets/svg/setting.svg";
import X from "@/assets/svg/x.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";

import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { NetworkInfo } from "../../constants";
import { useZapState } from "../../hooks/useZapInState";
import { getDexLogo, getDexName } from "../../utils";
import { MouseoverTooltip } from "../Tooltip";
import { shortenAddress } from "../TokenInfo/utils";
import useCopy from "@/hooks/useCopy";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId } = useWeb3Provider();
  const { loading, pool, poolType, positionId, position, theme, poolAddress } =
    useWidgetInfo();
  const Copy = useCopy({
    text: poolAddress,
    copyClassName: "!text-[#2C9CE4] hover:brightness-125",
  });

  const { toggleSetting, degenMode } = useZapState();
  if (loading) return <span>loading...</span>;

  if (!pool) return <span>can't get pool info</span>;
  const { token0, token1, fee } = pool;

  const logo = getDexLogo(poolType);
  const dexName = getDexName(poolType, chainId);

  const isOutOfRange = position
    ? pool.tickCurrent < position.tickLower ||
      pool.tickCurrent >= position.tickUpper
    : false;

  return (
    <>
      <div className="flex text-xl font-medium justify-between items-center">
        <div className="flex items-center gap-[6px]">
          {positionId !== undefined ? "Increase" : "Add"} Liquidity{" "}
          {pool.token0.symbol}/{pool.token1.symbol}{" "}
          {positionId !== undefined && (
            <>
              <div className="text-accent">#{positionId}</div>
              <div
                className={`rounded-full text-xs px-2 py-1 font-normal text-${
                  isOutOfRange ? "warning" : "accent"
                }`}
                style={{
                  background: `${
                    isOutOfRange ? theme.warning : theme.accent
                  }33`,
                }}
              >
                {isOutOfRange ? "● Out of range" : "● In range"}
              </div>
            </>
          )}
        </div>
        <div
          className="cursor-pointer text-subText"
          role="button"
          onClick={onDismiss}
        >
          <X />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center flex-wrap gap-1 text-sm max-sm:gap-y-2">
          <div className="flex items-end">
            <img
              className="rounded-full w-[26px] h-[26px] border-[2px] border-layer1"
              src={token0.logoURI}
              alt="token0 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              className="-ml-[6px] rounded-full w-[26px] h-[26px] border-[2px] border-layer1"
              src={token1.logoURI}
              alt="token1 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              className="-ml-1 bg-layer1 rounded-full w-[14px] h-[14px] border-[2px] border-layer1 max-sm:w-[18px] max-sm:h-[18px] max-sm:-ml-2"
              src={NetworkInfo[chainId].logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
          </div>

          <span className="text-xl">
            {token0.symbol}/{token1.symbol}
          </span>

          <div className="flex ml-[2px] gap-[6px] text-subText items-center">
            <div className="rounded-full text-xs bg-layer2 text-subText px-[14px] py-1">
              Fee {fee / 10_000}%
            </div>
            <div className="rounded-full text-xs bg-layer2 text-[#2C9CE4] px-3 py-1 flex gap-1">
              {shortenAddress(chainId, poolAddress, 4)}
              {Copy}
            </div>
            <img
              src={logo}
              width={16}
              height={16}
              alt=""
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <span className="relative top-[-1=px]">{dexName}</span>
          </div>
        </div>

        <MouseoverTooltip
          className="top-16 right-6 max-sm:absolute"
          text={degenMode ? "Degen Mode is turned on!" : ""}
        >
          <div
            className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer bg-layer2 hover:brightness-125 active:scale-95 ${
              degenMode ? "text-warning" : ""
            }`}
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleSetting();
            }}
          >
            <SettingIcon />
          </div>
        </MouseoverTooltip>
      </div>
    </>
  );
};

export default Header;

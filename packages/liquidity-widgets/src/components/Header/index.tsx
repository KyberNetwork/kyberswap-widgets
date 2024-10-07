import "./Header.scss";
import { useWeb3Provider } from "../../hooks/useProvider";
import SettingIcon from "../../assets/setting.svg";
import X from "../../assets/x.svg";
import defaultTokenLogo from "@/assets/question.svg?url";

import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { NetworkInfo, UNI_V3_BPS } from "../../constants";
import { useZapState } from "../../hooks/useZapInState";
import { getDexLogo, getDexName } from "../../utils";
import { MouseoverTooltip } from "../Tooltip";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId } = useWeb3Provider();
  const { loading, pool, poolType, positionId, position, theme } =
    useWidgetInfo();

  const { toggleSetting, degenMode } = useZapState();
  if (loading) return <span>loading...</span>;

  if (!pool) return <span>can't get pool info</span>;
  const { token0, token1, fee } = pool;

  const logo = getDexLogo(poolType);
  const name = getDexName(poolType);

  const isOutOfRange = position
    ? pool.tickCurrent < position.tickLower ||
      pool.tickCurrent >= position.tickUpper
    : false;

  return (
    <>
      <div className="ks-lw-title">
        <div style={{ display: "flex", alignItems: "center" }}>
          Zap in {pool.token0.symbol}/{pool.token1.symbol}{" "}
          {positionId !== undefined && (
            <>
              <div style={{ marginLeft: "4px", color: "var(--ks-lw-accent)" }}>
                #{positionId}
              </div>
              <div
                className={`tag ${
                  !isOutOfRange ? "tag-primary" : "tag-warning"
                }`}
              >
                {isOutOfRange ? "Inactive" : "Active"}
              </div>
            </>
          )}
        </div>
        <div className="close-btn" role="button" onClick={onDismiss}>
          <X />
        </div>
      </div>
      <div className="ks-lw-header">
        <div className="pool-info">
          <div className="pool-tokens-logo">
            <img
              src={token0.logoURI}
              alt="token0 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              src={token1.logoURI}
              alt="token1 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              className="network-logo"
              src={NetworkInfo[chainId].logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
          </div>

          <span className="symbol">
            {token0.symbol}/{token1.symbol}
          </span>

          <div className="dex-type">
            <div className="rounded-full text-[12px] bg-[--ks-lw-layer2] text-[--ks-lw-text] px-[12px] py-[2px]">
              Fee {fee / UNI_V3_BPS}%
            </div>
            <span className="divide">|</span>
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
            <span>{name}</span>
          </div>
        </div>

        <MouseoverTooltip text={degenMode ? "Degen Mode is turned on!" : ""}>
          <div
            className="setting"
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
      </div>
    </>
  );
};

export default Header;

import "./Header.scss";
import { useWeb3Provider } from "../../hooks/useProvider";
import uniswapLogo from "../../assets/uniswap.png";
import pancakeLogo from "../../assets/pancake.png";
import SettingIcon from "../../assets/setting.svg?react";
import X from "../../assets/x.svg?react";

import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { NetworkInfo, PoolType, UNI_V3_BPS } from "../../constants";
import { useZapState } from "../../hooks/useZapInState";
import { getDexName } from "../../utils";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId } = useWeb3Provider();
  const { loading, pool, poolType, positionId } = useWidgetInfo();
  const { toggleSetting } = useZapState();
  if (loading) return <span>loading...</span>;

  if (!pool) return <span>can't get pool info</span>;
  const { token0, token1, fee } = pool;

  const logo = (() => {
    switch (poolType) {
      case PoolType.DEX_UNISWAPV3:
        return uniswapLogo;
      case PoolType.DEX_PANCAKESWAPV3:
        return pancakeLogo;
    }
  })();
  const name = getDexName(poolType);

  return (
    <>
      <div className="ks-lw-title">
        <div style={{ display: "flex" }}>
          Zap in {pool.token0.symbol}/{pool.token1.symbol}{" "}
          {positionId !== undefined && (
            <div style={{ marginLeft: "4px", color: "var(--ks-lw-accent)" }}>
              #{positionId}
            </div>
          )}
        </div>
        <div className="close-btn" role="button" onClick={onDismiss}>
          <X />
        </div>
      </div>
      <div className="ks-lw-header">
        <div className="pool-info">
          <div className="pool-tokens-logo">
            <img src={token0.logoURI} alt="" width="24px" height="24px" />
            <img src={token1.logoURI} alt="" width="24px" height="24px" />
            <img
              className="network-logo"
              src={NetworkInfo[chainId].logo}
              width="12px"
              height="12px"
            />
          </div>

          <span className="symbol">
            {token0.symbol}/{token1.symbol}
          </span>

          <div className="tag">Fee {fee / UNI_V3_BPS}%</div>

          <div className="dex-type">
            <span>|</span>
            <img src={logo} width={16} height={16} alt="" />
            <span>{name}</span>
          </div>
        </div>

        <div className="setting" role="button" onClick={toggleSetting}>
          <SettingIcon />
        </div>
      </div>
    </>
  );
};

export default Header;

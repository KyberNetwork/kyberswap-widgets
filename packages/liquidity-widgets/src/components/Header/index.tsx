import "./Header.scss";
import { useWeb3Provider } from "../../hooks/useProvider";
import uniswapLogo from "../../assets/uniswap.png";
import pancakeLogo from "../../assets/pancake.png";
import SettingIcon from "../../assets/setting.svg?react";
import X from "../../assets/x.svg?react";

import { PoolType, useWidgetInfo } from "../../hooks/useWidgetInfo";
import { NetworkInfo, UNI_V3_BPS } from "../../constants";
import { useZapState } from "../../hooks/useZapInState";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId } = useWeb3Provider();
  const { loading, pool, poolType } = useWidgetInfo();
  const { toggleSetting } = useZapState();
  if (loading) return "loading...";

  if (!pool) return `can't get pool info`;
  const { token0, token1, fee } = pool;

  const logo = (() => {
    switch (poolType) {
      case PoolType.DEX_UNISWAPV3:
        return uniswapLogo;
      case PoolType.DEX_PANCAKESWAPV3:
        return pancakeLogo;
    }
  })();
  const name = (() => {
    switch (poolType) {
      case PoolType.DEX_UNISWAPV3:
        return "Uniswap V3";
      case PoolType.DEX_PANCAKESWAPV3:
        return "Pancakeswap V3";
    }
  })();

  return (
    <>
      <div className="ks-lw-title">
        <span>
          Zap in {pool.token0.symbol}/{pool.token1.symbol}
        </span>
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

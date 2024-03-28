import "./Header.scss";
import { useWeb3Provider } from "../../hooks/useProvider";
import uniswapLogo from "../../assets/uniswap.png";
import SettingIcon from "../../assets/setting.svg?react";
import X from "../../assets/x.svg?react";

import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { NetworkInfo, UNI_V3_BPS } from "../../constants";
import { Token } from "../../hooks/usePoolInfo";

const Header = () => {
  const { chainId } = useWeb3Provider();
  const { loading, pool } = useWidgetInfo();
  if (loading) return "loading...";

  if (!pool) return `can't get pool info`;
  const { token0, token1, fee } = pool;

  return (
    <>
      <div className="ks-lw-title">
        <span>
          Zap in {pool.token0.symbol}/{pool.token1.symbol}
        </span>
        <div className="close-btn" role="button">
          <X />
        </div>
      </div>
      <div className="ks-lw-header">
        <div className="pool-info">
          <div className="pool-tokens-logo">
            <img
              src={(token0 as Token).logoURI}
              alt=""
              width="24px"
              height="24px"
            />
            <img
              src={(token1 as Token).logoURI}
              alt=""
              width="24px"
              height="24px"
            />
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
            <img src={uniswapLogo} width={16} height={16} alt="" />
            <span>Uniswap V3</span>
          </div>
        </div>

        <div className="setting" role="button">
          <SettingIcon />
        </div>
      </div>
    </>
  );
};

export default Header;

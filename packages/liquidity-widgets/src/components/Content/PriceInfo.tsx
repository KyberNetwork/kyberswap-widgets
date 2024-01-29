import { useState } from "react";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import SwitchIcon from "../../assets/switch.svg?react";

export default function PriceInfo() {
  const { loading, poolInfo } = useWidgetInfo();
  const [revert, setRevert] = useState(false);

  if (loading) return <div className="ks-lw-content">Loading...</div>;

  return (
    <div className="price-info">
      <div className="row">
        <span>Market price</span>
        <span className="price">0.0025</span>
        <span>
          {revert
            ? `${poolInfo?.token1.symbol} per ${poolInfo?.token0.symbol}`
            : `${poolInfo?.token0.symbol} per ${poolInfo?.token1.symbol}`}
        </span>
        <SwitchIcon onClick={() => setRevert(!revert)} />
      </div>

      <div className="row">
        <span>Current price</span>
        <span className="price">0.0025</span>
        <span>
          {revert
            ? `${poolInfo?.token1.symbol} per ${poolInfo?.token0.symbol}`
            : `${poolInfo?.token0.symbol} per ${poolInfo?.token1.symbol}`}
        </span>
        <SwitchIcon onClick={() => setRevert(!revert)} />
      </div>
    </div>
  );
}

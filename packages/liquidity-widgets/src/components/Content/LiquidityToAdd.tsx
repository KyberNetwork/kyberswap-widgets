import WalletIcon from "../../assets/wallet.svg?react";
import SwitchIcon from "../../assets/switch.svg?react";

export default function LiquidityToAdd() {
  return (
    <div className="liquidity-to-add">
      <div className="label">Liquidity to add</div>
      <div className="input-token">
        <div className="balance">
          <div className="balance-flex">
            <button className="small">Max</button>
            <button className="small">Half</button>
          </div>

          <div className="balance-flex">
            <WalletIcon />
            460 KNC
          </div>
        </div>

        <div className="input-row">
          <input />
          <button>
            KNC
            <SwitchIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

import "./Content.scss";
import PriceInfo from "./PriceInfo";
import LiquidityChart from "./LiquidityChart";
import PriceInput from "./PriceInput";
import LiquidityToAdd from "./LiquidityToAdd";

export default function Content() {
  return (
    <div className="ks-lw-content">
      <div className="left">
        <PriceInfo />
        <LiquidityChart />
        <PriceInput />
        <PriceInput />
        <LiquidityToAdd />
      </div>

      <div className="right"></div>
    </div>
  );
}

import { TokenListProvider } from "@/hooks/useTokenList";
import { ZapOutProps, ZapOutProvider } from "@/stores/zapout";
import { Theme } from "@/theme";
import { useEffect } from "react";
import { Header } from "./components/Header";
import { PoolPrice } from "./components/PoolPrice";
import { PositionPriceRange } from "./components/PositionPriceRange";
import { LiquidityToRemove } from "./components/LiquidityToRemove";
import { ZapTo } from "./components/ZapTo";
import { ZapSummary } from "./components/ZapSummary";
import { EstLiqValue } from "./components/EstLiqValue";

export default function ZapOut(props: ZapOutProps) {
  const { theme } = props;
  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <ZapOutProvider {...props}>
      <TokenListProvider chainId={props.chainId}>
        <div className="ks-lw ks-lw-style">
          <Header />
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <PoolPrice />
              <PositionPriceRange />
              <LiquidityToRemove />
            </div>

            <div className="flex flex-col gap-4">
              <ZapTo />
              <EstLiqValue />
              <ZapSummary />
            </div>
          </div>
        </div>
      </TokenListProvider>
    </ZapOutProvider>
  );
}

import "./App.css";
import { Dex, ZapMigration, ChainId } from "@kyber/zap-migration-widgets";
import "@kyber/zap-migration-widgets/dist/style.css";

function App() {
  return (
    <div className="ks-demo-app">
      <div className="ks-demo-app-wrapper">
        <ZapMigration
          chainId={ChainId.Bsc}
          from={{
            dex: Dex.Pancakev3,
            poolId: "0x36696169C63e42cd08ce11f5deeBbCeBae652050",
            positionId: 1314637,
          }}
          to={{
            dex: Dex.Pancakev3,
            poolId: "0x0f338Ec12d3f7C3D77A4B9fcC1f95F3FB6AD0EA6",
          }}
        />
      </div>
    </div>
  );
}

export default App;

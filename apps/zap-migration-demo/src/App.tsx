import "./App.css";
import { Dex, ZapMigration, ChainId } from "@kyber/zap-migration-widgets";
import "@kyber/zap-migration-widgets/dist/style.css";

function App() {
  return (
    <div className="ks-demo-app">
      <div className="ks-demo-app-wrapper">
        <ZapMigration
          onClose={() => {
            window.location.reload();
          }}
          chainId={ChainId.Ethereum}
          from={{
            dex: Dex.Uniswapv3,
            poolId: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
            positionId: 784066,
          }}
          to={{
            dex: Dex.Pancakev3,
            poolId: "0xaCDb27b266142223e1e676841C1E809255Fc6d07",
          }}
        />
      </div>
    </div>
  );
}

export default App;

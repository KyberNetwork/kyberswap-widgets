import WalletIcon from "../../assets/wallet.svg?react";
import SwitchIcon from "../../assets/switch.svg?react";
import { useZapState } from "../../hooks/useZapInState";
import { formatWei } from "../../utils";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";

export default function LiquidityToAdd() {
  const { amountIn, setAmountIn, tokenIn, toggleTokenIn, balanceIn } =
    useZapState();

  return (
    <div className="liquidity-to-add">
      <div className="label">Liquidity to add</div>
      <div className="input-token">
        <div className="balance">
          <div className="balance-flex">
            <button
              className="small"
              onClick={() => {
                if (balanceIn && tokenIn) {
                  setAmountIn(
                    formatUnits(
                      BigNumber.from(balanceIn).toString(),
                      tokenIn.decimals
                    )
                  );
                }
              }}
            >
              Max
            </button>
            <button
              className="small"
              onClick={() => {
                if (balanceIn && tokenIn)
                  setAmountIn(
                    formatUnits(
                      BigNumber.from(balanceIn).div(2).toString(),
                      tokenIn.decimals
                    )
                  );
              }}
            >
              Half
            </button>
          </div>

          <div className="balance-flex">
            <WalletIcon />
            {formatWei(balanceIn, tokenIn?.decimals)} {tokenIn?.symbol}
          </div>
        </div>

        <div className="input-row">
          <div className="input">
            <input
              value={amountIn}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, ".");
                const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                if (
                  value === "" ||
                  inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                ) {
                  setAmountIn(value);
                }
              }}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder="0.0"
              minLength={1}
              maxLength={79}
              spellCheck="false"
            />
          </div>
          <button onClick={toggleTokenIn}>
            {tokenIn && (
              <img src={tokenIn?.logoURI} alt="TokenLogo" width="20px" />
            )}
            <span>{tokenIn?.symbol}</span>
            <SwitchIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

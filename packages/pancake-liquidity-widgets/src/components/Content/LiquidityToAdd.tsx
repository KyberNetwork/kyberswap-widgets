import { formatUnits } from "viem";

import SwitchIcon from "../../assets/switch.svg";
import { useZapState } from "../../hooks/useZapInState";
import { formatCurrency, formatWei } from "../../utils";

export default function LiquidityToAdd() {
  const { amountIn, setAmountIn, tokenIn, toggleTokenIn, balanceIn, zapInfo } =
    useZapState();

  const initUsd = zapInfo?.zapDetails.initialAmountUsd;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, ".");
    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
    if (
      value === "" ||
      inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    )
      setAmountIn(value);
  };

  return (
    <div>
      <div className="text-xs font-medium text-secondary uppercase">
        Deposit Amount
      </div>

      <div className="flex justify-between items-center mt-2">
        <button
          className="bg-transparent border-none rounded-full outline-inherit cursor-pointer p-0 items-center text-[var(--ks-lw-text)] brightness-130 flex gap-1 text-base font-semibold hover:brightness-140 active:scale-96"
          onClick={toggleTokenIn}
        >
          {tokenIn && (
            <img
              src={tokenIn?.logoURI}
              alt="TokenLogo"
              className="w-6 rounded-[50%] brightness-80"
            />
          )}
          <span>{tokenIn?.symbol}</span>
          <SwitchIcon />
        </button>

        <div className="text-textSecondary text-xs">
          <span>Balance</span>: {formatWei(balanceIn, tokenIn?.decimals)}
        </div>
      </div>

      <div
        className="mt-2 border border-inputBorder bg-inputBackground rounded-md py-2 px-4 flex flex-col items-end"
        style={{ boxShadow: "box-shadow: 0px 2px 0px -1px #0000000f inset" }}
      >
        <input
          className="bg-transparent text-textPrimary text-base font-medium w-full p-0 text-right border-none outline-none"
          value={amountIn}
          onChange={handleInputChange}
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

        <div className="mt-1 text-sm text-textSecondary">
          ~{formatCurrency(+(initUsd || 0))}
        </div>

        <div className="flex justify-end gap-1 text-subText text-sm font-medium mt-1">
          <button
            className="ks-outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn)
                setAmountIn(
                  formatUnits(BigInt(balanceIn) / BigInt(4), tokenIn.decimals)
                );
            }}
          >
            25%
          </button>
          <button
            className="ks-outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn)
                setAmountIn(
                  formatUnits(BigInt(balanceIn) / BigInt(2), tokenIn.decimals)
                );
            }}
          >
            50%
          </button>
          <button
            className="ks-outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn)
                setAmountIn(
                  formatUnits(
                    (BigInt(balanceIn) * BigInt(3)) / BigInt(4),
                    tokenIn.decimals
                  )
                );
            }}
          >
            75%
          </button>

          <button
            className="ks-outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn) {
                setAmountIn(formatUnits(BigInt(balanceIn), tokenIn.decimals));
              }
            }}
          >
            Max
          </button>
        </div>
      </div>
    </div>
  );
}

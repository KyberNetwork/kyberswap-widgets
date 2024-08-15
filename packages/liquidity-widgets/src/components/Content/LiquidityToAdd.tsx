import WalletIcon from "../../assets/wallet.svg?react";
import SwitchIcon from "../../assets/switch.svg?react";
import { useZapState } from "../../hooks/useZapInState";
import { formatCurrency, formatWei } from "../../utils";
// import { BigNumber } from "ethers";
// import { formatUnits } from "ethers/lib/utils";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useState } from "react";
import Modal from "../Modal";
import { useTokenList } from "../../hooks/useTokenList";
import { useTokenBalances } from "../../hooks/useTokenBalance";

export default function LiquidityToAdd() {
  const {
    // amountIn,
    // setAmountIn,
    // toggleTokenIn,
    // balanceIn,
    zapInfo,
    amountIns,
    tokenIns,
    onAddNewToken,
    onRemoveToken,
    onAmountChange,
    onTokenInChange,
  } = useZapState();
  const { positionId, theme } = useWidgetInfo();

  const { tokens } = useTokenList();
  // TODO
  const initUsd = zapInfo?.zapDetails.initialAmountUsd;

  const { balances } = useTokenBalances(tokens.map((item) => item.address));

  const [showTokenModal, setShowTokenModal] = useState<null | number>(null);
  const [search, setSearch] = useState("");

  return (
    <>
      <div className="liquidity-to-add">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="label">
            Liquidity to {positionId ? "increase" : "add"}
          </div>
          <button
            onClick={() => {
              onAddNewToken();
              setShowTokenModal(tokenIns.length);
            }}
          >
            + Add Token
          </button>
        </div>
        {tokenIns.map((tokenIn, index) => {
          return (
            <div className="input-token" key={index}>
              <div className="balance">
                <div className="balance-flex">
                  <button
                    className="small"
                    onClick={() => {
                      // TODO
                      // if (balanceIn && tokenIn) {
                      //   onAmountChange(index,
                      //     formatUnits(
                      //       BigNumber.from(balanceIn).toString(),
                      //       tokenIn.decimals
                      //     )
                      //   );
                      // }
                    }}
                  >
                    Max
                  </button>
                  <button
                    className="small"
                    onClick={() => {
                      // TODO
                      // if (balanceIn && tokenIn)
                      //   setAmountIn(
                      //     formatUnits(
                      //       BigNumber.from(balanceIn).div(2).toString(),
                      //       tokenIn.decimals
                      //     )
                      //   );
                    }}
                  >
                    Half
                  </button>
                </div>

                <div className="balance-flex">
                  <WalletIcon />
                  {formatWei(
                    balances[tokenIn?.address || ""]?.toString() || "0",
                    tokenIn?.decimals
                  )}{" "}
                  {tokenIn?.symbol}
                  {tokenIns.length > 1 && (
                    <button onClick={() => onRemoveToken(index)}>-</button>
                  )}
                </div>
              </div>

              <div className="input-row">
                <div className="input">
                  <input
                    value={amountIns[index]}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, ".");
                      const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                      if (
                        value === "" ||
                        inputRegex.test(
                          value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                        )
                      ) {
                        console.log(value);
                        onAmountChange(index, value);
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
                {!!initUsd && (
                  <div className="est-usd">~{formatCurrency(+initUsd)}</div>
                )}
                <button onClick={() => setShowTokenModal(index)}>
                  {tokenIn && (
                    <img
                      src={tokenIn?.logoURI}
                      alt="TokenLogo"
                      width="20px"
                      style={{ borderRadius: "50%" }}
                    />
                  )}
                  <span>{tokenIn?.symbol}</span>
                  <SwitchIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {showTokenModal !== null && (
        <Modal
          isOpen={showTokenModal !== null}
          onClick={() => {
            setShowTokenModal(null)
          }}
        >
          <div>Select Token</div>

          <input
            style={{
              width: "100%",
              marginTop: "1rem",
              background: theme.layer2,
              height: "40px",
              boxShadow: "none",
              border: "none",
              borderRadius: theme.borderRadius,
              padding: "0 1rem",
              color: theme.text,
              boxSizing: "border-box",
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token address or symbol"
          />

          <div style={{ maxHeight: "500px", overflowY: "scroll" }}>
            {tokens
              .filter((i) =>
                i.symbol?.toLowerCase().includes(search.trim().toLowerCase())
              )
              .sort((a, b) => {
                const b1 = balances[a.address.toLowerCase()];
                const b2 = balances[b.address.toLowerCase()];
                if (b1 && b2 && b1.gt(b2)) return -1;
                return 1;
              })
              .map((item) => {
                const isSelected = tokenIns
                  .map((item) => item?.address.toLowerCase())
                  .includes(item.address.toLowerCase());
                return (
                  <div
                    key={item.address}
                    style={{
                      padding: "12px 0",
                      display: "flex",
                      gap: "8px",
                      cursor: isSelected ? "not-allowed" : "pointer",
                      justifyContent: "space-between",
                    }}
                    onClick={() => {
                      if (isSelected) return;
                      setShowTokenModal(null);
                      onTokenInChange(showTokenModal, item);
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px" }}>
                      <img
                        src={item.logoURI}
                        width="24px"
                        height="24px"
                        alt={item.symbol}
                      />
                      {item.symbol}
                    </div>

                    <div>
                      {formatWei(
                        balances[item.address.toLowerCase()]?.toString(),
                        item.decimals
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Modal>
      )}
    </>
  );
}

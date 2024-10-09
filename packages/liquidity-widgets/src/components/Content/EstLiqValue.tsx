import { BigNumber } from "ethers";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  RefundAction,
  PartnerFeeAction,
  ProtocolFeeAction,
  ZapAction,
} from "../../hooks/types/zapInTypes";
import {
  PI_LEVEL,
  formatCurrency,
  formatNumber,
  formatWei,
  getPriceImpact,
} from "../../utils";
import InfoHelper from "../InfoHelper";
import { formatUnits } from "ethers/lib/utils";
import { MouseoverTooltip } from "../Tooltip";
import { PATHS } from "@/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMemo } from "react";
import { useTokenList } from "@/hooks/useTokenList";
import { Token } from "@/entities/Pool";
import { formatDisplayNumber } from "@/utils/number";
import defaultTokenLogo from "@/assets/svg/question.svg?url";

export default function EstLiqValue() {
  const { zapInfo, source, slippage } = useZapState();
  const { pool, theme, position } = useWidgetInfo();
  const { allTokens } = useTokenList();

  const addLiquidityInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.ADD_LIQUIDITY
  ) as AddLiquidityAction | undefined;
  const addedAmount0 = formatUnits(
    addLiquidityInfo?.addLiquidity.token0.amount || "0",
    pool?.token0.decimals
  );
  const addedAmount1 = formatUnits(
    addLiquidityInfo?.addLiquidity.token1.amount || "0",
    pool?.token1.decimals
  );

  const refundInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.REFUND
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) =>
        item.address.toLowerCase() === pool?.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) =>
        item.address.toLowerCase() === pool?.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool?.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool?.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const feeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;

  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PARTNET_FEE
  ) as PartnerFeeAction | undefined;

  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = allTokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = allTokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = allTokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = allTokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [feeInfo, allTokens, zapInfo]);

  const swapPiLevel = useMemo(() => {
    if (swapPi.find((item) => item.piRes.level === PI_LEVEL.INVALID))
      return PI_LEVEL.INVALID;
    if (swapPi.find((item) => item.piRes.level === PI_LEVEL.VERY_HIGH))
      return PI_LEVEL.VERY_HIGH;
    if (swapPi.find((item) => item.piRes.level === PI_LEVEL.HIGH))
      return PI_LEVEL.HIGH;

    return PI_LEVEL.NORMAL;
  }, [swapPi]);

  const positionAmount0Usd =
    (+(position?.amount0 || 0) *
      +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0)) /
      +addedAmount0 || 0;

  const positionAmount1Usd =
    (+(position?.amount1 || 0) *
      +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0)) /
      +addedAmount1 || 0;

  const addedAmountUsd =
    +(zapInfo?.positionDetails.addedAmountUsd || 0) +
      positionAmount0Usd +
      positionAmount1Usd || 0;

  return (
    <>
      <div className="zap-route est-liq-val">
        <div className="title">
          Est. Liquidity Value
          {!!addedAmountUsd && <span>{formatCurrency(addedAmountUsd)}</span>}
        </div>
        <div className="divider"></div>

        <div className="detail-row">
          <div className="label">Est. Pooled {pool?.token0.symbol}</div>
          {zapInfo ? (
            <div>
              <div className="token-amount">
                {pool?.token0?.logoURI && (
                  <img
                    src={pool.token0.logoURI}
                    width="14px"
                    style={{ marginTop: "2px", borderRadius: "50%" }}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end">
                  {formatNumber(position ? +position.amount0 : +addedAmount0)}{" "}
                  {pool?.token0.symbol}
                </div>
              </div>
              {position && (
                <div className="text-end">
                  + {formatNumber(+addedAmount0)} {pool?.token0.symbol}
                </div>
              )}

              <div className="label" style={{ marginLeft: "auto" }}>
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0) +
                    positionAmount0Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="detail-row">
          <div className="label">Est. Pooled {pool?.token1.symbol}</div>
          {zapInfo ? (
            <div>
              <div className="token-amount">
                {pool?.token1?.logoURI && (
                  <img
                    src={pool?.token1?.logoURI}
                    width="14px"
                    style={{ marginTop: "2px", borderRadius: "50%" }}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end">
                  {formatNumber(position ? +position.amount1 : +addedAmount1)}{" "}
                  {pool?.token1.symbol}
                </div>
              </div>
              {position && (
                <div className="text-end">
                  + {formatNumber(+addedAmount1)} {pool?.token1.symbol}
                </div>
              )}

              <div className="label" style={{ marginLeft: "auto" }}>
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0) +
                    positionAmount1Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="detail-row">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="label text-underline">Est. Remaining Value</div>
          </MouseoverTooltip>

          <div>
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {pool?.token0.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {pool?.token1.symbol}
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="detail-row">
          {swapPi.length ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <MouseoverTooltip
                    text="View all the detailed estimated price impact of each swap"
                    width="220px"
                  >
                    <div
                      className={`label text-underline text-[12px] ${
                        swapPiLevel === PI_LEVEL.NORMAL
                          ? ""
                          : swapPiLevel === PI_LEVEL.HIGH
                          ? "!text-[--ks-lw-warning] !border-[--ks-lw-warning]"
                          : "!text-[--ks-lw-error] !border-[--ks-lw-error]"
                      }`}
                    >
                      Swap Impact
                    </div>
                  </MouseoverTooltip>
                </AccordionTrigger>
                <AccordionContent>
                  {swapPi.map((item, index: number) => (
                    <div
                      className={`text-[12px] flex justify-between align-middle ${
                        item.piRes.level === PI_LEVEL.NORMAL
                          ? "text-[--ks-lw-subText] brightness-125"
                          : item.piRes.level === PI_LEVEL.HIGH
                          ? "text-[--ks-lw-warning]"
                          : "text-[--ks-lw-error]"
                      }`}
                      key={index}
                    >
                      <MouseoverTooltip
                        text={
                          item.piRes.level === PI_LEVEL.HIGH ||
                          item.piRes.level === PI_LEVEL.VERY_HIGH
                            ? item.piRes.msg
                            : ""
                        }
                      >
                        <div className="ml-[12px]">
                          {formatDisplayNumber(item.amountIn, {
                            significantDigits: 4,
                          })}{" "}
                          {item.tokenInSymbol} {"→ "}
                          {item.amountOut} {item.tokenOutSymbol}
                        </div>
                      </MouseoverTooltip>
                      <MouseoverTooltip
                        text={
                          item.piRes.level === PI_LEVEL.HIGH ||
                          item.piRes.level === PI_LEVEL.VERY_HIGH
                            ? item.piRes.msg
                            : ""
                        }
                      >
                        <div>{item.piRes.display}</div>
                      </MouseoverTooltip>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <>
              <MouseoverTooltip
                text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
                width="220px"
              >
                <div className="label text-underline">Swap Impact</div>
              </MouseoverTooltip>
              <span>--</span>
            </>
          )}
        </div>

        <div className="detail-row">
          <MouseoverTooltip text="Swap Max Slippage" width="220px">
            <div className="label text-underline">Swap Max Slippage</div>
          </MouseoverTooltip>
          <div>{((slippage * 100) / 10_000).toString() + "%"}</div>
        </div>

        <div className="detail-row">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div className="label text-underline">Zap Impact</div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              style={{
                color:
                  piRes.level === PI_LEVEL.VERY_HIGH ||
                  piRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : piRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.text,
              }}
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="detail-row">
          <MouseoverTooltip
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  style={{ color: theme.accent }}
                  href={`${PATHS.KYBERSWAP_DOCS}/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model`}
                  target="_blank"
                  rel="noopener norefferer"
                >
                  More details.
                </a>
              </div>
            }
            width="220px"
          >
            <div className="label text-underline">Zap Fee</div>
          </MouseoverTooltip>

          <MouseoverTooltip
            text={
              partnerFee
                ? `${parseFloat(
                    protocolFee.toFixed(3)
                  )}% Protocol Fee + ${parseFloat(
                    partnerFee.toFixed(3)
                  )}% Fee for ${source}`
                : ""
            }
          >
            <div>
              {feeInfo
                ? parseFloat((protocolFee + partnerFee).toFixed(3)) + "%"
                : "--"}
            </div>
          </MouseoverTooltip>
        </div>
      </div>

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className="warning-msg"
          style={{
            backgroundColor:
              piRes.level === PI_LEVEL.HIGH
                ? `${theme.warning}33`
                : `${theme.error}33`,
            color: piRes.level === PI_LEVEL.HIGH ? theme.warning : theme.error,
          }}
        >
          {piRes.msg}
        </div>
      )}
    </>
  );
}

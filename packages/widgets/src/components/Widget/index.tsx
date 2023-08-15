import { StrictMode, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { defaultTheme, Theme } from '../../theme'
import { ReactComponent as SettingIcon } from '../../assets/setting.svg'
import { ReactComponent as WalletIcon } from '../../assets/wallet.svg'
import { ReactComponent as DropdownIcon } from '../../assets/dropdown.svg'
import { ReactComponent as SwitchIcon } from '../../assets/switch.svg'
import { ReactComponent as SwapIcon } from '../../assets/swap.svg'
import { ReactComponent as BackIcon } from '../../assets/back1.svg'
import { ReactComponent as KyberSwapLogo } from '../../assets/kyberswap.svg'
import { ReactComponent as AlertIcon } from '../../assets/alert.svg'
import { ReactComponent as Expand } from '../../assets/expand.svg'

import useTheme from '../../hooks/useTheme'

import {
  AccountBalance,
  BalanceRow,
  Input,
  InputRow,
  InputWrapper,
  MaxHalfBtn,
  MiddleRow,
  SelectTokenBtn,
  SettingBtn,
  SwitchBtn,
  Title,
  Wrapper,
  Button,
  Dots,
  Rate,
  MiddleLeft,
  Detail,
  DetailTitle,
  Divider,
  DetailRow,
  DetailLabel,
  DetailRight,
  ModalHeader,
  ModalTitle,
  ViewRouteTitle,
} from './styled'

import { BigNumber } from 'ethers'
import { NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS, SUPPORTED_NETWORKS, TokenInfo, ZIndex } from '../../constants'
import SelectCurrency from '../SelectCurrency'
import { useActiveWeb3, Web3Provider } from '../../hooks/useWeb3Provider'
import useSwap from '../../hooks/useSwap'
import useTokenBalances from '../../hooks/useTokenBalances'
import { formatUnits } from 'ethers/lib/utils'
import useApproval, { APPROVAL_STATE } from '../../hooks/useApproval'
import Settings from '../Settings'
import { TokenListProvider, useTokens } from '../../hooks/useTokens'
import RefreshBtn from '../RefreshBtn'
import Confirmation from '../Confirmation'
import DexesSetting from '../DexesSetting'
import ImportModal from '../ImportModal'
import InfoHelper from '../InfoHelper'
import TradeRouting from '../TradeRouting'

export const DialogWrapper = styled.div`
  background-color: ${({ theme }) => theme.dialog};
  border-radius: ${({ theme }) => theme.borderRadius};
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  padding: 1rem;
  overflow: hidden;
  z-index: ${ZIndex.DIALOG};
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @supports (overflow: clip) {
    overflow: clip;
  }

  transition: 0.25s ease-in-out;

  &.open {
    transform: translateX(0);
  }

  &.close {
    transform: translateX(100%);
  }
`
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
  }
`

const SelectTokenText = styled.span`
  font-size: 16px;
  width: max-content;
`

const PoweredBy = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  margin-top: 1rem;
`

enum ModalType {
  SETTING = 'setting',
  CURRENCY_IN = 'currency_in',
  CURRENCY_OUT = 'currency_out',
  REVIEW = 'review',
  DEXES_SETTING = 'dexes_setting',
  IMPORT_TOKEN = 'import_token',
  TRADE_ROUTE = 'trade_route',
}

interface FeeSetting {
  chargeFeeBy: 'currency_in' | 'currency_out'
  feeReceiver: string
  // BPS: 10_000
  // 10 means 0.1%
  feeAmount: number
  isInBps: boolean
}

export interface WidgetProps {
  client: string
  enableRoute?: boolean
  provider?: any
  tokenList?: TokenInfo[]
  theme?: Theme
  defaultTokenIn?: string
  defaultTokenOut?: string
  feeSetting?: FeeSetting
  onTxSubmit?: (txHash: string, data: any) => void
  enableDexes?: string
}

const Widget = ({
  defaultTokenIn,
  defaultTokenOut,
  feeSetting,
  client,
  onTxSubmit,
  enableRoute,
  enableDexes,
}: {
  defaultTokenIn?: string
  defaultTokenOut?: string
  feeSetting?: FeeSetting
  client: string
  onTxSubmit?: (txHash: string, data: any) => void
  enableRoute: boolean
  enableDexes?: string
}) => {
  const [showModal, setShowModal] = useState<ModalType | null>(null)
  const { chainId } = useActiveWeb3()
  const isUnsupported = !SUPPORTED_NETWORKS.includes(chainId.toString())

  const tokens = useTokens()
  const {
    loading,
    error,
    tokenIn,
    tokenOut,
    setTokenIn,
    setTokenOut,
    inputAmout,
    setInputAmount,
    trade: routeTrade,
    slippage,
    setSlippage,
    getRate,
    deadline,
    setDeadline,
    allDexes,
    excludedDexes,
    setExcludedDexes,
    setTrade,
    isWrap,
    isUnwrap,
  } = useSwap({
    defaultTokenIn,
    defaultTokenOut,
    feeSetting,
    enableDexes,
  })

  const trade = isUnsupported ? null : routeTrade

  const [inverseRate, setInverseRate] = useState(false)

  const { balances, refetch } = useTokenBalances(tokens.map(item => item.address))

  const tokenInInfo =
    tokenIn === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : tokens.find(item => item.address.toLowerCase() === tokenIn.toLowerCase())

  const tokenOutInfo =
    tokenOut === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : tokens.find(item => item.address.toLowerCase() === tokenOut.toLowerCase())

  const amountOut =
    isWrap || isUnwrap
      ? inputAmout
      : trade?.routeSummary?.amountOut
      ? formatUnits(trade.routeSummary.amountOut, tokenOutInfo?.decimals).toString()
      : ''

  let minAmountOut = ''

  if (amountOut) {
    minAmountOut =
      isWrap || isUnwrap
        ? parseFloat((+amountOut).toPrecision(8)).toString()
        : (Number(amountOut) * (1 - slippage / 10_000)).toPrecision(8).toString()
  }

  const tokenInBalance = balances[tokenIn] || BigNumber.from(0)
  const tokenOutBalance = balances[tokenOut] || BigNumber.from(0)

  const tokenInWithUnit = formatUnits(tokenInBalance, tokenInInfo?.decimals || 18)
  const tokenOutWithUnit = formatUnits(tokenOutBalance, tokenOutInfo?.decimals || 18)

  const rate =
    isWrap || isUnwrap
      ? 1
      : trade?.routeSummary?.amountIn &&
        trade?.routeSummary?.amountOut &&
        parseFloat(formatUnits(trade.routeSummary.amountOut, tokenOutInfo?.decimals || 18)) / parseFloat(inputAmout)

  const formattedTokenInBalance = parseFloat(parseFloat(tokenInWithUnit).toPrecision(10))

  const formattedTokenOutBalance = parseFloat(parseFloat(tokenOutWithUnit).toPrecision(10))

  const theme = useTheme()

  const priceImpact = !trade?.routeSummary.amountOutUsd
    ? -1
    : ((+trade.routeSummary.amountInUsd - +trade.routeSummary.amountOutUsd) * 100) / +trade.routeSummary.amountInUsd

  const modalTitle = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return 'Settings'
      case ModalType.CURRENCY_IN:
        return 'Select a token'
      case ModalType.CURRENCY_OUT:
        return 'Select a token'
      case ModalType.DEXES_SETTING:
        return 'Liquidity Sources'
      case ModalType.IMPORT_TOKEN:
        return 'Import Token'
      case ModalType.TRADE_ROUTE:
        return 'Your Trade Route'

      default:
        return null
    }
  })()

  const [tokenToImport, setTokenToImport] = useState<TokenInfo | null>(null)
  const [importType, setImportType] = useState<'in' | 'out'>('in')

  const modalContent = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return (
          <Settings
            slippage={slippage}
            setSlippage={setSlippage}
            deadline={deadline}
            setDeadline={setDeadline}
            allDexes={allDexes}
            excludedDexes={excludedDexes}
            onShowSource={() => setShowModal(ModalType.DEXES_SETTING)}
          />
        )
      case ModalType.TRADE_ROUTE:
        if (enableRoute) return <TradeRouting trade={trade} currencyIn={tokenInInfo} currencyOut={tokenOutInfo} />
        return null
      case ModalType.CURRENCY_IN:
        return (
          <SelectCurrency
            selectedToken={tokenIn}
            onChange={address => {
              if (address === tokenOut) setTokenOut(tokenIn)
              setTokenIn(address)
              setShowModal(null)
            }}
            onImport={(token: TokenInfo) => {
              setTokenToImport(token)
              setShowModal(ModalType.IMPORT_TOKEN)
              setImportType('in')
            }}
          />
        )
      case ModalType.CURRENCY_OUT:
        return (
          <SelectCurrency
            selectedToken={tokenOut}
            onChange={address => {
              if (address === tokenIn) setTokenIn(tokenOut)
              setTokenOut(address)
              setShowModal(null)
            }}
            onImport={(token: TokenInfo) => {
              setTokenToImport(token)
              setShowModal(ModalType.IMPORT_TOKEN)
              setImportType('out')
            }}
          />
        )
      case ModalType.REVIEW:
        if (rate && tokenInInfo && trade && tokenOutInfo)
          return (
            <Confirmation
              trade={trade}
              tokenInInfo={tokenInInfo}
              amountIn={inputAmout}
              tokenOutInfo={tokenOutInfo}
              amountOut={amountOut}
              rate={rate}
              priceImpact={priceImpact}
              slippage={slippage}
              deadline={deadline}
              client={client}
              onClose={() => {
                setShowModal(null)
                refetch()
              }}
              onTxSubmit={onTxSubmit}
            />
          )
        return null
      case ModalType.DEXES_SETTING:
        return <DexesSetting allDexes={allDexes} excludedDexes={excludedDexes} setExcludedDexes={setExcludedDexes} />

      case ModalType.IMPORT_TOKEN:
        if (tokenToImport)
          return (
            <ImportModal
              token={tokenToImport}
              onImport={() => {
                if (importType === 'in') {
                  setTokenIn(tokenToImport.address)
                  setShowModal(null)
                } else {
                  setTokenOut(tokenToImport.address)
                  setShowModal(null)
                }
              }}
            />
          )
        return null
      default:
        return null
    }
  })()

  const {
    loading: checkingAllowance,
    approve,
    approvalState,
  } = useApproval(trade?.routeSummary?.amountIn || '0', tokenIn, trade?.routerAddress || '')

  return (
    <Wrapper>
      <DialogWrapper className={showModal ? 'open' : 'close'}>
        {showModal !== ModalType.REVIEW && (
          <ModalHeader>
            <ModalTitle
              onClick={() =>
                showModal === ModalType.DEXES_SETTING ? setShowModal(ModalType.SETTING) : setShowModal(null)
              }
              role="button"
            >
              <BackIcon style={{ color: theme.subText }} />
              {modalTitle}
            </ModalTitle>
          </ModalHeader>
        )}
        <ContentWrapper>{modalContent}</ContentWrapper>
        <PoweredBy style={{ marginTop: '0' }}>
          Powered By
          <KyberSwapLogo />
        </PoweredBy>
      </DialogWrapper>
      <Title>
        Swap
        <SettingBtn onClick={() => setShowModal(ModalType.SETTING)}>
          <SettingIcon />
        </SettingBtn>
      </Title>
      <InputWrapper>
        <BalanceRow>
          <div>
            <MaxHalfBtn onClick={() => setInputAmount(tokenInWithUnit)}>Max</MaxHalfBtn>
            {/* <MaxHalfBtn>Half</MaxHalfBtn> */}
          </div>
          <AccountBalance>
            <WalletIcon />
            {formattedTokenInBalance}
          </AccountBalance>
        </BalanceRow>

        <InputRow>
          <Input
            value={inputAmout}
            onChange={e => {
              const value = e.target.value.replace(/,/g, '.')
              const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
              if (value === '' || inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
                setInputAmount(value)
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

          {!!trade?.routeSummary?.amountInUsd && (
            <span
              style={{
                fontSize: '12px',
                marginRight: '4px',
                color: theme.subText,
              }}
            >
              ~
              {(+trade.routeSummary.amountInUsd).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          )}

          <SelectTokenBtn onClick={() => !isUnsupported && setShowModal(ModalType.CURRENCY_IN)}>
            {tokenInInfo ? (
              <>
                <img
                  width="20"
                  height="20"
                  alt="tokenIn"
                  src={tokenInInfo?.logoURI}
                  style={{ borderRadius: '50%' }}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null // prevents looping
                    currentTarget.src = new URL('../../assets/question.svg', import.meta.url).href
                  }}
                />
                <div style={{ marginLeft: '0.375rem' }}>{tokenInInfo?.symbol}</div>
              </>
            ) : (
              <SelectTokenText>Select a token</SelectTokenText>
            )}
            <DropdownIcon />
          </SelectTokenBtn>
        </InputRow>
      </InputWrapper>

      <MiddleRow>
        <MiddleLeft>
          <RefreshBtn
            loading={loading}
            onRefresh={() => {
              getRate()
            }}
            trade={trade}
          />
          <Rate>
            {(() => {
              if (!rate) return '--'
              return !inverseRate
                ? `1 ${tokenInInfo?.symbol} = ${+rate.toPrecision(10)} ${tokenOutInfo?.symbol}`
                : `1 ${tokenOutInfo?.symbol} = ${+(1 / rate).toPrecision(10)} ${tokenInInfo?.symbol}`
            })()}
          </Rate>

          {!!rate && (
            <SettingBtn onClick={() => setInverseRate(prev => !prev)}>
              <SwapIcon />
            </SettingBtn>
          )}
        </MiddleLeft>

        <SwitchBtn
          onClick={() => {
            setTrade(null)
            setTokenIn(tokenOut)
            setTokenOut(tokenIn)
          }}
        >
          <SwitchIcon />
        </SwitchBtn>
      </MiddleRow>

      <InputWrapper>
        <BalanceRow>
          <div />
          <AccountBalance>
            <WalletIcon />
            {formattedTokenOutBalance}
          </AccountBalance>
        </BalanceRow>

        <InputRow>
          <Input disabled value={isWrap || isUnwrap ? +amountOut : (+amountOut).toPrecision(8)} />

          {!!trade?.routeSummary?.amountOutUsd && (
            <span
              style={{
                fontSize: '12px',
                marginRight: '4px',
                color: theme.subText,
              }}
            >
              ~
              {(+trade.routeSummary.amountOutUsd).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          )}
          <SelectTokenBtn onClick={() => !isUnsupported && setShowModal(ModalType.CURRENCY_OUT)}>
            {tokenOutInfo ? (
              <>
                <img
                  width="20"
                  height="20"
                  alt="tokenOut"
                  src={tokenOutInfo?.logoURI}
                  style={{ borderRadius: '50%' }}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null // prevents looping
                    currentTarget.src = new URL('../../assets/question.svg', import.meta.url).href
                  }}
                />
                <div style={{ marginLeft: '0.375rem' }}>{tokenOutInfo?.symbol}</div>
              </>
            ) : (
              <SelectTokenText>Select a token</SelectTokenText>
            )}
            <DropdownIcon />
          </SelectTokenBtn>
        </InputRow>
      </InputWrapper>

      <Detail style={{ marginTop: '1rem' }}>
        <Row>
          <DetailTitle>More information</DetailTitle>
          {enableRoute && !(isWrap || isUnwrap) && (
            <ViewRouteTitle onClick={() => setShowModal(ModalType.TRADE_ROUTE)}>
              View Routes <Expand style={{ width: 12, height: 12 }} />
            </ViewRouteTitle>
          )}
        </Row>
        <Divider />
        <DetailRow>
          <DetailLabel>
            Minimum Received
            <InfoHelper text={`Minimum amount you will receive or your transaction will revert`} />
          </DetailLabel>
          <DetailRight>{minAmountOut ? `${minAmountOut} ${tokenOutInfo?.symbol}` : '--'}</DetailRight>
        </DetailRow>

        <DetailRow>
          <DetailLabel>
            Gas Fee <InfoHelper text="Estimated network fee for your transaction" />
          </DetailLabel>
          <DetailRight>
            {trade?.routeSummary?.gasUsd ? '$' + (+trade.routeSummary.gasUsd).toPrecision(4) : '--'}
          </DetailRight>
        </DetailRow>

        <DetailRow>
          <DetailLabel>
            Price Impact
            <InfoHelper text="Estimated change in price due to the size of your transaction" />
          </DetailLabel>
          <DetailRight
            style={{
              color: priceImpact > 15 ? theme.error : priceImpact > 5 ? theme.warning : theme.text,
            }}
          >
            {priceImpact === -1 ? '--' : priceImpact > 0.01 ? priceImpact.toFixed(3) + '%' : '< 0.01%'}
          </DetailRight>
        </DetailRow>
      </Detail>

      <Button
        disabled={!!error || loading || checkingAllowance || approvalState === APPROVAL_STATE.PENDING || isUnsupported}
        onClick={async () => {
          if (approvalState === APPROVAL_STATE.NOT_APPROVED && !isWrap && !isUnwrap) {
            approve()
          } else {
            setShowModal(ModalType.REVIEW)
          }
        }}
      >
        {isUnsupported ? (
          <PoweredBy style={{ fontSize: '16px', marginTop: '0' }}>
            <AlertIcon style={{ width: '24px', height: '24px' }} />
            Unsupported network
          </PoweredBy>
        ) : loading ? (
          <Dots>Calculate best route</Dots>
        ) : error ? (
          error
        ) : isWrap ? (
          'Wrap'
        ) : isUnwrap ? (
          'Unwrap'
        ) : checkingAllowance ? (
          <Dots>Checking Allowance</Dots>
        ) : approvalState === APPROVAL_STATE.NOT_APPROVED ? (
          'Approve'
        ) : approvalState === APPROVAL_STATE.PENDING ? (
          <Dots>Approving</Dots>
        ) : (
          'Swap'
        )}
      </Button>

      <PoweredBy>
        Powered By
        <KyberSwapLogo />
      </PoweredBy>
    </Wrapper>
  )
}

export default function SwapWidget({
  provider,
  tokenList,
  theme,
  defaultTokenIn,
  defaultTokenOut,
  feeSetting,
  client,
  onTxSubmit,
  enableRoute = true,
  enableDexes,
}: WidgetProps) {
  return (
    <StrictMode>
      <ThemeProvider theme={theme || defaultTheme}>
        <Web3Provider provider={provider}>
          <TokenListProvider tokenList={tokenList}>
            <Widget
              defaultTokenIn={defaultTokenIn}
              defaultTokenOut={defaultTokenOut}
              feeSetting={feeSetting}
              client={client}
              onTxSubmit={onTxSubmit}
              enableRoute={enableRoute}
              enableDexes={enableDexes}
            />
          </TokenListProvider>
        </Web3Provider>
      </ThemeProvider>
    </StrictMode>
  )
}

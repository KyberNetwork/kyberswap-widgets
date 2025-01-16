import { createContext, ReactNode, useContext } from 'react'
import { DefaultRpcUrl } from '../constants'

const Web3Context = createContext<{
  chainId: number
  connectedAccount: {
    address?: string
    chainId: number
  }
  rpcUrl: string
} | null>(null)

export const Web3Provider = ({
  children,
  chainId,
  connectedAccount,
  rpcUrl,
}: {
  chainId: number
  connectedAccount: {
    address?: string
    chainId: number
  }
  rpcUrl?: string
  children: ReactNode
}) => {
  const defaultRpcUrl = DefaultRpcUrl[chainId]
  return (
    <Web3Context.Provider value={{ chainId, connectedAccount, rpcUrl: rpcUrl || defaultRpcUrl }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useActiveWeb3 = () => {
  return (
    useContext(Web3Context) || {
      chainId: 1,
      connectedAccount: { address: undefined, chainId: 1 },
      rpcUrl: DefaultRpcUrl[1],
    }
  )
}

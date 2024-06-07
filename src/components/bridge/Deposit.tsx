import { useState } from 'react'
import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem'
import { walletActionsL1, publicActionsL2, getL2TransactionHashes } from 'viem/op-stack'
import { mainnet } from 'viem/chains'
import { L2Chain } from '../../config/chain'

// TODO
// Retrieve Account from an EIP-1193 Provider. 
const [account] = await window.ethereum.request({ 
  method: 'eth_requestAccounts' 
}) 
 
const publicClientL1 = createPublicClient({
  chain: mainnet,
  transport: http()
})
 
const walletClientL1 = createWalletClient({
  account,
  chain: mainnet,
  transport: custom(window.ethereum)
}).extend(walletActionsL1())
 
const publicClientL2 = createPublicClient({
  chain: L2Chain,
  transport: http()
}).extend(publicActionsL2())

export function Deposit(eth: string, address: string) {

  // Build parameters for the transaction on the L2.
  const args = await publicClientL2.buildDepositTransaction({
    mint: parseEther(eth),
    // it address is empty, use account.address
    to: address || account.address,
  })

  const [hash, setHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
 
  const deposit = async () => {
    try {
      setLoading(true)
      const hash = await walletClientL1.depositTransaction({
        account,
        request: args.request,
        targetChain: optimism,
      })
      setHash(hash)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div>
      <button onClick={deposit} disabled={loading}>
        Deposit
      </button>
      {loading && <p>Loading...</p>}
      {hash && <p>Transaction Hash: {hash}</p>}
      {error && <p>Error: {error}</p>}
    </div>
  )
}
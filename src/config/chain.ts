import { defineChain } from 'viem'
import { chainConfig } from 'viem/op-stack'
import optimism from 'viem/chains'

const sourceId = process.env.REACT_APP_L1_CHAIN_ID

export const L2Chain = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: process.env.REACT_APP_L2_CHAIN_ID,
  name: process.env.REACT_APP_L2_NETWORK_NAME,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.REACT_APP_L2_RPC_URL],
      webSocket: [process.env.REACT_APP_L2_WS_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: process.env.REACT_APP_L2_EXPLORER_URL,
      apiUrl: process.env.REACT_APP_L2_EXPLORER_API_URL,
    },
  },
  contracts: {
    ...chainConfig.contracts,
    l2OutputOracle: {
      [sourceId]: {
        address: process.env.REACT_APP_L2_OUTPUT_ORACLE_PROXY,
      },
    },
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 0,
    },
    portal: {
      [sourceId]: {
        address: process.env.REACT_APP_OPTIMISM_PORTAL_PROXY,
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: process.env.REACT_APP_L1_STANDARD_BRIDGE_PROXY,
      },
    },
  },
  testnet: process.env.REACT_APP_L1_CHAIN_ID !== '1', // only support l1 ethereum
  sourceId,
})

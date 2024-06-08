const { defineChain } = require('viem');
const { chainConfig } = require('viem/op-stack');
const { holesky, mainnet, sepolia, baseSepolia } = require('viem/chains');

const l1SourceId = process.env.REACT_APP_L1_CHAIN_ID;

function GetL1Chain() {
  switch (l1SourceId) {
    case '1':
      return mainnet;
    case '11155111':
      return sepolia;
    case '17000':
      return holesky;
    default:
      // return not support error
      throw new Error('Unsupported L1 chain Id : ' + l1SourceId);
  }
}


function GetL2Chain() {
  return baseSepolia;
}


function GetL2Chaintmp() {
  return defineChain({
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
        [l1SourceId]: {
          address: process.env.REACT_APP_L2_OUTPUT_ORACLE_PROXY,
        },
      },
      multicall3: {
        address: '0xcA11bde05977b3631167028862bE2a173976CA11',
        blockCreated: 0,
      },
      portal: {
        [l1SourceId]: {
          address: process.env.REACT_APP_OPTIMISM_PORTAL_PROXY,
        },
      },
      l1StandardBridge: {
        [l1SourceId]: {
          address: process.env.REACT_APP_L1_STANDARD_BRIDGE_PROXY,
        },
      },
    },
    testnet: process.env.REACT_APP_L1_CHAIN_ID !== '1', // only support l1 ethereum
    sourceId: l1SourceId,
  });
}

module.exports = {
  GetL1Chain,
  GetL2Chain,
};

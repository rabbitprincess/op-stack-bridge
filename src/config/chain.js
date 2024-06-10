import { defineChain } from 'viem';
import { chainConfig } from 'viem/op-stack';
import { holesky, mainnet, sepolia, base, baseGoerli, baseSepolia, metalL2, optimism, optimismGoerli, rss3, rss3Sepolia, zora, zoraSepolia, zoraTestnet, optimismSepolia } from 'viem/chains';

export function GetL1Chain() {
	switch (process.env.REACT_APP_L1_CHAIN_ID) {
		case '1':
			return mainnet;
		case '11155111':
			return sepolia;
		case '17000':
			return holesky;
		default:
			// return not support error
			throw new Error('Unsupported L1 chain Id : ' + process.env.REACT_APP_L1_CHAIN_ID);
	}
}

export function GetL2Chain() {
	switch (process.env.REACT_APP_L2_CHAIN_ID) {
		case '8453':
			return base;
		case '84531':
			return baseGoerli;
		case '84532':
			return baseSepolia;
		case '1750':
			return metalL2;
		case '10':
			return optimism;
		case '420':
			return optimismGoerli;
		case '11155420':
			return optimismSepolia;
		case '12553':
			return rss3;
		case '2331':
			return rss3Sepolia;
		case '7777777':
			return zora;
		case '999999999':
			return zoraSepolia;
		case '999':
			return zoraTestnet;
		case undefined:
			throw new Error('L2 chain Id is not defined');
		default:
			return defineChain({
				...chainConfig,
				id: Number(process.env.REACT_APP_L2_CHAIN_ID),
				name: process.env.REACT_APP_L2_NETWORK_NAME,
				nativeCurrency: { name: 'ETHEREUM', symbol: 'ETH', decimals: 18 },
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
						[process.env.REACT_APP_L1_CHAIN_ID]: {
							address: process.env.REACT_APP_L2_OUTPUT_ORACLE_PROXY,
						},
					},
					multicall3: {
						address: '0xcA11bde05977b3631167028862bE2a173976CA11',
						blockCreated: 0,
					},
					portal: {
						[process.env.REACT_APP_L1_CHAIN_ID]: {
							address: process.env.REACT_APP_OPTIMISM_PORTAL_PROXY,
						},
					},
					l1StandardBridge: {
						[process.env.REACT_APP_L1_CHAIN_ID]: {
							address: process.env.REACT_APP_L1_STANDARD_BRIDGE_PROXY,
						},
					},
				},
				testnet: process.env.REACT_APP_L1_CHAIN_ID !== '1', // only support l1 ethereum
				sourceId: process.env.REACT_APP_L1_CHAIN_ID,
			});
	}
}

import { Chain } from 'viem';

/**
 * Multi-chain configuration for Swarm Accelerator
 * 
 * Primary: Base (Coinbase L2)
 * Supported: Optimism, Arbitrum, Ethereum Mainnet
 * Future: Polygon, Avalanche, BSC
 */

export const base: Chain = {
  id: 8453,
  name: 'Base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.base.org'],
      webSocket: ['wss://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
      webSocket: ['wss://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 5022,
    },
  },
  testnet: false,
};

export const baseSepolia: Chain = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
    public: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
};

export const optimism: Chain = {
  id: 10,
  name: 'Optimism',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.optimism.io'],
    },
    public: {
      http: ['https://mainnet.optimism.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Optimism Explorer',
      url: 'https://optimistic.etherscan.io',
    },
  },
  testnet: false,
};

export const arbitrum: Chain = {
  id: 42161,
  name: 'Arbitrum One',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  },
  testnet: false,
};

// Contract addresses for each chain
export const SWARM_CONTRACTS = {
  // Base (Primary)
  8453: {
    swarmAccelerator: '0x...', // Deploy address
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Native USDC on Base
    usdt: '0x...', // USDT on Base (if available)
  },
  // Base Sepolia (Testnet)
  84532: {
    swarmAccelerator: '0x...', // Deploy to testnet first
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Test USDC
  },
  // Optimism
  10: {
    swarmAccelerator: '0x...', // Future deployment
    usdc: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC on Optimism
  },
  // Arbitrum
  42161: {
    swarmAccelerator: '0x...', // Future deployment
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  },
} as const;

// Get contract address for current chain
export function getContractAddress(
  chainId: number,
  contract: 'swarmAccelerator' | 'usdc' | 'usdt'
): string | undefined {
  const contracts = SWARM_CONTRACTS[chainId as keyof typeof SWARM_CONTRACTS];
  return contracts?.[contract as keyof typeof contracts];
}

// Supported chains for the platform
export const SUPPORTED_CHAINS = [
  base,
  baseSepolia, // For testing
  optimism,
  arbitrum,
];

// Primary chain (Base)
export const PRIMARY_CHAIN = base;

// Get chain by ID
export function getChainById(chainId: number): Chain | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
}

// Check if chain is supported
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.some(chain => chain.id === chainId);
}

// Get explorer URL for transaction
export function getExplorerUrl(chainId: number, txHash: string): string {
  const chain = getChainById(chainId);
  return `${chain?.blockExplorers?.default.url}/tx/${txHash}`;
}

// Get explorer URL for address
export function getAddressExplorerUrl(chainId: number, address: string): string {
  const chain = getChainById(chainId);
  return `${chain?.blockExplorers?.default.url}/address/${address}`;
}

// Stablecoin information
export const STABLECOINS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      8453: SWARM_CONTRACTS[8453].usdc,
      84532: SWARM_CONTRACTS[84532].usdc,
      10: SWARM_CONTRACTS[10].usdc,
      42161: SWARM_CONTRACTS[42161].usdc,
    },
  },
} as const;

// Get stablecoin address for chain
export function getStablecoinAddress(
  stablecoin: keyof typeof STABLECOINS,
  chainId: number
): string | undefined {
  return STABLECOINS[stablecoin].addresses[chainId as keyof typeof STABLECOINS.USDC.addresses];
}

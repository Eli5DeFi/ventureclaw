# ⛓️ Blockchain Integration - Base & Multi-Chain

## Overview

Swarm Accelerator V2 is **blockchain-first**, built on **Base (Coinbase L2)** with multi-chain expansion roadmap.

### Why Blockchain?

1. **Transparency** - All funding decisions on-chain
2. **Trustless** - Smart contracts eliminate intermediaries
3. **Global** - Accessible worldwide, 24/7
4. **Stablecoin Native** - Reduce forex risk, instant settlement
5. **Futarchy** - Prediction markets for better governance

---

## Primary Chain: Base

**Base** is Coinbase's Layer 2 built on Optimism's OP Stack.

### Why Base?

✅ **Low Fees** - $0.01-0.10 per transaction (vs $5-50 on Ethereum)  
✅ **Fast** - 2-second block times  
✅ **Secure** - Inherits Ethereum's security  
✅ **Coinbase Integration** - Easy onramp for users  
✅ **Growing Ecosystem** - 1000+ dApps, $2B+ TVL  
✅ **Developer Friendly** - EVM compatible, great tooling  

### Base Network Details

- **Chain ID:** 8453
- **RPC:** https://mainnet.base.org
- **Block Explorer:** https://basescan.org
- **Native Token:** ETH (for gas)
- **Stablecoins:** Native USDC (Circle), Bridged USDT

---

## Smart Contract Architecture

### SwarmAcceleratorV2.sol

**Location:** `/contracts/SwarmAcceleratorV2.sol`

**Features:**
- Multi-stablecoin support (USDC, USDT, DAI)
- Role-based access control (Agent, Admin, User)
- Futarchy prediction markets
- Anti-sybil mechanisms
- Refunds if soft cap not reached
- Platform fee (2.5%) automation

**Key Functions:**

```solidity
// Register startup (called by AI agents)
function registerStartup(
  string memory _id,
  address _founder,
  uint256 _fundingGoal,
  uint256 _softCap,
  uint256 _hardCap,
  uint256 _duration
) external onlyRole(AGENT_ROLE);

// Update agent score (AI analysis result)
function updateAgentScore(
  string memory _id,
  uint8 _score
) external onlyRole(AGENT_ROLE);

// Contribute to startup
function contribute(
  string memory _id,
  address _stablecoin,
  uint256 _amount
) external nonReentrant;

// Buy futarchy shares (YES/NO prediction)
function buyPredictionShares(
  string memory _id,
  bool _yes,
  uint256 _amount,
  address _stablecoin
) external;

// Resolve futarchy (called by agents)
function resolveFutarchy(
  string memory _id,
  bool _outcome
) external onlyRole(AGENT_ROLE);

// Release funds to founder
function releaseFunds(
  string memory _id,
  address _stablecoin
) external;

// Refund if soft cap not reached
function refund(
  string memory _id,
  address _stablecoin
) external;
```

---

## Futarchy: Prediction Market Governance

### How It Works

**Futarchy** = "Vote on values, bet on beliefs"

Instead of voting directly on funding decisions, participants bet on outcomes:

1. **Create Market:** For each startup, create YES/NO market
2. **Participants Bet:** Buy YES shares if you think funding will succeed
3. **Market Prices:** Reflect collective wisdom about success probability
4. **AI Decides:** Agents factor in market signals
5. **Resolve:** Winners claim rewards, losers lose stake

### Example

**Startup:** AI-powered healthcare platform  
**Funding Ask:** $2M

**Market:**
- YES Pool: $50,000 (80 participants)
- NO Pool: $20,000 (25 participants)
- **Implied Probability:** 71% chance of success

**Outcome:**
- If funded & successful: YES holders profit
- If funded & failed: NO holders profit
- Market price influences AI decision

### Benefits

- **Wisdom of Crowds:** Aggregate diverse opinions
- **Skin in the Game:** Participants have financial stake
- **Information Discovery:** Market reveals hidden info
- **Objective:** No politics, just economics

---

## Multi-Chain Strategy

### Current Support

| Chain | Status | Use Case |
|-------|--------|----------|
| **Base** | ✅ Live | Primary deployment |
| **Base Sepolia** | ✅ Testnet | Development & testing |
| **Optimism** | 🔜 Q2 2026 | Expanded reach |
| **Arbitrum** | 🔜 Q2 2026 | More users |
| **Ethereum** | 🔜 Q3 2026 | High-value deals |

### Why Multi-Chain?

1. **User Choice:** Not everyone is on Base
2. **Liquidity:** Access more capital across chains
3. **Resilience:** No single point of failure
4. **Ecosystem:** Tap into different communities

### Cross-Chain Architecture

```
                    [Off-Chain Backend]
                            |
          +-----------------+-----------------+
          |                 |                 |
     [Base Chain]    [Optimism Chain]  [Arbitrum Chain]
          |                 |                 |
    SwarmAccelerator   SwarmAccelerator   SwarmAccelerator
          |                 |                 |
     Native USDC        Bridged USDC       Native USDC
```

**Data Flow:**
1. User selects chain
2. Backend routes to appropriate contract
3. Contract emits events
4. Backend syncs state across all chains
5. UI shows unified view

---

## Stablecoin Integration

### Supported Stablecoins

**USDC (Primary)**
- Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Native)
- Optimism: `0x7F5c764cBc14f9669B88837ca1490cCa17c31607`
- Arbitrum: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

**USDT (Future)**
- Base: TBD
- Ethereum: `0xdAC17F958D2ee523a2206206994597C13D831ec7`

**DAI (Future)**
- Ethereum: `0x6B175474E89094C44Da98b954EedeAC495271d0F`

### Why Stablecoins?

- **Price Stability:** $1.00 = $1.00 (no crypto volatility)
- **Global Access:** Works anywhere
- **Instant Settlement:** No bank delays
- **Compliance:** Audited reserves, regulatory clarity
- **Familiar:** Everyone understands dollars

---

## Wallet Integration

### RainbowKit + Wagmi

```typescript
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { base, baseSepolia } from '@/lib/web3/chains';

const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

function App() {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={[base, baseSepolia]}>
        <YourApp />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

### Supported Wallets

- **Coinbase Wallet** (Best for Base)
- **MetaMask**
- **WalletConnect**
- **Rainbow Wallet**
- **Ledger** (hardware)

---

## Security Measures

### Smart Contract Security

1. **Access Control**
   - Role-based permissions (Admin, Agent, User)
   - Multi-sig for admin actions
   - Timelock for critical changes

2. **Re-entrancy Protection**
   - OpenZeppelin's `ReentrancyGuard`
   - Checks-Effects-Interactions pattern

3. **Pausable**
   - Emergency stop mechanism
   - Only admins can pause/unpause

4. **Audits**
   - Pre-launch: Self-audit
   - Post-launch: Professional audit (Quantstamp, Trail of Bits)
   - Bug bounty program

### On-Chain Anti-Sybil

**Problem:** Users could create multiple accounts to game the system.

**Solutions:**

1. **Contributor Profiles**
   ```solidity
   struct ContributorProfile {
     uint256 totalContributions;
     uint256 successfulInvestments;
     uint256 reputationScore;
     bool verified;
   }
   ```

2. **Reputation System**
   - Earn points for successful investments
   - Lose points for failed bets
   - Higher reputation = more influence

3. **Verification (Future)**
   - WorldID (Worldcoin) - Proof of personhood
   - Gitcoin Passport - Sybil resistance
   - PoH (Proof of Humanity)

4. **Rate Limiting**
   - Max contributions per address
   - Cooldown between contributions
   - Contribution velocity checks

---

## Deployment Guide

### 1. Deploy to Base Sepolia (Testnet)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile contracts
cd contracts
forge build

# Deploy to Base Sepolia
forge create --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  SwarmAcceleratorV2

# Verify on BaseScan
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.20 \
  $CONTRACT_ADDRESS \
  SwarmAcceleratorV2
```

### 2. Test on Testnet

```bash
# Add test USDC
# Get from Base Sepolia faucet

# Test contribution
cast send $CONTRACT_ADDRESS \
  "contribute(string,address,uint256)" \
  "test-startup-1" \
  $USDC_ADDRESS \
  1000000 \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

### 3. Deploy to Base Mainnet

```bash
# Deploy
forge create --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --verify \
  SwarmAcceleratorV2

# Configure
cast send $CONTRACT_ADDRESS \
  "addStablecoin(address)" \
  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \ # USDC
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY

# Grant agent role
cast send $CONTRACT_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "AGENT_ROLE()") \
  $AGENT_ADDRESS \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY
```

### 4. Frontend Integration

```typescript
// In your component
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { SWARM_CONTRACTS } from '@/lib/web3/chains';

function ContributeButton({ startupId, amount }) {
  const { write, data } = useContractWrite({
    address: SWARM_CONTRACTS[8453].swarmAccelerator,
    abi: SWARM_ABI,
    functionName: 'contribute',
    args: [startupId, SWARM_CONTRACTS[8453].usdc, amount],
  });
  
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });
  
  return (
    <button onClick={() => write()}>
      {isLoading ? 'Contributing...' : 'Contribute'}
    </button>
  );
}
```

---

## Gas Optimization

### Current Costs (Base Mainnet)

| Action | Gas | Cost @ 0.05 gwei |
|--------|-----|------------------|
| Register Startup | ~150k | $0.01 |
| Update Score | ~50k | $0.003 |
| Contribute | ~80k | $0.005 |
| Buy Prediction | ~100k | $0.007 |
| Release Funds | ~120k | $0.008 |

**Total cost for full flow:** ~$0.05 (vs $50+ on Ethereum)

### Optimization Techniques

1. **Pack Variables:** Use `uint8` instead of `uint256` where possible
2. **Minimize Storage:** Store off-chain, reference on-chain
3. **Batch Operations:** Group multiple actions
4. **Events Over Storage:** Emit events instead of storing data

---

## Roadmap

### Q1 2026 (Current)
- ✅ Smart contract development
- ✅ Base deployment (testnet)
- 🔄 Frontend integration
- 🔄 Mainnet deployment

### Q2 2026
- Deploy to Optimism
- Deploy to Arbitrum
- Cross-chain messaging (Layerzero)
- Enhanced futarchy features

### Q3 2026
- Ethereum mainnet (high-value deals)
- Token launch ($SWARM)
- DAO governance
- Cross-chain liquidity pools

### Q4 2026
- Polygon, Avalanche, BSC
- Multi-chain aggregation
- Intent-based UX (users don't choose chain)
- Full decentralization

---

## FAQ

**Q: Why not just Ethereum mainnet?**  
A: Too expensive. $50 gas fees kill the UX for small contributions.

**Q: Is Base secure?**  
A: Yes. It inherits Ethereum's security and has been battle-tested with $2B+ TVL.

**Q: What if Base goes down?**  
A: Multi-chain strategy ensures redundancy. We can route to other L2s.

**Q: Can I contribute from any chain?**  
A: Future: Yes, via cross-chain bridges. Currently: Base only.

**Q: Are smart contracts audited?**  
A: Pre-launch self-audit. Professional audit post-MVP.

**Q: What about EIP-4337 (Account Abstraction)?**  
A: Future feature. Will enable gas-less transactions and social recovery.

---

**Built for the multi-chain future, starting with Base.** ⛓️

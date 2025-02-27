# DairyChain 📖⛓️

A blockchain-based diary platform that incentivizes consistent journaling through smart contract staking mechanics. Users stake ETH to maintain their diary commitment and can withdraw their stake by maintaining regular entries.

## 🌟 Features

### Core Functionality
- **Stake to Write**: Users must stake 0.1 ETH to start writing diary entries
- **Time-Based Withdrawals**: Stake can be withdrawn after 7 days with proper diary maintenance
- **Decentralized Storage**: All diary entries are stored on-chain with timestamps
- **User Isolation**: Each user's diary entries are private and separate

### Smart Contract Mechanics
- **Required Stake**: Exactly 0.1 ETH to activate diary writing
- **Diary Interval**: 7-day commitment periods
- **Withdrawal Rules**:
  - After 7 days without any diary entries: ✅ Can withdraw
  - Within 7 days of writing an entry: ✅ Can withdraw  
  - After 7 days since last entry: ❌ Cannot withdraw (stake lost)

## 🏗️ Architecture

### Smart Contract: `TimeStringStorage.sol`

**Key Structures:**
```solidity
struct Record {
    uint256 timestamp;
    string data;
}

struct StakeInfo {
    uint256 amount;
    uint256 stakeTimestamp;
    uint256 lastDiaryTimestamp;
    bool isActive;
}
```

**Core Functions:**
- `stake()` - Stake 0.1 ETH to enable diary writing
- `storeRecord(string data)` - Store a diary entry with timestamp
- `withdraw()` - Withdraw stake if conditions are met
- `canWithdraw(address user)` - Check if user can withdraw
- `timeUntilWithdrawal(address user)` - Time remaining until withdrawal window
- `getStakeInfo(address user)` - Get user's staking information
- `getRecords()` - Retrieve all user's diary entries
- `getRecord(uint256 index)` - Get specific diary entry by index

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- npm or yarn
- MetaMask or other Web3 wallet

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/apeland8/dairychain.git
cd dairychain
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file:
```env
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
PRIVATE_KEY=your-private-key
ETHERSCAN_API_KEY=your-etherscan-api-key
```

### Compilation

```bash
npm run compile
```

### Testing

Run the complete test suite:
```bash
npm test
```

The test suite covers:
- ✅ Basic diary entry storage and retrieval
- ✅ Staking mechanics and validation
- ✅ Withdrawal conditions and timing
- ✅ Time-based calculations
- ✅ User separation and privacy
- ✅ Edge cases and error handling

## 📦 Deployment

### Local Development
```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
npm run deploy:localhost
```

### Testnet Deployment
```bash
npm run deploy:sepolia
```

### Mainnet Deployment
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## 🎯 Usage Examples

### 1. Stake ETH to Start Journaling
```javascript
const stakeAmount = ethers.utils.parseEther("0.1");
await contract.stake({ value: stakeAmount });
```

### 2. Write a Diary Entry
```javascript
await contract.storeRecord("Today I learned about blockchain development...");
```

### 3. Check Withdrawal Status
```javascript
const canWithdraw = await contract.canWithdraw(userAddress);
const timeUntil = await contract.timeUntilWithdrawal(userAddress);
```

### 4. Withdraw Stake
```javascript
if (await contract.canWithdraw(userAddress)) {
    await contract.withdraw();
}
```

### 5. Retrieve Diary Entries
```javascript
const allEntries = await contract.getRecords();
const entryCount = await contract.getRecordCount();
const specificEntry = await contract.getRecord(0);
```

## 🔧 Technical Details

### Gas Optimization
- Efficient storage patterns using mappings
- Minimal on-chain computation
- Optimized data structures

### Security Features
- Reentrancy protection through state changes before external calls
- Input validation on all public functions
- Proper access controls for user data

### Time Management
- Block timestamp-based calculations
- 7-day intervals (604,800 seconds)
- Precise withdrawal window logic

## 🧪 Testing Strategy

### Test Coverage Includes:
- **Staking Tests**: Correct amounts, double staking prevention, stake requirements
- **Storage Tests**: Entry creation, timestamp validation, data integrity  
- **Withdrawal Tests**: Time-based conditions, balance updates, state changes
- **Time Calculation Tests**: Withdrawal windows, interval calculations
- **User Separation Tests**: Data privacy, isolated user states
- **Edge Cases**: Invalid inputs, boundary conditions, error states

### Running Specific Tests:
```bash
# Run with gas reporting
npx hardhat test --reporter gas

# Run specific test file
npx hardhat test test/TimeStringStorage.test.js
```

## 📊 Contract Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `REQUIRED_STAKE` | 0.1 ETH | Mandatory stake amount |
| `DIARY_INTERVAL` | 7 days | Commitment period length |

## 🔮 Future Enhancements

- **Frontend Interface**: Web3 React application
- **IPFS Integration**: Off-chain storage for longer entries
- **NFT Rewards**: Achievement tokens for consistent journaling
- **Social Features**: Anonymous entry sharing
- **Multiple Stakes**: Support for multiple concurrent commitments

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with full test coverage
4. Submit a pull request

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Never stake more than you can afford to lose.
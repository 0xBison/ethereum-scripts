# Ethereum Account Manager

A TypeScript utility to manage multiple Ethereum accounts, check their balances, view last transactions, and transfer funds to a master account.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Set your Ethereum RPC URL (e.g., from Alchemy or Infura)
- Set your master account address

## Usage

1. Create a script similar to `src/account-manager/example.ts` with your private keys:
```typescript
import { main } from './index';

const privateKeys = [
    'your_private_key_1',
    'your_private_key_2'
];

main(privateKeys).catch(console.error);
```

2. Run the script:
```bash
npx ts-node src/account-manager/example.ts
```

The script will:
1. Display balance and last transaction for each account
2. Ask for confirmation before transferring funds
3. If confirmed, transfer all funds (minus gas costs) to the master account
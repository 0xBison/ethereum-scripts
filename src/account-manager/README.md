# Ethereum Account Manager

A TypeScript utility to manage multiple Ethereum accounts, check their balances, view last transactions, and transfer funds to a master account.

## Setup

1 Install dependencies:

```bash
npm install
```

2 Configure environment variables:

- Copy `.env.example` to `.env`
- Set your Alchemy RPC URL, Alchemy key and other variables

## Usage

```bash
ts-node src/account-manager/index.ts
```

The script will:

1. Display balance and last transaction for each account
2. Ask for confirmation before transferring funds
3. If confirmed, transfer all funds (minus gas costs) to the master account

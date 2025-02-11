import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { formatEther } from "ethers";
import chalk from "chalk";
import {
  Alchemy,
  AssetTransfersCategory,
  AssetTransfersResult,
  Network,
  SortingOrder,
} from "alchemy-sdk";
import { printTable } from "console-table-printer";
import { sleep } from "../utils";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;

if (!MASTER_ADDRESS) {
  throw new Error("Master address not configured in .env file");
}

interface AccountInfo {
  address: string;
  balance: string;
  transfers: AssetTransfersResult[];
}

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

async function getAccountTransactions(address: string) {
  const data = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    fromAddress: address,
    category: [
      AssetTransfersCategory.EXTERNAL,
      AssetTransfersCategory.ERC20,
      AssetTransfersCategory.ERC721,
      AssetTransfersCategory.ERC1155,
    ],
    order: SortingOrder.DESCENDING,
  });

  return data;
}

async function getAccountInfo(privateKey: string): Promise<AccountInfo> {
  const wallet = new ethers.Wallet(privateKey, provider);
  const address = wallet.address;

  console.log(chalk.blue(`Address: ${address}`));

  const balance = await provider.getBalance(address);
  await sleep(500);

  console.log(chalk.blue(`Balance: ${balance}`));

  const txCount = await provider.getTransactionCount(address);
  await sleep(500);

  console.log(chalk.blue(`Transaction count: ${txCount}`));

  let transfers: AssetTransfersResult[] = [];

  if (txCount > 0) {
    const transactions = await getAccountTransactions(address);

    // this should always be true since we check the tx count above
    // but just in case since its from 2 diff sources
    if (transactions.transfers.length > 0) {
      transfers = transactions.transfers;
    }
  }

  return {
    address,
    balance: formatEther(balance),
    transfers,
  };
}

async function transferToMaster(privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);

  // Calculate gas price and gas limit
  const feeData = await provider.getFeeData();
  const gasLimit = BigInt(21000); // Standard ETH transfer gas limit
  const gasCost = gasLimit * (feeData.gasPrice ?? BigInt(0));

  // Calculate amount to send (balance - gas cost)
  const amountToSend = balance - gasCost;

  if (amountToSend <= BigInt(0)) {
    throw new Error("Insufficient balance to cover gas costs");
  }

  // Send transaction
  const tx = await wallet.sendTransaction({
    to: MASTER_ADDRESS,
    value: amountToSend,
    gasLimit,
  });

  return tx.hash;
}

async function main(privateKeys: string[]) {
  console.log(chalk.blue.bold("Fetching account information...\n"));

  // Get and display account information
  for (const privateKey of privateKeys) {
    try {
      const info = await getAccountInfo(privateKey);
      console.log(chalk.cyan(`Address: ${info.address}`));
      console.log(chalk.green(`Balance: ${info.balance} ETH`));

      printTable(
        info.transfers.map((transfer) => ({
          //convert blockNum from hex to decimal
          block: parseInt(transfer.blockNum, 16),
          hash: transfer.hash,
          // pretty print 18 decimals
          value: transfer.value?.toFixed(18),
          asset: transfer.asset,
        }))
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          chalk.red(`Error processing account: ${error.message}\n`)
        );
      } else {
        console.error(
          chalk.red("An unknown error occurred while processing account\n")
        );
      }
    }
    await sleep(1000); // Add delay between processing each account
  }

  // Ask for confirmation before transferring funds
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(
    chalk.blue(
      "Do you want to transfer all funds to the master account? (yes/no) "
    ),
    async (answer: string) => {
      if (answer.toLowerCase() === "yes") {
        console.log(chalk.blue("\nTransferring funds..."));
        for (const privateKey of privateKeys) {
          try {
            const txHash = await transferToMaster(privateKey);
            const address = new ethers.Wallet(privateKey).address;
            console.log(
              chalk.green(`Transfer successful for account ${address}`)
            );
            console.log(chalk.green(`Transaction hash: ${txHash}`));
            await sleep(2000); // Add longer delay between transfers
          } catch (error) {
            if (error instanceof Error) {
              console.error(
                chalk.red(`Error transferring funds: ${error.message}\n`)
              );
            } else {
              console.error(
                chalk.red(
                  "An unknown error occurred while transferring funds\n"
                )
              );
            }
          }
        }
      }
      readline.close();
      process.exit(0);
    }
  );
}

// Example usage:
// const privateKeys = [
//     'your_private_key_1',
//     'your_private_key_2'
// ];
// main(privateKeys);

export { main };

import { ethers } from "ethers";
import { formatEther } from "ethers";
import chalk from "chalk";
import {
  Alchemy,
  AssetTransfersCategory,
  AssetTransfersResult,
  SortingOrder,
} from "alchemy-sdk";
import { sleep } from "../utils";
import { environmentVariables } from "./validate";
import { AccountInfo } from "./types";

const provider = new ethers.JsonRpcProvider(environmentVariables.alchemyRpcUrl);
const alchemy = new Alchemy({ apiKey: environmentVariables.alchemyApiKey });

export async function getAccountTransactions(address: string) {
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

  console.log("tx", JSON.stringify(data));

  return data;
}

export async function getAccountInfo(
  privateKey: string,
  {
    suppressLogs = false,
    sleepTime = 0,
  }: { suppressLogs?: boolean; sleepTime?: number } = {}
): Promise<AccountInfo> {
  const wallet = new ethers.Wallet(privateKey, provider);
  const address = wallet.address;

  if (!suppressLogs) {
    console.log(chalk.blue(`Address: ${address}`));
  }

  const balance = await provider.getBalance(address);
  await sleep(sleepTime);

  if (!suppressLogs) {
    console.log(chalk.blue(`Balance: ${balance}`));
  }

  const txCount = await provider.getTransactionCount(address);
  await sleep(sleepTime);

  if (!suppressLogs) {
    console.log(chalk.blue(`Transaction count: ${txCount}`));
  }

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

export async function transferTo(
  fromPrivateKey: string,
  toAddress: string
): Promise<string> {
  const wallet = new ethers.Wallet(fromPrivateKey, provider);
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
    to: toAddress,
    value: amountToSend,
    gasLimit,
  });

  return tx.hash;
}

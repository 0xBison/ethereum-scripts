import { ethers } from "ethers";
import chalk from "chalk";
import { printTable } from "console-table-printer";
import { sleep } from "../utils";
import { environmentVariables } from "./validate";
import { getAccountInfo, transferTo } from "./account";

async function fetchAndDisplayAccountInfo(privateKey: string) {
  const info = await getAccountInfo(privateKey);
  console.log(chalk.cyan(`Address: ${info.address}`));
  console.log(chalk.green(`Balance: ${info.balance} ETH`));

  displayTransfers(info.transfers);
}

function displayTransfers(transfers: any[]) {
  if (transfers.length > 0) {
    printTable(
      transfers.map((transfer) => ({
        // convert blockNum from hex to decimal
        block: parseInt(transfer.blockNum, 16),
        hash: transfer.hash,
        value: transfer.value?.toFixed(18),
        asset: transfer.asset,
      }))
    );
  } else {
    console.log(chalk.red("Account has no transfers\n"));
  }
}

async function transferFunds(privateKey: string) {
  const txHash = await transferTo(
    privateKey,
    environmentVariables.masterAddress
  );
  const address = new ethers.Wallet(privateKey).address;
  console.log(chalk.green(`Transfer successful for account ${address}`));
  console.log(chalk.green(`Transaction hash: ${txHash}`));
  await sleep(environmentVariables.sleep);
}

async function confirmAndTransferFunds(privateKeys: string[]) {
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
          await transferFunds(privateKey);
        }
      }
      readline.close();
      process.exit(0);
    }
  );
}

async function main() {
  console.log(chalk.blue.bold("Fetching account information...\n"));

  for (const privateKey of environmentVariables.privateKeys) {
    await fetchAndDisplayAccountInfo(privateKey);
    await sleep(1000); // Add delay between processing each account
  }

  await confirmAndTransferFunds(environmentVariables.privateKeys);
}

main();

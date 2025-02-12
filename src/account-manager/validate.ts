import * as dotenv from "dotenv";
dotenv.config();

import {
  validateOrReject,
  IsEthereumAddress,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  ArrayMinSize,
  IsArray,
  IsUrl,
} from "class-validator";
import { Network } from "alchemy-sdk";

export class EnvironmentVariables {
  @IsEthereumAddress()
  masterAddress: string;

  @IsString()
  alchemyApiKey: string;

  @IsEnum(Network)
  network: Network;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sleep: number;

  @IsArray()
  @ArrayMinSize(1)
  privateKeys: string[];

  @IsUrl()
  alchemyRpcUrl: string;
}

export const environmentVariables = new EnvironmentVariables();
environmentVariables.masterAddress = process.env.MASTER_ADDRESS!;
environmentVariables.alchemyApiKey = process.env.ALCHEMY_API_KEY!;
environmentVariables.network = process.env.NETWORK! as Network;
environmentVariables.sleep = Number(process.env.SLEEP_TIME) || 500; //default 500ms
environmentVariables.alchemyRpcUrl = process.env.ALCHEMY_RPC_URL!;

const privateKeys = process.env.PRIVATE_KEYS;
if (privateKeys) {
  environmentVariables.privateKeys = privateKeys
    .split(",")
    .map((key) => key.trim());
}

validateOrReject(environmentVariables).catch((errors) => {
  console.log("Validation failed. Errors: ", errors);
});

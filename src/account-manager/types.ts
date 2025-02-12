import { AssetTransfersResult } from "alchemy-sdk";

export interface AccountInfo {
  address: string;
  balance: string;
  transfers: AssetTransfersResult[];
}

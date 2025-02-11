import { main } from "./index";

// Replace these with your actual private keys
const privateKeys = [
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", // Example private key 1
  "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210", // Example private key 2
];

main(privateKeys).catch(console.error);

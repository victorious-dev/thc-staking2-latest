
const fs = require('fs');
require('colors');
const { ethers } = require("ethers");
const hre = require("hardhat");



async function main() {

	// npx hardhat verify--network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1" "Constructor argument 2"

	const netId = "BSC"
	const stakeTokenAddress = "0x56083560594e314b5cdd1680ec6a493bb851bbd8";//THC coin address on bsc mainnet
	const marketingWalletAddress = "0x7e214F5f19ef8f3FEC429D6f4cdd205A6681F413";// wallet address of client
	// 0x7e214F5f19ef8f3FEC429D6f4cdd205A6681F413   -> this is your market wallet

	const signer = await hre.ethers.getSigner();
	const network = await signer.provider._networkPromise;
	const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545'; // signer.provider.connection.url;
	const explorer = 'https://testnet.bscscan.com/'; // signer.provider.connection.url;
	const chainId = network.chainId;

	console.log('Starting ' + netId + ('(' + String(chainId).red + ')') + ' by ', signer.address.yellow);
	console.log('Deploying ' + netId + ' Staking contract...'.blue);
	const Staking = await hre.ethers.getContractFactory("TranshumanCoinStaking");
	const _Staking = await Staking.deploy(stakeTokenAddress, marketingWalletAddress);

	console.log('\tStaking' + '\t' + _Staking.address.green);
	console.log('writing network...'.blue);
}

main().then(() => {
}).catch((error) => {
	console.error(error);
	process.exit(1);
});

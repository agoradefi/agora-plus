import hre from "hardhat";
import { numToWei } from "../utils/ethUnitParser";

const CTOKEN_DECIMALS = 8;

// CToken Params
const params = {
  underlying: "0x34F88c1137E6986c7eb864054688311960C2b12b",
  comptroller: "0x92DcecEaF4c0fDA373899FEea00032E8E8Da58Da",
  irModel: "0x32a1bCC329F9bfE72EdAe9bFC4d7B1bE3A9B6a4D",
  name: "apPuff Netswap WETH-METIS",
  symbol: "appuffNetswapWETH-METIS",
  decimals: CTOKEN_DECIMALS,
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`>>>>>>>>>>>> Deployer: ${deployer.address} <<<<<<<<<<<<\n`);

  const erc20Underlying = await hre.ethers.getContractAt("EIP20Interface", params.underlying);
  const underlyingDecimals = await erc20Underlying.decimals();
  const totalDecimals = underlyingDecimals + params.decimals;
  const initialExcRateMantissaStr = numToWei("2", totalDecimals);

  const CErc20Immutable = await hre.ethers.getContractFactory("CErc20Immutable");
  const cErc20Immutable = await CErc20Immutable.deploy(
    params.underlying,
    params.comptroller,
    params.irModel,
    initialExcRateMantissaStr,
    params.name,
    params.symbol,
    params.decimals,
    deployer.address
  );
  await cErc20Immutable.deployed();
  console.log("CErc20Immutable deployed to:", cErc20Immutable.address);

  const unitrollerProxy = await hre.ethers.getContractAt("Comptroller", params.comptroller);

  console.log("calling unitrollerProxy._supportMarket()");
  await unitrollerProxy._supportMarket(cErc20Immutable.address);

  // await cErc20Immutable.deployTransaction.wait(15);
  // await verifyContract(
  //   cErc20Immutable.address,
  //   [
  //     params.underlying,
  //     params.comptroller,
  //     params.irModel,
  //     initialExcRateMantissaStr,
  //     params.name,
  //     params.symbol,
  //     params.decimals,
  //     deployer.address
  //   ]
  // );
}

const verifyContract = async (contractAddress: string, constructorArgs: any) => {
  await hre.run("verify:verify", {
    contract: "contracts/CErc20Immutable.sol:CErc20Immutable",
    address: contractAddress,
    constructorArguments: constructorArgs,
  });
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

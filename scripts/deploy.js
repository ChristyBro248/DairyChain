const hre = require("hardhat");

async function main() {
  console.log("Deploying TimeStringStorage contract...");

  const TimeStringStorage = await hre.ethers.getContractFactory("TimeStringStorage");
  const timeStringStorage = await TimeStringStorage.deploy();

  await timeStringStorage.deployed();

  console.log("TimeStringStorage deployed to:", timeStringStorage.address);
  console.log("Transaction hash:", timeStringStorage.deployTransaction.hash);

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await timeStringStorage.deployTransaction.wait(6);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: timeStringStorage.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("Contract already verified");
      } else {
        console.error("Error verifying contract:", error);
      }
    }
  }

  return timeStringStorage.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
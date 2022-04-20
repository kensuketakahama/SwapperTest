async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());
  
    // We get the contract to deploy
    const Swapper = await ethers.getContractFactory("SwapperTest");
    const swapper = await Swapper.deploy("swapper contracts is deployed");
  
    await swapper.deployed();
  
    console.log("Swapper deployed to:", swapper.address);
    console.log("amountOutMin => ", await swapper.getAmountOutMin(swapper.getExpectedAmountOut(token.balanceOf(swapper.address))));
    console.log("amountOut => ", await swapper.amountOut());
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
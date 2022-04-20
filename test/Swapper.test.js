const { waffle, ethers } = require("hardhat");
const { createFixtureLoader } = require("ethereum-waffle");
const { expect } = require("chai");
const { uniswapFixture } = require("./fixtures.js");
const { BigNumber } = require("ethers");

const toWei = ethers.utils.parseEther;

describe("Swapper", async function () {
    const provider = waffle.provider;
    const [user, lp, deployer, treasury] = provider.getWallets();

    const loadFixture = createFixtureLoader([deployer], provider);

    let swapper;
    let token;
    let weth;
    let router;
    let pair;
    let oracle;

    beforeEach(async function () {
        // Load fixture
        // https://hardhat.org/plugins/nomiclabs-hardhat-waffle.html
        // [UniswapV2 Core: test/shared/fixitures.ts](https://github.com/Uniswap/v2-core/blob/4dd59067c76dea4a0e8e4bfdda41877a6b16dedc/test/shared/fixtures.ts)
        ({ weth, token, router, pair } = await loadFixture(uniswapFixture));

        // Deploy OracleMock and set token price : example 0.01 ETH per token
        const OracleFactory = await ethers.getContractFactory("PriceOracleMock");
        oracle = await OracleFactory.deploy(toWei("0.01"));
        // Deploy SwapperTest
        const Swapper = await ethers.getContractFactory("SwapperTest");
        swapper = await Swapper.connect(deployer).deploy(
            router.address,
            token.address,
            oracle.address,
            treasury.address,
        );
        await swapper.setMaximumSlippageBasisPoints(100);

        await token.mint(deployer.address, toWei("100"));

        // Add liquidity on pair
        await token.mint(pair.address, toWei("10000")); // deposit 10_000 tokens to the pool
        await weth.connect(lp).deposit({ value: toWei("100") }); // mint 100 WETH (= 10_000 tokens * 0.01 eth per token)
        await weth.connect(lp).transfer(pair.address, toWei("100")); // deposit 100 WETH to the pool
        await pair.connect(lp).mint(lp.address); // add liquidity to the Token/WETH pool
    });

    it("succeeds", async function () {
        expect(await swapper.router()).to.be.equal(router.address);
        expect(await swapper.tokenSpent()).to.be.equal(token.address);
        expect(await swapper.oracle()).to.be.equal(oracle.address);
        expect(await swapper.treasury()).to.be.equal(treasury.address);
    });

    it("get amountOutMin", async function () {
        expect(await swapper.getAmountOutMin(toWei("1"))).to.be.equal(toWei("0.99"));
    });

    it("get expected amountOut by using a oracle price", async function () {
        expect(await swapper.getExpectedAmountOut(toWei("1"))).to.be.equal(toWei("0.01")); //1 tokens equal to 0.01WETH
    });

    it("should successfully swap", async function () {
        //console.log("treasury balance at first => ", await provider.getBalance(treasury.address));
        const treasuryBalanceAtFirst = await provider.getBalance(treasury.address);

        await token.connect(deployer).transfer(swapper.address, toWei("10")); //swap 10 ERC20Mock for WETH

        //console.log("amountOutMin => ", await swapper.getAmountOutMin(swapper.getExpectedAmountOut(token.balanceOf(swapper.address))));
        //console.log("amountOut => ", await swapper.amountOut());

        const tx = await swapper.connect(deployer).swap();
        const receipt = await tx.wait();
        const log = receipt.logs;
        const swapLog = await swapper.interface.parseLog(log[log.length - 1]);
        const sellingPrice = swapLog.args.amountOut;

        expect(await provider.getBalance(treasury.address)).to.be.equal(sellingPrice.add(treasuryBalanceAtFirst));
        expect(await weth.balanceOf(swapper.address)).to.be.equal(0);
    });
});
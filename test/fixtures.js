const { ethers } = require("hardhat");
const ROUTER_ARTIFACTS = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const FACTORY_ARTIFACTS = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const PAIR_ARTIFACTS = require("@uniswap/v2-core/build/UniswapV2Pair.json");

const tokenFixture = async () => {
    const [WEthFactory, ERC20MockFactory] = await Promise.all([
        ethers.getContractFactory("WETH"),
        ethers.getContractFactory("ERC20Mock"),
    ]);
    const weth = await WEthFactory.deploy();
    const token = await ERC20MockFactory.deploy("Token", "TOKEN");

    return { weth, token };
};

const uniswapFixture = async ([wallet], provider) => {
    const { weth, token } = await tokenFixture();

    var signer = provider.getSigner();
    // Router、Factory、PairのContractFactoryインスタンスを作成する
    const [RouterFactory, FactoryFactory, PairFactory] = await Promise.all([
        ethers.getContractFactory(ROUTER_ARTIFACTS.abi, ROUTER_ARTIFACTS.bytecode, signer),
        ethers.getContractFactory(FACTORY_ARTIFACTS.abi, FACTORY_ARTIFACTS.bytecode, signer),
        ethers.getContractFactory(PAIR_ARTIFACTS.abi, PAIR_ARTIFACTS.bytecode, signer),
    ]);
    // Router、Factoryコントラクトをデプロイする
    const factory = await FactoryFactory.deploy(wallet.address);
    const router = await RouterFactory.deploy(factory.address, weth.address);
    // FactoryからWETH/TOKENのペアのプールを作る
    await factory.createPair(weth.address, token.address);
    // 作成したプールのアドレスを取得し、Contractインスタンスを得る
    const poolAddress = await factory.getPair(token.address, weth.address);

    //console.log("pool Address => ", await factory.getPair(token.address, weth.address));

    const pair = await PairFactory.attach(poolAddress);
    return { weth, token, router, factory, pair };
};

module.exports = {
    uniswapFixture,
};
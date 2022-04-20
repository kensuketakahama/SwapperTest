// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./ERC20Mock.sol";
import "hardhat/console.sol";

interface IPriceOracle {
    function getLatestPrice() external view returns (uint256);
}

interface ISwapper {
    event Swap(address indexed caller, uint256 amountIn, uint256 amountOut);

    function swap() external;

    function withdraw(IERC20 token, uint256 amount) external;
}

contract Swapper is ISwapper {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IUniswapV2Router02 public router;

    IERC20 public tokenSpent;

    IPriceOracle public oracle;

    address payable public treasury;

    address public owner;

    uint256 public maximumSlippageBasisPoints;

    uint256 private constant BASIS_POINTS_GRANULARITY = 10000;

    event MaximumSlippageBasisPoints(uint256 mSBP);

    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    constructor(
        IUniswapV2Router02 _router,
        IERC20 _tokenSpent,
        IPriceOracle _oracle,
        address payable _treasury
    ) {
        require(_treasury != address(0), "Treasury can't be zero add1ress.");
        require(
            address(_router) != address(0),
            "router can't be zero address."
        );
        require(
            address(_tokenSpent) != address(0),
            "token can't be zero address."
        );
        require(
            address(_oracle) != address(0),
            "oracle can't be zero address."
        );
        router = _router;
        tokenSpent = _tokenSpent;
        oracle = _oracle;
        treasury = _treasury;
        owner = msg.sender;
    }

    //returns maountOut by Uniswao Router V2
    /*
    function amountOut() external view returns(uint256 AmountOut){
        uint256 amountIn = tokenSpent.balanceOf(address(this));
        address[] memory path = new address[](2);
        path[0] = address(tokenSpent);
        path[1] = router.WETH();
        uint256[] memory amounts = router.getAmountsOut(amountIn, path);
        AmountOut = amounts[1];
        console.log("AMountOut in Contract =>", AmountOut);
    }
    */

    function swap() external override onlyOwner {
        // 1. 売るトークンの量を取得
        uint256 amountIn = tokenSpent.balanceOf(address(this));
        // 2. 買うトークンの最低量を計算
        uint256 amountOutMin = _getAmountOutMin(
            _getExpectedAmountOut(amountIn)
        );
        // 3. トークンを売るパスを指定
        address[] memory path = new address[](2);
        path[0] = address(tokenSpent);
        path[1] = router.WETH();
        // 4. UniswapでトークンをETHに交換する
        tokenSpent.approve(address(router), amountIn);
        uint256[] memory amounts = router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            treasury,
            block.timestamp
        );

        // 5. イベントを発火
        emit Swap(msg.sender, amountIn, amounts[1]);

    }

    function withdraw(IERC20 token, uint256 amount)
        external
        override
        onlyOwner
    {
        token.safeTransfer(msg.sender, amount);
    }

    function setMaximumSlippageBasisPoints(uint256 value) external onlyOwner {
        require(
            value <= BASIS_POINTS_GRANULARITY,
            "SlippageBasisPoints should be under 10000."
        );
        maximumSlippageBasisPoints = value;
        emit MaximumSlippageBasisPoints(maximumSlippageBasisPoints);
    }

    function _getExpectedAmountOut(uint256 amount)
        internal
        view
        returns (uint256 amountOut)
    {
        amountOut = oracle.getLatestPrice().mul(amount).div(10**18); //decinals: 18
    }

    function _getAmountOutMin(uint256 amountOut)
        internal
        view
        returns (uint256 amountOutMin)
    {
        // BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints: 10000 > uint256 > 0
        amountOutMin = amountOut
            .mul(BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints)
            .div(BASIS_POINTS_GRANULARITY);
    }

    receive() external payable {}
}

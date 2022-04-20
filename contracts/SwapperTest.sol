// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "./Swapper.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

interface ISwapperTest {
    function getExpectedAmountOut(uint256 amount)
        external
        view
        returns (uint256 amountOut);

    function getAmountOutMin(uint256 amountOut)
        external
        view
        returns (uint256 amountOutMin);
}

contract SwapperTest is Swapper, ISwapperTest {
    constructor(
        IUniswapV2Router02 _router,
        IERC20 _tokenSpent,
        IPriceOracle _oracle,
        address payable _tresuary
    ) Swapper(_router, _tokenSpent, _oracle, _tresuary) {}

    function getExpectedAmountOut(uint256 amount)
        external
        view
        override
        returns (uint256 amountOut)
    {
        amountOut = _getExpectedAmountOut(amount);
    }

    function getAmountOutMin(uint256 amountOut)
        external
        view
        override
        returns (uint256 amountOutMin)
    {
        amountOutMin = _getAmountOutMin(amountOut);
    }
}

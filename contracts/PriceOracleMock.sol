// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

interface IPriceOracle {
    function getLatestPrice() external view returns (uint256);
}

contract PriceOracleMock is IPriceOracle {
    uint256 private _price;

    constructor(uint256 price) {
        _price = price;
    }

    function setPrice(uint256 price) external {
        _price = price;
    }

    function getLatestPrice() external view override returns (uint256) {
        return _price;
    }
}

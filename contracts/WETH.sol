// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IWETH is IERC20 {
    function deposit() external payable;

    function withdraw(uint256 _amount) external;
}

contract WETH is ERC20, IWETH {
    constructor() ERC20("Wrapped ETH", "WETH") {}

    receive() external payable {
        deposit();
    }

    function deposit() public payable override {
        _mint(msg.sender, msg.value); //Transfer(acount(0), msg.sender, msg.value) is emitted
    }

    function withdraw(uint256 _amount) public override {
        //Checks-Effects-Interactions pattern
        _burn(msg.sender, _amount); //Transfer(msg.sender, account(0), _amount) is emitted
        msg.sender.transfer(_amount);
    }
}

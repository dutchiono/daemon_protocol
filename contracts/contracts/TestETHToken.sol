// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestETHToken
 * @notice Test token that represents ETH for TGE simulation on testnet
 * @dev This token can be minted to simulate having ETH for TGE contributions
 *      Used for testing the DAEMON token TGE without needing real ETH on testnet
 *
 * Usage:
 * 1. Deploy this token
 * 2. Mint tokens to test contributors
 * 3. Contributors approve factory to spend tokens
 * 4. Factory accepts this token instead of native ETH for TGE
 *
 * NOTE: This requires modifying DaemonFactory.contributeToTGE() to accept ERC20
 * OR creating a wrapper that converts this token to ETH
 */
contract TestETHToken is ERC20, Ownable {
    constructor() ERC20("daemonETH", "dETH") Ownable(msg.sender) {
        // Mint initial supply to deployer
        // Can mint more as needed for testing
        _mint(msg.sender, 1000 ether); // 1000 dETH for testing
    }

    /**
     * @notice Mint tokens (owner only)
     * @dev Allows minting test ETH for TGE simulation
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens
     * @dev Allows burning test ETH if needed
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}


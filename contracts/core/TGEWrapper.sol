// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./DaemonFactory.sol";

/**
 * @title TGEWrapper
 * @notice Wrapper contract that allows TGE contributions using ERC20 test token instead of native ETH
 * @dev This allows testing TGE on testnet without needing real ETH
 *
 * Flow:
 * 1. Contributor approves TGEWrapper to spend TestETHToken
 * 2. Contributor calls contributeToTGEWithToken()
 * 3. TGEWrapper swaps TestETHToken for ETH (or holds it)
 * 4. TGEWrapper calls factory.contributeToTGE() with ETH
 *
 * For testnet: TGEWrapper can hold TestETHToken and contribute ETH from its balance
 * For mainnet: This wrapper is not needed (use native ETH)
 */
contract TGEWrapper {
    using SafeERC20 for IERC20;

    DaemonFactory public immutable factory;
    IERC20 public immutable testETHToken;
    bool public useTestToken; // If true, accepts test token. If false, only native ETH.

    event TGEWithToken(address indexed token, address indexed contributor, uint256 amount);

    constructor(address _factory, address _testETHToken) {
        factory = DaemonFactory(_factory);
        testETHToken = IERC20(_testETHToken);
        useTestToken = true; // Enable test token mode
    }

    /**
     * @notice Contribute to TGE using test ETH token
     * @dev Transfers test token from contributor, then contributes ETH to factory
     *      For testnet: Wrapper uses its own ETH balance (minted on Hardhat or from faucet)
     *      For mainnet: This function should not be used
     */
    function contributeToTGEWithToken(address token, uint256 amount) external {
        require(useTestToken, "Test token mode disabled");

        // Transfer test token from contributor
        testETHToken.safeTransferFrom(msg.sender, address(this), amount);

        // Contribute ETH to factory (wrapper must have ETH balance)
        // On Hardhat: wrapper can be funded with ETH
        // On testnet: wrapper needs to be funded from faucet
        require(address(this).balance >= amount, "Insufficient ETH in wrapper");

        // Call factory with native ETH
        factory.contributeToTGE{value: amount}(token);

        emit TGEWithToken(token, msg.sender, amount);
    }

    /**
     * @notice Contribute to TGE with native ETH (standard flow)
     * @dev Passes through to factory
     */
    function contributeToTGE(address token) external payable {
        factory.contributeToTGE{value: msg.value}(token);
    }

    /**
     * @notice Fund wrapper with ETH (for testnet testing)
     * @dev Allows funding wrapper so it can contribute ETH on behalf of test token holders
     */
    receive() external payable {
        // Accept ETH deposits
    }

    /**
     * @notice Withdraw ETH from wrapper (owner only)
     */
    function withdrawETH(uint256 amount) external {
        // Only owner or implement access control as needed
        payable(msg.sender).transfer(amount);
    }

    /**
     * @notice Toggle test token mode
     */
    function setUseTestToken(bool _useTestToken) external {
        // Add access control as needed
        useTestToken = _useTestToken;
    }
}


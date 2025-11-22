// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdRegistry.sol";

/**
 * @title StorageRegistry
 * @notice Manages storage allocation and rent payments for FIDs
 * @dev Based on Farcaster's StorageRegistry with x402 integration
 */
contract StorageRegistry {
    // Reference to IdRegistry for FID verification
    IdRegistry public idRegistry;

    // Storage units per FID
    mapping(uint256 => uint256) public storageUnitsOf;

    // Price per storage unit (in wei)
    uint256 public pricePerUnit;

    // Testnet mode: if true, storage is free
    bool public testnetMode;

    // Owner address
    address public owner;

    event StorageRented(uint256 indexed fid, uint256 units, uint256 totalCost);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TestnetModeUpdated(bool enabled);

    constructor(address _idRegistry, uint256 _pricePerUnit, bool _testnetMode) {
        require(_idRegistry != address(0), "Invalid IdRegistry");
        idRegistry = IdRegistry(_idRegistry);
        pricePerUnit = _pricePerUnit;
        testnetMode = _testnetMode;
        owner = msg.sender;
    }

    /**
     * @notice Rent storage units for a FID
     * @param fid The FID
     * @param units Number of storage units to rent
     */
    function rent(uint256 fid, uint256 units) external payable {
        require(idRegistry.fidExists(fid), "FID does not exist");
        require(idRegistry.ownerOf(fid) == msg.sender, "Not FID owner");
        require(units > 0, "Invalid units");

        uint256 totalCost = 0;
        if (!testnetMode) {
            totalCost = units * pricePerUnit;
            require(msg.value >= totalCost, "Insufficient payment");
        }
        // On testnet, storage is free (testnetMode = true)

        storageUnitsOf[fid] += units;

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit StorageRented(fid, units, totalCost);
    }

    /**
     * @notice Get storage units for a FID
     * @param fid The FID
     * @return units Number of storage units
     */
    function getStorageUnits(uint256 fid) external view returns (uint256) {
        return storageUnitsOf[fid];
    }

    /**
     * @notice Get price per storage unit
     * @return price Price in wei
     */
    function getPrice() external view returns (uint256) {
        return testnetMode ? 0 : pricePerUnit;
    }

    /**
     * @notice Update price per storage unit (owner only)
     * @param newPrice New price in wei
     */
    function setPrice(uint256 newPrice) external {
        require(msg.sender == owner, "Not owner");
        uint256 oldPrice = pricePerUnit;
        pricePerUnit = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Set testnet mode (owner only)
     * @param enabled True to enable free storage (testnet mode)
     */
    function setTestnetMode(bool enabled) external {
        require(msg.sender == owner, "Not owner");
        testnetMode = enabled;
        emit TestnetModeUpdated(enabled);
    }

    /**
     * @notice Withdraw contract balance (owner only)
     */
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}


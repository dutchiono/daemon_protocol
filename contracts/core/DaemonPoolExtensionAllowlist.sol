// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title DaemonPoolExtensionAllowlist
 * @notice Manages allowlist for pool extensions
 * @dev Adapted from FEY Pool Extension Allowlist, made upgradeable with UUPS pattern
 * Allowlist Address: 0xFD549237CdEAbDc14438CAF3f3861e174fDEae46 (FEY mainnet reference)
 */
contract DaemonPoolExtensionAllowlist is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    // Extension enablement: extension => enabled
    mapping(address => bool) public enabledExtensions;

    // Events
    event ExtensionEnabled(address indexed extension, bool enabled);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the allowlist
     * @param _owner Owner address
     */
    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
    }

    /**
     * @notice Check if an extension is enabled
     * @param extension Extension address
     * @return True if enabled
     */
    function isExtensionEnabled(address extension) external view returns (bool) {
        return enabledExtensions[extension];
    }

    /**
     * @notice Enable or disable an extension
     * @param extension Extension address
     * @param enabled Whether extension is enabled
     */
    function setExtensionEnabled(address extension, bool enabled) external onlyOwner {
        enabledExtensions[extension] = enabled;
        emit ExtensionEnabled(extension, enabled);
    }

    /**
     * @notice Authorize upgrade (UUPS)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}


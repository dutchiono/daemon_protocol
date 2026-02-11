// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title IdentityRegistry
 * @notice On-chain identity registry for Daemon Social Network
 * @dev Maps wallet addresses to DIDs and manages signing keys
 */
contract IdentityRegistry is Ownable, ReentrancyGuard, Pausable {
    // Structs
    struct Identity {
        address owner;
        uint256 fid;
        uint256 registeredAt;
        bool active;
    }

    // State
    uint256 public nextFID = 1;
    uint256 public registrationFee = 0; // Can be set by owner
    
    mapping(address => uint256) public fidOf;  // wallet => FID
    mapping(uint256 => Identity) public identities;  // FID => Identity
    mapping(uint256 => bytes32[]) private _signingKeys;  // FID => signing keys
    mapping(bytes32 => uint256) public keyToFID;  // signing key => FID
    mapping(bytes32 => bool) public revokedKeys;  // revoked keys

    // Events
    event FIDRegistered(address indexed owner, uint256 indexed fid, uint256 timestamp);
    event KeyAdded(uint256 indexed fid, bytes32 indexed key, uint256 timestamp);
    event KeyRevoked(uint256 indexed fid, bytes32 indexed key, uint256 timestamp);
    event FIDTransferred(uint256 indexed fid, address indexed from, address indexed to, uint256 timestamp);
    event IdentityDeactivated(uint256 indexed fid, uint256 timestamp);
    event IdentityReactivated(uint256 indexed fid, uint256 timestamp);
    event RegistrationFeeUpdated(uint256 oldFee, uint256 newFee);

    // Errors
    error AlreadyRegistered();
    error NotRegistered();
    error NotOwner();
    error KeyAlreadyInUse();
    error KeyNotFound();
    error InvalidKey();
    error InsufficientFee();
    error IdentityInactive();
    error NewOwnerAlreadyHasFID();

    constructor() {
        // Contract deployer becomes owner
    }

    /**
     * @notice Register a new identity
     * @dev Creates a new FID for the caller
     * @return fid The newly created FID
     */
    function register() external payable nonReentrant whenNotPaused returns (uint256) {
        if (fidOf[msg.sender] != 0) revert AlreadyRegistered();
        if (msg.value < registrationFee) revert InsufficientFee();
        
        uint256 fid = nextFID++;
        fidOf[msg.sender] = fid;
        
        identities[fid] = Identity({
            owner: msg.sender,
            fid: fid,
            registeredAt: block.timestamp,
            active: true
        });
        
        emit FIDRegistered(msg.sender, fid, block.timestamp);
        return fid;
    }

    /**
     * @notice Add a signing key to an identity
     * @dev Only the identity owner can add keys
     * @param fid The FID to add the key to
     * @param key The signing key (bytes32 representation of public key)
     */
    function addKey(uint256 fid, bytes32 key) external {
        if (identities[fid].owner != msg.sender) revert NotOwner();
        if (!identities[fid].active) revert IdentityInactive();
        if (key == bytes32(0)) revert InvalidKey();
        if (keyToFID[key] != 0) revert KeyAlreadyInUse();
        
        _signingKeys[fid].push(key);
        keyToFID[key] = fid;
        
        emit KeyAdded(fid, key, block.timestamp);
    }

    /**
     * @notice Revoke a signing key
     * @dev Marks the key as revoked but doesn't remove from storage
     * @param fid The FID to revoke the key from
     * @param key The key to revoke
     */
    function revokeKey(uint256 fid, bytes32 key) external {
        if (identities[fid].owner != msg.sender) revert NotOwner();
        if (keyToFID[key] != fid) revert KeyNotFound();
        
        revokedKeys[key] = true;
        delete keyToFID[key];
        
        emit KeyRevoked(fid, key, block.timestamp);
    }

    /**
     * @notice Transfer FID ownership to a new address
     * @dev New owner must not already have a FID
     * @param fid The FID to transfer
     * @param newOwner The new owner address
     */
    function transferFID(uint256 fid, address newOwner) external {
        if (identities[fid].owner != msg.sender) revert NotOwner();
        if (!identities[fid].active) revert IdentityInactive();
        if (fidOf[newOwner] != 0) revert NewOwnerAlreadyHasFID();
        if (newOwner == address(0)) revert InvalidKey();
        
        address oldOwner = msg.sender;
        delete fidOf[oldOwner];
        fidOf[newOwner] = fid;
        identities[fid].owner = newOwner;
        
        emit FIDTransferred(fid, oldOwner, newOwner, block.timestamp);
    }

    /**
     * @notice Deactivate an identity
     * @dev Only owner can deactivate, can be reactivated later
     * @param fid The FID to deactivate
     */
    function deactivate(uint256 fid) external {
        if (identities[fid].owner != msg.sender) revert NotOwner();
        if (!identities[fid].active) revert IdentityInactive();
        
        identities[fid].active = false;
        emit IdentityDeactivated(fid, block.timestamp);
    }

    /**
     * @notice Reactivate an identity
     * @dev Only owner can reactivate
     * @param fid The FID to reactivate
     */
    function reactivate(uint256 fid) external {
        if (identities[fid].owner != msg.sender) revert NotOwner();
        if (identities[fid].active) revert AlreadyRegistered();
        
        identities[fid].active = true;
        emit IdentityReactivated(fid, block.timestamp);
    }

    // View Functions

    /**
     * @notice Get an identity by FID
     * @param fid The FID to query
     * @return Identity struct
     */
    function getIdentity(uint256 fid) external view returns (Identity memory) {
        return identities[fid];
    }

    /**
     * @notice Verify if a key is valid and get its FID
     * @param key The key to verify
     * @return fid The FID associated with the key
     * @return valid Whether the key is valid (not revoked, identity active)
     */
    function verifyKey(bytes32 key) external view returns (uint256 fid, bool valid) {
        fid = keyToFID[key];
        if (fid == 0) {
            return (0, false);
        }
        
        valid = !revokedKeys[key] && identities[fid].active;
        return (fid, valid);
    }

    /**
     * @notice Get all signing keys for a FID
     * @param fid The FID to query
     * @return Array of signing keys
     */
    function getKeys(uint256 fid) external view returns (bytes32[] memory) {
        return _signingKeys[fid];
    }

    /**
     * @notice Get active (non-revoked) keys for a FID
     * @param fid The FID to query
     * @return Array of active signing keys
     */
    function getActiveKeys(uint256 fid) external view returns (bytes32[] memory) {
        bytes32[] memory allKeys = _signingKeys[fid];
        uint256 activeCount = 0;
        
        // Count active keys
        for (uint256 i = 0; i < allKeys.length; i++) {
            if (!revokedKeys[allKeys[i]]) {
                activeCount++;
            }
        }
        
        // Build active keys array
        bytes32[] memory activeKeys = new bytes32[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allKeys.length; i++) {
            if (!revokedKeys[allKeys[i]]) {
                activeKeys[index] = allKeys[i];
                index++;
            }
        }
        
        return activeKeys;
    }

    /**
     * @notice Check if an address is registered
     * @param addr The address to check
     * @return bool True if registered
     */
    function isRegistered(address addr) external view returns (bool) {
        return fidOf[addr] != 0;
    }

    /**
     * @notice Get the total number of registered identities
     * @return uint256 The total count
     */
    function getTotalRegistered() external view returns (uint256) {
        return nextFID - 1;
    }

    // Admin Functions

    /**
     * @notice Set the registration fee
     * @dev Only owner can call
     * @param newFee The new fee in wei
     */
    function setRegistrationFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = registrationFee;
        registrationFee = newFee;
        emit RegistrationFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Pause the contract
     * @dev Only owner can call, prevents new registrations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only owner can call
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw collected fees
     * @dev Only owner can call
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Emergency recovery function
     * @dev Only owner can call, use to fix edge cases
     * @param fid The FID to recover
     * @param newOwner The new owner
     */
    function emergencyTransfer(uint256 fid, address newOwner) external onlyOwner {
        if (fidOf[newOwner] != 0) revert NewOwnerAlreadyHasFID();
        
        address oldOwner = identities[fid].owner;
        delete fidOf[oldOwner];
        fidOf[newOwner] = fid;
        identities[fid].owner = newOwner;
        
        emit FIDTransferred(fid, oldOwner, newOwner, block.timestamp);
    }
}

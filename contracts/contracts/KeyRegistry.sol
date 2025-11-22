// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdRegistry.sol";

/**
 * @title KeyRegistry
 * @notice Manages Ed25519 signing keys for FIDs
 * @dev Based on Farcaster's KeyRegistry architecture
 */
contract KeyRegistry {
    // Reference to IdRegistry for FID verification
    IdRegistry public idRegistry;

    struct KeyData {
        bytes32 key;           // Ed25519 public key
        uint256 addedAt;        // Timestamp when key was added
        uint256 expiresAt;     // Expiration timestamp (0 = never expires)
        bool revoked;           // Whether key is revoked
    }

    // Mapping from FID to array of keys
    mapping(uint256 => KeyData[]) public keysOf;

    // Mapping from key hash to FID (for quick lookup)
    mapping(bytes32 => uint256) public fidOfKey;

    event KeyAdded(uint256 indexed fid, bytes32 indexed key, uint256 expiresAt);
    event KeyRemoved(uint256 indexed fid, bytes32 indexed key);
    event KeyRevoked(uint256 indexed fid, bytes32 indexed key);

    constructor(address _idRegistry) {
        require(_idRegistry != address(0), "Invalid IdRegistry");
        idRegistry = IdRegistry(_idRegistry);
    }

    /**
     * @notice Add a signing key for a FID
     * @param fid The FID
     * @param key The Ed25519 public key (32 bytes)
     * @param expiresAt Expiration timestamp (0 = never expires)
     */
    function add(uint256 fid, bytes32 key, uint256 expiresAt) external {
        require(idRegistry.fidExists(fid), "FID does not exist");
        require(idRegistry.ownerOf(fid) == msg.sender, "Not FID owner");
        require(key != bytes32(0), "Invalid key");
        require(fidOfKey[key] == 0, "Key already in use");

        KeyData memory keyData = KeyData({
            key: key,
            addedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false
        });

        keysOf[fid].push(keyData);
        fidOfKey[key] = fid;

        emit KeyAdded(fid, key, expiresAt);
    }

    /**
     * @notice Remove a signing key for a FID
     * @param fid The FID
     * @param keyIndex The index of the key to remove
     */
    function remove(uint256 fid, uint256 keyIndex) external {
        require(idRegistry.fidExists(fid), "FID does not exist");
        require(idRegistry.ownerOf(fid) == msg.sender, "Not FID owner");
        require(keyIndex < keysOf[fid].length, "Invalid key index");

        bytes32 key = keysOf[fid][keyIndex].key;

        // Remove from array (swap with last element and pop)
        uint256 lastIndex = keysOf[fid].length - 1;
        if (keyIndex != lastIndex) {
            keysOf[fid][keyIndex] = keysOf[fid][lastIndex];
        }
        keysOf[fid].pop();

        // Clear key mapping
        fidOfKey[key] = 0;

        emit KeyRemoved(fid, key);
    }

    /**
     * @notice Revoke a signing key (marks as revoked but doesn't remove)
     * @param fid The FID
     * @param keyIndex The index of the key to revoke
     */
    function revoke(uint256 fid, uint256 keyIndex) external {
        require(idRegistry.fidExists(fid), "FID does not exist");
        require(idRegistry.ownerOf(fid) == msg.sender, "Not FID owner");
        require(keyIndex < keysOf[fid].length, "Invalid key index");
        require(!keysOf[fid][keyIndex].revoked, "Key already revoked");

        keysOf[fid][keyIndex].revoked = true;
        bytes32 key = keysOf[fid][keyIndex].key;

        // Clear key mapping
        fidOfKey[key] = 0;

        emit KeyRevoked(fid, key);
    }

    /**
     * @notice Get all keys for a FID
     * @param fid The FID
     * @return keys Array of key data
     */
    function getKeys(uint256 fid) external view returns (KeyData[] memory) {
        return keysOf[fid];
    }

    /**
     * @notice Get active (non-revoked, non-expired) keys for a FID
     * @param fid The FID
     * @return keys Array of active key data
     */
    function getActiveKeys(uint256 fid) external view returns (KeyData[] memory) {
        KeyData[] memory allKeys = keysOf[fid];
        uint256 activeCount = 0;

        // Count active keys
        for (uint256 i = 0; i < allKeys.length; i++) {
            if (!allKeys[i].revoked &&
                (allKeys[i].expiresAt == 0 || allKeys[i].expiresAt > block.timestamp)) {
                activeCount++;
            }
        }

        // Build array of active keys
        KeyData[] memory activeKeys = new KeyData[](activeCount);
        uint256 j = 0;
        for (uint256 i = 0; i < allKeys.length; i++) {
            if (!allKeys[i].revoked &&
                (allKeys[i].expiresAt == 0 || allKeys[i].expiresAt > block.timestamp)) {
                activeKeys[j] = allKeys[i];
                j++;
            }
        }

        return activeKeys;
    }

    /**
     * @notice Check if a key is valid (exists, not revoked, not expired)
     * @param key The Ed25519 public key
     * @return valid True if key is valid
     */
    function isValidKey(bytes32 key) external view returns (bool) {
        uint256 fid = fidOfKey[key];
        if (fid == 0) return false;

        KeyData[] memory keys = keysOf[fid];
        for (uint256 i = 0; i < keys.length; i++) {
            if (keys[i].key == key) {
                if (keys[i].revoked) return false;
                if (keys[i].expiresAt > 0 && keys[i].expiresAt <= block.timestamp) return false;
                return true;
            }
        }
        return false;
    }
}


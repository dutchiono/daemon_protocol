// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Identity Registry
 * @notice Maps wallet addresses to FIDs (Farcaster IDs)
 * @dev Deploy to Optimism (or Base for testing)
 */
contract IdentityRegistry {
    uint256 public nextFID = 1;

    mapping(address => uint256) public fidOf; // wallet → FID
    mapping(uint256 => address) public ownerOf; // FID → wallet
    mapping(uint256 => bytes32[]) public signingKeys; // FID → Ed25519 keys

    event FIDRegistered(address indexed wallet, uint256 indexed fid);
    event SigningKeyAdded(uint256 indexed fid, bytes32 key);

    /**
     * @notice Register a new FID for the caller
     * @return fid The assigned FID
     */
    function register() external returns (uint256) {
        require(fidOf[msg.sender] == 0, "Already registered");

        uint256 fid = nextFID++;
        fidOf[msg.sender] = fid;
        ownerOf[fid] = msg.sender;

        emit FIDRegistered(msg.sender, fid);
        return fid;
    }

    /**
     * @notice Get FID for a wallet address
     * @param wallet The wallet address
     * @return fid The FID (0 if not registered)
     */
    function getFID(address wallet) external view returns (uint256) {
        return fidOf[wallet];
    }

    /**
     * @notice Add a signing key for a FID
     * @param fid The FID
     * @param key The Ed25519 public key
     */
    function addSigningKey(uint256 fid, bytes32 key) external {
        require(ownerOf[fid] == msg.sender, "Not owner");
        signingKeys[fid].push(key);
        emit SigningKeyAdded(fid, key);
    }

    /**
     * @notice Get signing keys for a FID
     * @param fid The FID
     * @return keys Array of signing keys
     */
    function getSigningKeys(uint256 fid) external view returns (bytes32[] memory) {
        return signingKeys[fid];
    }

    /**
     * @notice Check if a FID exists
     * @param fid The FID to check
     * @return exists True if FID exists
     */
    function fidExists(uint256 fid) external view returns (bool) {
        return ownerOf[fid] != address(0);
    }
}


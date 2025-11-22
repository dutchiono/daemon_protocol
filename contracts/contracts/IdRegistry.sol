// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IdRegistry
 * @notice Manages FID (Farcaster ID) ownership and registration
 * @dev Based on Farcaster's IdRegistry architecture
 */
contract IdRegistry {
    uint256 public nextFID = 1;

    // Mapping from wallet address to FID
    mapping(address => uint256) public fidOf;

    // Mapping from FID to wallet address
    mapping(uint256 => address) public ownerOf;

    // Mapping from FID to recovery address (optional)
    mapping(uint256 => address) public recoveryOf;

    event FIDRegistered(address indexed wallet, uint256 indexed fid);
    event FIDTransferred(uint256 indexed fid, address indexed from, address indexed to);
    event RecoveryAddressSet(uint256 indexed fid, address indexed recovery);
    event FIDRecovered(uint256 indexed fid, address indexed from, address indexed to);

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
     * @notice Transfer FID to another address
     * @param to The address to transfer to
     */
    function transfer(address to) external {
        require(to != address(0), "Invalid address");
        uint256 fid = fidOf[msg.sender];
        require(fid != 0, "No FID registered");
        require(fidOf[to] == 0, "Recipient already has FID");

        fidOf[msg.sender] = 0;
        fidOf[to] = fid;
        ownerOf[fid] = to;

        emit FIDTransferred(fid, msg.sender, to);
    }

    /**
     * @notice Set recovery address for a FID
     * @param recovery The recovery address
     */
    function setRecoveryAddress(address recovery) external {
        uint256 fid = fidOf[msg.sender];
        require(fid != 0, "No FID registered");
        recoveryOf[fid] = recovery;
        emit RecoveryAddressSet(fid, recovery);
    }

    /**
     * @notice Recover FID using recovery address
     * @param fid The FID to recover
     * @param to The address to recover to
     */
    function recover(uint256 fid, address to) external {
        require(to != address(0), "Invalid address");
        require(ownerOf[fid] != address(0), "FID does not exist");
        require(recoveryOf[fid] == msg.sender, "Not recovery address");
        require(fidOf[to] == 0, "Recipient already has FID");

        address oldOwner = ownerOf[fid];
        fidOf[oldOwner] = 0;
        fidOf[to] = fid;
        ownerOf[fid] = to;

        emit FIDRecovered(fid, oldOwner, to);
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
     * @notice Check if a FID exists
     * @param fid The FID to check
     * @return exists True if FID exists
     */
    function fidExists(uint256 fid) external view returns (bool) {
        return ownerOf[fid] != address(0);
    }
}


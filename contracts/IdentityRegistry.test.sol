// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "./IdentityRegistry.sol";

contract IdentityRegistryTest is Test {
    IdentityRegistry public registry;
    address public alice = address(0x1);
    address public bob = address(0x2);
    bytes32 public key1 = bytes32(uint256(1));
    bytes32 public key2 = bytes32(uint256(2));

    event FIDRegistered(address indexed owner, uint256 indexed fid, uint256 timestamp);
    event KeyAdded(uint256 indexed fid, bytes32 indexed key, uint256 timestamp);
    event KeyRevoked(uint256 indexed fid, bytes32 indexed key, uint256 timestamp);
    event FIDTransferred(uint256 indexed fid, address indexed from, address indexed to, uint256 timestamp);

    function setUp() public {
        registry = new IdentityRegistry();
    }

    function testRegister() public {
        vm.prank(alice);
        uint256 fid = registry.register();
        
        assertEq(fid, 1);
        assertEq(registry.fidOf(alice), 1);
        assertTrue(registry.isRegistered(alice));
    }

    function testRegisterMultipleUsers() public {
        vm.prank(alice);
        uint256 fid1 = registry.register();
        
        vm.prank(bob);
        uint256 fid2 = registry.register();
        
        assertEq(fid1, 1);
        assertEq(fid2, 2);
        assertEq(registry.getTotalRegistered(), 2);
    }

    function testAddKey() public {
        vm.prank(alice);
        uint256 fid = registry.register();
        
        vm.prank(alice);
        registry.addKey(fid, key1);
        
        assertEq(registry.keyToFID(key1), fid);
        
        bytes32[] memory keys = registry.getKeys(fid);
        assertEq(keys.length, 1);
        assertEq(keys[0], key1);
    }

    function testVerifyKey() public {
        vm.prank(alice);
        uint256 fid = registry.register();
        
        vm.prank(alice);
        registry.addKey(fid, key1);
        
        (uint256 returnedFid, bool valid) = registry.verifyKey(key1);
        assertEq(returnedFid, fid);
        assertTrue(valid);
    }

    function testRevokeKey() public {
        vm.prank(alice);
        uint256 fid = registry.register();
        
        vm.prank(alice);
        registry.addKey(fid, key1);
        
        vm.prank(alice);
        registry.revokeKey(fid, key1);
        
        (uint256 returnedFid, bool valid) = registry.verifyKey(key1);
        assertEq(returnedFid, 0);
        assertFalse(valid);
    }

    function testTransferFID() public {
        vm.prank(alice);
        uint256 fid = registry.register();
        
        vm.prank(alice);
        registry.transferFID(fid, bob);
        
        assertEq(registry.fidOf(alice), 0);
        assertEq(registry.fidOf(bob), fid);
    }
}

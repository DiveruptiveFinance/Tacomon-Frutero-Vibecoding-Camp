// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CollectibleLog.sol";

contract CollectibleLogTest is Test {
    CollectibleLog public clog;
    address user = address(0xBEEF);

    function setUp() public {
        clog = new CollectibleLog();
    }

    function testMint() public {
        vm.prank(user);
        uint256 id = clog.mint("Al Pastor", "Taqueria El Huequito, CDMX", "https://example.com/taco.jpg");
        assertEq(id, 0);
        assertEq(clog.ownerOf(0), user);
        assertEq(clog.totalSupply(), 1);
    }

    function testMultipleMints() public {
        vm.startPrank(user);
        clog.mint("Suadero", "Los Cocuyos", "https://example.com/1.jpg");
        clog.mint("Campechano", "Los Cocuyos", "https://example.com/2.jpg");
        vm.stopPrank();
        assertEq(clog.totalSupply(), 2);
        assertEq(clog.ownerOf(0), user);
        assertEq(clog.ownerOf(1), user);
    }

    function testTokenURI() public {
        vm.prank(user);
        clog.mint("Pastor", "El Huequito", "https://example.com/img.jpg");
        string memory uri = clog.tokenURI(0);
        assertTrue(bytes(uri).length > 0);
    }

    function testEntryData() public {
        vm.prank(user);
        clog.mint("Birria", "Tacos Aaron", "https://example.com/birria.jpg");
        (string memory name, string memory location, uint256 ts, string memory img) = clog.entries(0);
        assertEq(name, "Birria");
        assertEq(location, "Tacos Aaron");
        assertTrue(ts > 0);
        assertEq(img, "https://example.com/birria.jpg");
    }
}

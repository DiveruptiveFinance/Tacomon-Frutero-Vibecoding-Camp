// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CollectibleLog.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        CollectibleLog log = new CollectibleLog();
        console.log("CollectibleLog deployed at:", address(log));
        vm.stopBroadcast();
    }
}

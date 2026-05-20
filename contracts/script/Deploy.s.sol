// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PlanetPassport} from "../src/PlanetPassport.sol";

contract DeployPlanetPassport is Script {
    function run() external returns (address deployed) {
        vm.startBroadcast();
        PlanetPassport passport = new PlanetPassport();
        deployed = address(passport);
        vm.stopBroadcast();
        console2.log("PlanetPassport deployed:", deployed);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

contract CD {
    uint chainID= 8;

    function setChainID(uint x) public {
        chainID = x;
    }

    function getchainID() public view returns (uint) {
        return chainID;
    }
}
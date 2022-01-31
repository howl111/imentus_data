// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

contract staking {
    uint total_staking_amount= 0;
    address public msg_sender;
    mapping (address => uint) stake;
    
    function set(uint value) public
    {
       stake[msg.sender] = value;
    }
    function get(address add) public view returns (uint){
        return stake[add];
    }
}
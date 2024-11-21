// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract GameContract {
    address public owner;

    // Event emitted when a bet is paid
    event BetPaid(address indexed player, uint256 amount);
    // Event emitted when the winner is paid
    event WinnerPaid(address indexed winner, uint256 amount);

    // Modifier to restrict access to only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Constructor sets the owner of the contract
    constructor() {
        owner = msg.sender;
    }

    // Function to allow players to deposit bet amounts to the contract
    function payBetAmount() external payable {
        require(msg.value > 0, "You must send some Ether");
        emit BetPaid(msg.sender, msg.value);
    }

    // Function for the owner to transfer the collected bet amount to the winner
    function transferToWinner(address payable winner) external onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds available for transfer");
        (bool success, ) = winner.call{value: contractBalance}("");
        require(success, "Transfer to winner failed");
        emit WinnerPaid(winner, contractBalance);
    }

    // Fallback function to handle accidental transfers
    receive() external payable {
        emit BetPaid(msg.sender, msg.value);
    }
}

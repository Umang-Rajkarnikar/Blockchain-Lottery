//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Lottery is AccessControl {
    
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    IERC20 private tokenContract;
    address private owner;
    address[] private customers;
    uint public ticketPrice;
    uint public sales;
    uint public fees;
    uint public managerCount;
    uint public lotteryID;
    uint public withdrawID;
    mapping(uint => bool) private lotteries;
    mapping(address => bool) private managers;

    constructor (IERC20 _token) {
        owner = msg.sender;
        fees = 0;
        sales = 0;
        ticketPrice = 20;
        managerCount = 0;
        tokenContract = _token;
        lotteryID = 0;
        withdrawID = 0;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setTicketPrice(uint newPrice) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not owner");
        ticketPrice = newPrice;
    }

    function setManager(address manager) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not owner");
        require(managerCount < 2, "Already two managers");
        managers[manager] = true;
        managerCount += 1;
        _setupRole(MANAGER_ROLE, manager);
        _grantRole(MANAGER_ROLE, manager);
    }

    function removeManager(address manager) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not owner");
        require(managers[manager], "Not a manager");
        managers[manager] = false;
        managerCount -= 1;
        _revokeRole(MANAGER_ROLE, manager);
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encode(block.difficulty, block.timestamp, customers)));
    }

    function pickWinner() public restricted {
        fees = fees + (sales*5)/100;
        sales = (sales*95)/100;
        uint index = random() % customers.length;
        tokenContract.transfer(customers[index], sales);
        customers = new address[](0);
        lotteries[lotteryID] = true;
        lotteryID += 1;
    }

    function withdraw() public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not owner");
        require(lotteries[withdrawID], "Winner for this lottery has not been picked!");
        tokenContract.transfer(owner, fees);
        fees = 0;
        withdrawID += 1;
    }

    function enter(uint amount) public {
        require(amount >= ticketPrice*10**18, "Not enough funds");
        tokenContract.transferFrom(msg.sender, address(this), amount);
        customers.push(msg.sender);
        sales += amount;
    }

    modifier restricted() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(MANAGER_ROLE, msg.sender), "Only the owner or a manager can pick a winner!");
        _;
    }

    function getPrice() public view returns (uint) {
        return ticketPrice;
    }

    function isManager(address person) public view returns (bool) {
        return hasRole(MANAGER_ROLE, person);
    }

    function getCustomers() public view returns (address[] memory) {
        return customers;
    }
}

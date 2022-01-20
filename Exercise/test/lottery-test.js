const { expect } = require("chai");
const { parseUnits } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

let MOKToken;
let Lottery;
let lottery;
let mok;
let owner;
let addr1;
let addr2;
let addr3;
let addr4;
let addr5;



describe("Lottery - basic functionality", function() {
  beforeEach(async function () {
    MOKToken = await ethers.getContractFactory("MOKToken");
    mok = await MOKToken.deploy();
  
    Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(mok.address);

    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    
  });

  it("Should assign the total supply of tokens (1000) to the owner", async function () {
    const ticketPrice = await lottery.ticketPrice();
    expect(ticketPrice).to.equal(20);

    const ownerAddress = await lottery.owner();
    expect(ownerAddress).to.equal(owner.address);

    const ownerBalance = await mok.balanceOf(owner.address);
    expect(ownerBalance).to.equal(parseUnits("1000", 18));

    const sales = await lottery.sales();
    expect(sales).to.equal(0);

    const fees = await lottery.fees();
    expect(fees).to.equal(0);

  });

  it("Should set the ticket price to 25, only if it is the owner", async function () {
    await lottery.setTicketPrice(parseUnits("25", 18));
    const ticketPrice = await lottery.ticketPrice();
    expect(ticketPrice).to.equal(parseUnits("25", 18));

    await expect(
      lottery.connect(addr1).setTicketPrice(parseUnits("25", 18))
    ).to.be.revertedWith("Not owner");
  });

  it("Should set up to a maximum of two managers", async function () {

    // Asserts false if not owner
    await expect(
      lottery.connect(addr1).setManager(addr2.address)
    ).to.be.revertedWith("Not owner");
    
    // Set managers
    await lottery.setManager(addr1.address);
    await lottery.setManager(addr2.address);

    // Check if they have the manager role
    let isManager = await lottery.isManager(addr1.address);
    expect(isManager).to.equal(true);
    isManager = await lottery.isManager(addr2.address);
    expect(isManager).to.equal(true);

    // Try to add a third manager
    await expect(
      lottery.setManager(addr3.address)
    ).to.be.revertedWith("Already two managers");
  });

  it("Should let one person enter the lottery", async function () {

    // Error if user enters less than 20 tokens
    await expect(
      lottery.connect(addr1).enter(parseUnits("19", 18))
    ).to.be.revertedWith("Not enough funds");

    // Add 50 tokens to user account
    await mok.transfer(addr1.address, parseUnits("50", 18));

    // Approves transaction
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));

    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));
    
    // Check if balance of user is 0
    let balance = await mok.balanceOf(addr1.address);
    expect(balance).to.equal(parseUnits("30", 18));

    // Check if sales increased to 20 tokens
    const sales = await lottery.sales();
    expect(sales).to.equal(parseUnits("20", 18));

    // Check if addr1 is in the smart contract
    const customers = await lottery.getCustomers();
    expect(customers[0]).to.equal(addr1.address);


  });

  it("Should let multiple people enter the lottery", async function () {

    // Add 50 tokens to user account
    await mok.transfer(addr1.address, parseUnits("50", 18));
    await mok.transfer(addr2.address, parseUnits("50", 18));
    await mok.transfer(addr3.address, parseUnits("50", 18));

    // Approve transactions
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));
    await mok.connect(addr2).approve(lottery.address, parseUnits("20", 18));
    await mok.connect(addr3).approve(lottery.address, parseUnits("20", 18));

    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));
    await lottery.connect(addr2).enter(parseUnits("20", 18));
    await lottery.connect(addr3).enter(parseUnits("20", 18));

    
    // Check if balance of user is 50-20=30
    let balance = await mok.balanceOf(addr1.address);
    expect(balance).to.equal(parseUnits("30", 18));
    balance = await mok.balanceOf(addr2.address);
    expect(balance).to.equal(parseUnits("30", 18));
    balance = await mok.balanceOf(addr3.address);
    expect(balance).to.equal(parseUnits("30", 18));

    // Check if sales increased to 20 tokens
    const sales = await lottery.sales();
    expect(sales).to.equal(parseUnits("60", 18));

    // Check if addr1 is in the smart contract
    const customers = await lottery.getCustomers();
    expect(customers[0]).to.equal(addr1.address);
    expect(customers[1]).to.equal(addr2.address);
    expect(customers[2]).to.equal(addr3.address);



  });

  it("Should pick winner", async function () {

    // Add 50 tokens to user account
    await mok.transfer(addr1.address, parseUnits("50", 18));

    // Approves transaction
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));
    
    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));

    // Pick winner
    await lottery.pickWinner();

    
    // Check if balance of user is 0
    let balance = await mok.balanceOf(addr1.address);
    expect(balance).to.equal(parseUnits("49", 18));

    // Check if sales increased to 20 tokens
    const fees = await lottery.fees();
    expect(fees).to.equal(parseUnits("1", 18));

    const lotteryID = await lottery.lotteryID();
    expect(lotteryID).to.equal(1);
  });

  it("Should withdraw money into owner's account", async function () {

    // Add 50 tokens to user account
    await mok.transfer(addr1.address, parseUnits("50", 18));
    let balance1 = await mok.balanceOf(owner.address);

    // Approves transaction
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));
    
    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));

    // Pick winner
    await lottery.pickWinner();

    // Check if sales increased to 20 tokens
    const fees = await lottery.fees();
    expect(fees).to.equal(parseUnits("1", 18));

   // Withdraw money into owner's account
   await lottery.withdraw();

    // Check if balance of owner increased by value of fees
    let balance2 = await mok.balanceOf(owner.address);
    expect(balance2.sub(balance1)).to.equal(fees);

    const withdrawID = await lottery.lotteryID();
    expect(withdrawID).to.equal(1);
  });

  it("Should not let owner withdraw unless a winner has been picked", async function () {

    // Add 50 tokens to user account
    await mok.transfer(addr1.address, parseUnits("50", 18));
    let balance1 = await mok.balanceOf(owner.address);

    // Approves transaction
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));
    
    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));

    // Withdraw money into owner's account
    await expect(
     lottery.withdraw()
    ).to.be.revertedWith("Winner for this lottery has not been picked!");
  });

  it("Owner can withdraw money for only a lotterythat has been decided", async function () {

    // Add 50 tokens to user account
    await mok.transfer(addr1.address, parseUnits("50", 18));
    let balance1 = await mok.balanceOf(owner.address);

    // BEGIN Lottery 1

    // Approves transaction
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));
    
    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));

    // Pick winner for lottery 1
    await lottery.pickWinner();

    // BEGIN Lottery 2

    // Approves transaction
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));

    // Get fees before withdrawal
    const fees = await lottery.fees();

    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));

    // Withdraw money into owner's account
    await lottery.withdraw();

    // Check if balance of owner increased by value of fees
    let balance2 = await mok.balanceOf(owner.address);
    expect(balance2.sub(balance1)).to.equal(fees);
    
    await expect(
     lottery.withdraw()
    ).to.be.revertedWith("Winner for this lottery has not been picked!");
  });
});

describe("Lottery - Access control", function() {
  beforeEach(async function () {
    MOKToken = await ethers.getContractFactory("MOKToken");
    mok = await MOKToken.deploy();
  
    Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(mok.address);

    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    
    // Add 50 tokens to user account
    await mok.transfer(addr1.address, parseUnits("50", 18));

    // Approve transaction
    await mok.connect(addr1).approve(lottery.address, parseUnits("20", 18));
   
    // Enter lottery
    await lottery.connect(addr1).enter(parseUnits("20", 18));

  });

  it("Should only let owner or manager pick winner", async function () {


    // Assert false since neither owner or manager is calling pickWinner
    await expect(
      lottery.connect(addr4).pickWinner()
    ).to.be.revertedWith("Only the owner or a manager can pick a winner!");
    
    // Set manager accounts
    await lottery.setManager(addr4.address);

    // Check if pickWinner function runs
    await lottery.connect(addr4).pickWinner();
    let balance = await mok.balanceOf(addr1.address);
    expect(balance).to.equal(parseUnits("49", 18));
  });

  it("Should not let revoked manager to pick winner", async function () {
    
    // Set manager accounts
    await lottery.setManager(addr4.address);

    // Remove manager account
    await lottery.removeManager(addr4.address);

    // Assert false since neither owner or manager is calling pickWinner
    await expect(
      lottery.connect(addr4).pickWinner()
    ).to.be.revertedWith("Only the owner or a manager can pick a winner!");

  });
});
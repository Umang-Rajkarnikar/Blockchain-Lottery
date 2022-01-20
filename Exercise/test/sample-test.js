const { expect } = require("chai");
const { ethers } = require("hardhat");

// describe("Greeter", function () {
//   it("Should return the new greeting once it's changed", async function () {
//     const Greeter = await ethers.getContractFactory("Greeter");
//     const greeter = await Greeter.deploy("Hello, world!");
//     await greeter.deployed();

//     expect(await greeter.greet()).to.equal("Hello, world!");

//     const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

//     // wait until the transaction is mined
//     await setGreetingTx.wait();

//     expect(await greeter.greet()).to.equal("Hola, mundo!");
//   });
// });

// describe("MOKToken", function() {
//   it("Should assign the total supply of tokens (1000) to the owner", async function () {
//     const [owner] = await ethers.getSigners();

//     const MOK = await ethers.getContractFactory("MOKToken");
//     const hardhatMOK = await MOK.deploy();

//     const ownerBalance = await hardhatMOK.balanceOf(owner.address);
//     expect(ownerBalance).to.equal(1000);
//   });

//   it("Should transfer tokens between accounts", async function () {
//     const [owner, addr1, addr2] = await ethers.getSigners();

//     const MOK = await ethers.getContractFactory("MOKToken");
//     const hardhatMOK = await MOK.deploy();

//     // Transfer
//     await hardhatMOK.transfer(addr1.address, 50);
//     expect(await hardhatMOK.balanceOf(addr1.address)).to.equal(50);
//     expect(await hardhatMOK.balanceOf(owner.address)).to.equal(950);

//   });
// });

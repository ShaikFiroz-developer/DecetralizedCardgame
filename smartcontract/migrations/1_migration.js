const GameContract = artifacts.require("GameContract");

module.exports = async function (deployer) {
  await deployer.deploy(GameContract);
  GameContract.deployed();
};

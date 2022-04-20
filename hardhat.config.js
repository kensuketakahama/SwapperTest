const { alchemyApiKey, RINKERBY_PRIVATE_KEY } = require('./secrets.json');
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 require("@nomiclabs/hardhat-waffle");
 
 module.exports = {
   solidity: "0.7.3",
   networks: {
     ropsten: {
       url: `https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`,
       accounts: [`${RINKERBY_PRIVATE_KEY}`]
     }
   }
 };
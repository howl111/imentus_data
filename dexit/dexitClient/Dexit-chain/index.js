var Web3 = require('web3');
var provider = 'https://testnet.dexit.network';
var web3Provider = new Web3.providers.HttpProvider(provider);
var web3 = new Web3(web3Provider);

web3.eth.getChainId().then((result) => {
  console.log("Latest Ethereum Block is ",result);
});

web3.eth.getBlockNumber().then((result) => {
  console.log("Latest Ethereum Block is ",result);
});

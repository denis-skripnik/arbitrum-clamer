const os = require('os');
const axios = require('axios');
const fs = require('fs');
const conf = require('./config.json');
const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(conf.rpc);

// Получаем приватники и адреса.
const pks = fs.readFileSync('data/private_keys.txt', 'utf8').split(os.EOL).filter((pk) => pk !== '');
const addresses = fs.readFileSync('data/addresses.txt', 'utf8').split(os.EOL).filter((address) => address !== '');

// Получаем abi.
const contractAbi = require('./abi/claim')
const contractAddress = conf.claim_contract;
const tokenAbi = require('./abi/token');
const { exit } = require('process');
const tokenAddress = conf.token_contract;

// Хранилище результатов работы.
let working = {};

// Действия.
async function actions(privateKey, toAddress, l) {
  if (!working[l] || typeof working[l] === 'undefined') working[l] = [0, 0];

  try {
  // Подключаем приватный ключ.
    const wallet = new ethers.Wallet(privateKey, provider);
  const address = wallet.address; // Получаем адрес.
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet); // Контракт токена.
  const contract = new ethers.Contract(contractAddress, contractAbi, wallet); // Контракт клейма.

  // Если claim успешного не было.
  if (working[l][0] === 0) {
    // Вычисляем gas_limit:
const claimGasLimit = await contract.estimateGas.claim();
    try {
      const increasedClaimGasLimit = claimGasLimit.add(conf.plus_gas_limit);
    
  // Выполняем клейм.
    const tx = await contract.claim({ gasLimit: increasedClaimGasLimit});
  
  // Ожидаем завершения:
    const receipt = await tx.wait();
    console.log('Transaction successful:', receipt.transactionHash);
    working[l][0] = 1;
  } catch(err) {
      console.error(err);
    }
  } // end if working[l][0] === 0.

  // Если перевода успешного не было, выполняем.
  if (working[l][1] === 0) {
    try {
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals(); // получаем количество десятичных разрядов токена
      const balanceInUnits = balance.div(ethers.BigNumber.from(10).pow(decimals)); // преобразуем баланс в единицы, соответствующие десятичным разрядам
      console.log('Token balance:', balanceInUnits.toString(), 'in', address);
      if (typeof toAddress === 'undefined' || !ethers.utils.isAddress(toAddress) || balance.eq(0)) return;
      const valueInUnits = ethers.BigNumber.from(balanceInUnits).mul(ethers.BigNumber.from(10).pow(decimals)); // преобразуем значение в минимальные единицы токена
      const transferGasLimit = await tokenContract.estimateGas.transfer(toAddress, valueInUnits);
      const increasedTransferGasLimit = transferGasLimit.add(conf.plus_gas_limit);
      const sendTx = await tokenContract.transfer(toAddress, valueInUnits, { gasLimit: increasedTransferGasLimit});
      const sendReceipt = await sendTx.wait();
      working[l][1] = 1;
    } catch(err) {
      console.error(err);
    }
  } // end if working[l][1] === 0.
} catch(e) {
  console.error(e);
}
return working[l][0] + working[l][1];
}

async function main() {
  console.log('Started...');
      const promises = [];
    
      working = JSON.parse(fs.readFileSync('data/working.json', 'utf8'));
      for (let l = 0; l < pks.length; l++) {
          let address;
          if (typeof addresses[l] !== 'undefined') {
            address = addresses[l];
          } else {
            address = addresses[addresses.length - 1];
          }
          if (!address) {
            address = undefined;
          }
        promises.push(actions(pks[l], address, l));
      }
  let res = await Promise.all(promises);
  if (res.includes(1) || res.includes(0)) {
    fs.writeFileSync('data/working.json', JSON.stringify(working));
    await main()
  } else {
    working = {};
    fs.writeFileSync('data/working.json', JSON.stringify(working));
    exit;
  }
    }
main();
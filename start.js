const os = require('os');
const axios = require('axios');
const fs = require('fs');
const conf = require('./config.json');
let interval = 5000;
const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(conf.rpc);

// Получаем приватники и адреса.
const pks = fs.readFileSync('data/private_keys.txt', 'utf8').split(os.EOL).filter((pk) => pk !== '');
const addresses = fs.readFileSync('data/addresses.txt', 'utf8').split(os.EOL).filter((address) => address !== '');

const { Worker, isMainThread, parentPort } = require('worker_threads');

// Получаем abi.
const contractAbi = require('./abi/claim')
const contractAddress = conf.claim_contract;
const tokenAbi = require('./abi/token');
const { exit } = require('process');
const tokenAddress = conf.token_contract;

// Проверка блока:
async function checkBlockCountdown() {
  let url = 'https://api.etherscan.io/api?module=block&action=getblockcountdown&blockno=16590400';
  if (typeof conf.apikey !== 'undefined' && conf.apikey !== '') {
    url += `&apikey=${conf.apikey}`;
    interval = 1000;
  }
try {
  const response = await axios.get(url);
  const result = response.data.result;
  if (result === 'Error! Block number already pass') {
    console.log('Block number already passed, start thread creation');
    return true;
  } else {
    console.log('Block number not yet reached, skipping creation threads');
    return false;
  }
} catch(e) {
  return false;
}
}

async function actions(privateKey, toAddress) {
  try {
  // Подключаем приватный ключ.
    const wallet = new ethers.Wallet(privateKey, provider);
  const address = wallet.address; // Получаем адрес.
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet); // Контракт токена.
  const contract = new ethers.Contract(contractAddress, contractAbi, wallet); // Контракт клейма.

// Вычисляем gas_limit:
const currentGasLimit = await provider.getBlock('latest').then((block) => block.gasLimit);
const increasedGasLimit = currentGasLimit.add(conf.plus_gas_limit);

  // Выполняем клейм.
  const tx = await contract.claim({ gasLimit: increasedGasLimit });

// Ожидаем завершения:
  const receipt = await tx.wait();
  console.log('Transaction successful:', receipt.transactionHash);
  const balance = await tokenContract.balanceOf(address);
  const decimals = await tokenContract.decimals(); // получаем количество десятичных разрядов токена
  const balanceInUnits = balance.div(ethers.BigNumber.from(10).pow(decimals)); // преобразуем баланс в единицы, соответствующие десятичным разрядам
  console.log('Token balance:', balanceInUnits.toString(), 'in', address);
  if (typeof toAddress === 'undefined' || !ethers.utils.isAddress(toAddress) || balance.eq(0)) return;
  const valueInUnits = ethers.BigNumber.from(balanceInUnits).mul(ethers.BigNumber.from(10).pow(decimals)); // преобразуем значение в минимальные единицы токена
  const sendTx = await tokenContract.transfer(toAddress, valueInUnits, { gasLimit: increasedGasLimit });
    const sendReceipt = await sendTx.wait();
console.log('Transaction successful:', sendReceipt.transactionHash);
} catch(e) {
  console.error(e);
}
  parentPort.postMessage('Finish');
}

async function main() {
  const shouldCreateThreads = await checkBlockCountdown();
  if (shouldCreateThreads) {
    if (isMainThread) {
      // этот код выполнится в главном потоке
    
      const workers = [];
    
      for (let l = 0; l < pks.length; l++) {
        const worker = new Worker(__filename);
        worker.on('message', (result) => {
          console.log(`Received result from worker ${l}: ${result}`);
        });
        let address;
        if (typeof addresses[l] !== 'undefined') {
          address = addresses[l];
        } else {
          address = addresses[addresses.length - 1];
        }
        if (!address) {
          address = undefined;
        }
        worker.postMessage({pk: pks[l], address});
        workers.push(worker);
      }
    } else {
      // этот код выполнится в worker thread
      parentPort.on('message', async (message) => {
        const result = await actions(message.pk, message.address);
      });
    
    }
  }
}
main();
setInterval(main, interval);
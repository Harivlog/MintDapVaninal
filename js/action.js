const CHAIN_ID = 338; // testnet
const SMART_CONTRACT = '0x31938abD270053973E00C20C0a49336Deb0FeC28'

const connect = document.querySelector(".wallet");
const mint = document.querySelector(".mint");
const rewards = document.querySelector(".claimReward");



const EvmChains = window.evmChains;
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const CryptoComWalletProvider = window.DeFiConnect.DeFiWeb3Connector.default;

let web3Modal;
let provider;
let balance;
let connectedWallet;


function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          338: "https://cronos-testnet-3.crypto.org:8545",
        },
        network: "Cronos Testnet",
      },
    },
    deficonnect: {
        package: CryptoComWalletProvider,
        options: {
          rpc: {
            338: "https://cronos-testnet-3.crypto.org:8545",
            //25: "https://evm.cronos.org/", main net
          },
          network: "Cronos Mainnet",
        },
    },
    
  };

  web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: false,
    providerOptions,
  });
}

async function onConnect() {
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });
  await fetchAccountData();
  await getRewards();
  await getSupply();
}

async function addNetwork(){
  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [{
    chainId: '0X152',
    chainName: 'Cronos Testnet',
    nativeCurrency: {
        name: 'Cronos',
        symbol: 'TCRO',
        decimals: 18
    },
    rpcUrls: ['https://cronos-testnet-3.crypto.org:8545'],
    blockExplorerUrls: ['https://testnet.cronoscan.com/']}]})
    .catch((error) => {
    console.log(error,'Add Network Error')
    }) 
}

async function fetchAccountData() {
  const web3 = new Web3(provider);
  const chainId = await web3.eth.getChainId();
  console.log(chainId);
  if (chainId !== 338){
   alert("Connect to the Meter Network");
   await addNetwork();
  }
  const accounts = await web3.eth.getAccounts();
  selectedAccount = accounts[0];
  connectedWallet = selectedAccount;
  sessionStorage.setItem("user wallet", connectedWallet);
  showAddress(selectedAccount);
  Balance(selectedAccount);
  console.log("selected-account", selectedAccount);
}

const Balance = async (address) => {
  const web3 = new Web3(provider);
  const bal = await web3.eth.getBalance(address);
  balance = (bal / 10 ** 18).toFixed(3);
  let Address = showAddress(address);
  connect.classList.add("connect_btn");
  connect.innerHTML = `<span>${balance} $CRO</span> <p>${Address}</p>`;
};

async function getPrice() {
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, SMART_CONTRACT);
  let mintPrice = await contract.methods.cost().call();
  console.log('mint price',mintPrice);
  return mintPrice;
}

async function getSupply() {
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, SMART_CONTRACT);
  let currentSupply = await contract.methods.totalSupply().call();
  console.log('Current Supply:',currentSupply);
  document.getElementById("totalSupply").innerHTML = 'MINTED: '+currentSupply+'</span> / 5,000';
  return currentSupply;
}

async function getRewards() {
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, SMART_CONTRACT);
  let userRewards = await contract.methods.getReflectionBalances(connectedWallet).call();
  console.log('Total Rewards WEI',userRewards);
  let etherValue = web3.utils.fromWei(userRewards, 'ether');
  console.log('Price converted',etherValue);
  document.getElementById("displayRewards").innerHTML = 'Your Rewards: <br>'+etherValue+' $CRO';  
  return etherValue;
}

async function checkSale() {
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, SMART_CONTRACT);
  let saleState = await contract.methods.paused().call();
  console.log('Sale Paused:',saleState);
  return saleState;
}


function showAddress(num) {
  const firstAddressPart = shortener(num, 0, 6);
  const lastAddressPart = shortener(num, 36, 42);
  return `${firstAddressPart}...${lastAddressPart}`;
}

const shortener = (_data, _start, _end) => {
  let result = "";
  for (let i = _start; i < _end; i++) result = [...result, _data[i]];

  return result.join("");
};



const Mint = async () => {
  let sale_paused = await checkSale();
  if(sale_paused == false)
  {
    const web3 = new Web3(provider);
    let Contract = web3.eth.Contract;
    let contract = new Contract(abi, SMART_CONTRACT);
    let amount = document.querySelector(".amount").value;
    amount = parseInt(amount);
    let price = await getPrice();
    if (amount > 0) {
    mint.classList.add("mint_btn");
    mint.innerHTML = `<button class="button primary-button">Minting ${amount} Apes</button>`;
    let mintTransaction = contract.methods.mint(amount).send({
        from: connectedWallet,
        value: price * amount,
      });
      if(await mintTransaction)
      {
        await getRewards();
        await getSupply();
        mint.classList.add("mint_btn");
        mint.innerHTML = `<button class="button primary-button" id="mint_btn">MINT NOW</button>`;
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Your Apes have been minted!',
            showConfirmButton: false,
            timer: 2500
          })
      }
      else
      {
          mint.classList.add("mint_btn");
        mint.innerHTML = `<button class="button primary-button" id="mint_btn">MINT NOW</button>`;
        Swal.fire({
            icon: 'error',
            title: 'Transaction Failed',
            text: 'Please contact a team member.!'
          })
      }
    } else {
        Swal.fire('Enter a valid token amount.')
    }
  }
  else
  {
    Swal.fire('Sale has not started yet.')
  }
};


const Claim = async () => {
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, SMART_CONTRACT);
  let balance = await getRewards();
  let tokenBalance = contract.methods.balanceOf(connectedWallet).call();
  if (balance) {
    let claimTransaction = contract.methods.claimAllRewards().send({
      from: connectedWallet,
    });
    if(await claimTransaction)
    {
      await getRewards();
      await getSupply();
      Swal.fire(
        'Claimed',
        'Your $CRO is now in your wallet.?',
        'success'
      )
    }
    else
    {
     Swal.fire('Transaction Failed');
    }
  } else {
    Swal.fire("You do not have any rewards to claim.");
  }
};

window.addEventListener("load", () => {
  init();
  localStorage.clear()
  sessionStorage.clear()
});


connect.addEventListener("click", function () {
  if (!balance) {
    onConnect();
  }
});

mint.addEventListener("click", () => {
  if (balance) {
    Mint();
  } else {
    onConnect();
  }
});

rewards.addEventListener("click", () => {
  if (balance) {
    Claim();
  } else {
    onConnect();
  }
});
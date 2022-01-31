import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Topnavbar } from './Topnavbar';
import { FC, useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  getLedgerWallet,
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletExtensionWallet,
  getSolletWallet,
  getTorusWallet,
} from '@solana/wallet-adapter-wallets';
import { BrowserRouter as Router, Routes , Route, Link} from 'react-router-dom';
import {Stake} from './Stake';
import axios from 'axios';
import { clusterApiUrl,LAMPORTS_PER_SOL } from '@solana/web3.js';
import {Mintnft} from './Mintnft';
import { DSBApp } from './DSBApp';
import { Claim } from './Claim';


require('@solana/wallet-adapter-react-ui/styles.css');



//axios.defaults.withCredentials = true;
//axios.defaults.headers.common['Authorization'] = "Bearer "+process.env.REACT_APP_API_TOKEN

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [
    getPhantomWallet(),
    getSlopeWallet(),
    getSolflareWallet(),
    getTorusWallet({
        options: { clientId: 'Get a client ID @ https://developer.tor.us' }
    }),
    getLedgerWallet(),
    getSolletWallet({ network }),
    getSolletExtensionWallet({ network }),
], [network]);
  
  const [collection,setCollection] = useState("");  
  console.log(collection);
  return (
    <div className="App">
      <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <Router>
        <Topnavbar collection={collection} setCollection={setCollection} />
        <Routes>
          <Route exact path="/" element={<Mintnft collection={collection}/>} />
          <Route path="/stake" element={<Stake/>}/>
          <Route path="/dsb" element={<DSBApp/>}/>
          <Route path="/claim" element={<Claim/>}/>
        </Routes>
        </Router>
      </WalletProvider>
      
      </ConnectionProvider>
    </div>
  );
}

export default App;

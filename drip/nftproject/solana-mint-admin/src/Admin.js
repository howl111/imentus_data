import {useMemo,createContext} from 'react';
import { Drawer } from './Drawer';
import { NFTForm } from './NFTForm';
import { CsvUpload } from './CsvUpload';
import { BrowserRouter as Router, Routes , Route, Link} from 'react-router-dom';
import { NFTGrid } from './NFTGrid';
import { Collection } from './Collection';
import { EditUpload } from './EditUpload';
import { Snapshot } from './Snapshot';
import logo from './Winitlogo.png';
import { CandyMachine } from './CandyMachine';
import { NewAirdrop } from './NewAirdrop';
import {Coins} from './Coins';
import {Stake} from './Stake';
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
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');



export const Admin = (props) => {
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
    // Only the wallets you configure here will be compiled into your application
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

    return (
        <div>
    
        <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src={logo} className="logo"/>
            Admin
          </a>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item wallet mr-2">
            <WalletModalProvider>
              <WalletMultiButton />
              <WalletDisconnectButton />
            </WalletModalProvider>
            </li>
            <li className="nav-item me-auto">
                <button className="btn btn-link" onClick={()=>localStorage.removeItem("jwt")}>Logout</button>
            </li>
          </ul>
          </div>
          </div>
          </nav>
        <div className="App">
          
          <Router>
          <Drawer/>
          <Routes>
            <Route path="/upload-nft/:name" element={<NFTForm/>}/>
            <Route path="/add-edit-collection" element={<CsvUpload/>}/>
            <Route path="/add-edit-collection/:name" element={<EditUpload/>}/>
            <Route path="/collections" element={<NFTGrid/>}/>
            <Route path="/collection/:name" element={<Collection/>}/>
            <Route path="/mint/:name" element={<CandyMachine/>}/>
            <Route path="/snapshot/:name" element={<Snapshot/>}/>
            <Route path="/airdrop/:name" element={<NewAirdrop/>}/>
            <Route path="/coins" element={<Coins/>}/>
            <Route path="/stake" element={<Stake/>}/> 
          </Routes>
          </Router>
        </div>
        </WalletProvider>
        </ConnectionProvider>
        </div>
        
      );
}
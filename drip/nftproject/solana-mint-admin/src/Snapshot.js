import {useState,useEffect} from 'react';
import * as anchor from '@project-serum/anchor';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {Link} from 'react-router-dom';
import { NewAirdrop } from './NewAirdrop';
import { useWallet } from '@solana/wallet-adapter-react';
import { useLocation } from 'react-router-dom';
export const Snapshot = () => {
    const [wallets,setWallets] = useState([]);
    const [loading,setLoading] = useState("Fetching wallets");
    const {name} = useParams();
    const {state} = useLocation();
    const {sendTransaction,publicKey} = useWallet();
    useEffect(async ()=>{
        const res = await axios.get('/getconfig/'+name);
        const data = await res.data;
        const connection = new anchor.web3.Connection("https://api.devnet.solana.com")
        const w = [];
        for(const i of data.mint_keys) {
            const accounts = await connection.getTokenLargestAccounts(new anchor.web3.PublicKey(i),"max");
            const parsed = await connection.getParsedAccountInfo(accounts.value[0].address); 
            w.push(parsed.value.data.parsed.info.owner);
              
        }
        console.log(w);
        setWallets(w);
        if(wallets.length == 0) {
            setLoading("No wallets found");
        }
    },[]);
    
    return <div>
        <div className="flexible-gap">
            <p className="pagetitle">Collection {state.name} <br/> {state.pagename}</p>
            <Link to={"/airdrop/"+name} state={{wallets,name:state.name}}><button className="btn btn-primary">Create Airdrop</button></Link>
        </div>
        <ul class="list-group">
        {wallets.length == 0 && <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
        </div>}
        {wallets.length > 0 && wallets.map((i)=><li className="list-group-item">Wallet {i}</li>)}
        </ul>
    </div>
}
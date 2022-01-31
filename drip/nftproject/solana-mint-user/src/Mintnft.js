import { NFTCard } from './NFTCard.js';
import axios from 'axios';
import * as anchor from '@project-serum/anchor';
import { useState,useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
    'cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ',
  );

export const Mintnft = (props) => {
  const [current,setCurrent] = useState(0);
  
  const [candyMachine,setCandymachine] = useState({
    price: "",
    liveDate: "",
    itemsRemaining: "",
    itemsRedeemed: ""
  })
  const [minted,setMinted] = useState(false);
  const anchorWallet = useWallet();
  const collection = props.collection.replace(/ /g,"");
  useEffect(async ()=>{
    console.log(collection);
    if(collection.length > 0) {
    const result = await fetch(process.env.REACT_APP_API_ENDPOINT+"/totalnfts/"+collection);
    const data = await result.text();
    const total = parseInt(data);
    console.log(total);
    let id = setInterval(()=>setCurrent(parseInt(Math.random()*10)%total),5000);
    return () => clearInterval(id);
    }
  },[props.collection]);
  
  async function loadCandymachineState(){
    const result  = await axios.get(process.env.REACT_APP_API_ENDPOINT+'/candymachineconfig/'+collection);
    const cm = await result.data;
    console.log(typeof(cm));
    if(typeof(cm) !== "string") {
      setMinted(true);
    let candyMachineId = new anchor.web3.PublicKey(cm.candyMachineAddress);
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");

    const provider = new anchor.Provider(connection, anchorWallet, {
      preflightCommitment: "recent",
    });
    
    const idl = await anchor.Program.fetchIdl(
      CANDY_MACHINE_PROGRAM,
      provider
    );
    
    const program = new anchor.Program(idl, CANDY_MACHINE_PROGRAM, provider);
    const state = await program.account.candyMachine.fetch(candyMachineId);
    const itemsAvailable = state.data.itemsAvailable.toNumber();
    const itemsRedeemed = state.itemsRedeemed.toNumber();
    const itemsRemaining = itemsAvailable - itemsRedeemed;
    const price = state.data.price.toNumber();
    
    let goLiveDate = state.data.goLiveDate.toNumber();
    goLiveDate = new Date(goLiveDate * 1000);
    setCandymachine({price,liveDate:goLiveDate.toString(),itemsRedeemed,itemsRemaining})
    
    } else {
      setMinted(false);
    }
  }
  useEffect(loadCandymachineState,[props.collection]);
    return <div>

        <NFTCard minted={minted} reload={()=>setTimeout(loadCandymachineState(),5000)} collection={props.collection} current={current}/>
        
        { minted ?  <div className="status">
             <p>Price {candyMachine.price/LAMPORTS_PER_SOL} SOL </p>
             <p>Live Date {candyMachine.liveDate}</p>
             <p>Already Minted {candyMachine.itemsRedeemed}</p>
             <p>Available {candyMachine.itemsRemaining}</p>
           </div>: <p> Not minted using candy machine </p>}
    </div>
}
import {useState, useEffect} from 'react';
import axios from 'axios';
import * as anchor from '@project-serum/anchor';
import {useWallet} from '@solana/wallet-adapter-react';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { PublicKey } from '@solana/web3.js';
import { from } from 'pumpify';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const Stake = () => {
    const [collections,setCollections] = useState([]);
    
    const [form,setForm] = useState({
        collection:"",
        reward:""
    })
    useEffect(async ()=>{
        const res = await axios.get("/collections");
        const data = await res.data;
        setCollections(data); 
    },[])

    const wallet = useWallet();

    const enable = async () => {
        if(!wallet.publicKey) { alert("Error wallet not connected"); return;}
        const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
        const provider = new anchor.Provider(connection, wallet, {
            preflightCommitment: "recent",
        });
        const programid = new anchor.web3.PublicKey("8tDakg4UmLm684GzzPCMFvSR9ooQx52fmbeC47dD4yU7");
        const res = await axios.get(process.env.REACT_APP_API_ENDPOINT+"/stakeidl");
        const idl = await res.data;
        const program = new anchor.Program(idl, programid, provider);
        console.log(program);
        console.log("programid",program.programId);
        const [collections,bump] = (await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],program.programId));
        console.log(collections,bump); 
        console.log(wallet.publicKey.toString());
        //console.log(await program.rpc.setAdmin(bump,{accounts:{wallet:wallet.publicKey,eligible:collections,systemProgram:anchor.web3.SystemProgram.programId}}));
        console.log(wallet.publicKey);
        console.log(collections,bump);
        console.log(form.collection);
        const eligible = await program.rpc.addCollection(form.collection,bump,{accounts:{wallet:wallet.publicKey,eligible:collections}});
    }

    const mint = async () => {
        if(!wallet.publicKey) { alert("Error wallet not connected"); return;}
        const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
        const provider = new anchor.Provider(connection, wallet, {
            preflightCommitment: "recent",
        });
        const programid = new anchor.web3.PublicKey("8tDakg4UmLm684GzzPCMFvSR9ooQx52fmbeC47dD4yU7");
        const res = await axios.get(process.env.REACT_APP_API_ENDPOINT+"/stakeidl");
        const idl = await res.data;
        const program = new anchor.Program(idl, programid, provider);
        console.log(programid.toString());
        const [eligible,bump] = (await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],programid));
        const [mint,mintbump] = await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("mint"))],programid);
        const [token,tokenbump] =  await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("reward"))],programid);
        const payer = anchor.web3.Keypair.generate();
        await connection.requestAirdrop(
            payer.publicKey,
            anchor.web3.LAMPORTS_PER_SOL,
    
        );
        console.log(eligible.toString());
        await program.rpc.mintReward(mintbump,tokenbump,bump,{
            accounts: {
                payer: payer.publicKey,
                eligible,
                mint,
                tokenAccount: token,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [payer]
        })
    }

    const setadmin = async () => {
        if(!wallet.publicKey) { alert("Error wallet not connected"); return;}
        const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
        const provider = new anchor.Provider(connection, wallet, {
            preflightCommitment: "recent",
        });
        const programid = new anchor.web3.PublicKey("8tDakg4UmLm684GzzPCMFvSR9ooQx52fmbeC47dD4yU7");
        const res = await axios.get(process.env.REACT_APP_API_ENDPOINT+"/stakeidl");
        const idl = await res.data;
        const program = new anchor.Program(idl, programid, provider);
        const [collections,bump] = (await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],program.programId));
        await program.rpc.setAdmin(bump,{
            accounts: {
                wallet: wallet.publicKey,
                eligible: collections,
                systemProgram: anchor.web3.SystemProgram.programId
            }
        })
    }

    return <div className="container">
    <p className="pagetitle">Enable Staking</p>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Collection</label>
      <div class="col-sm-8">
        <select className="form-select" onChange={(e)=>setForm({...form,collection:e.target.value})}>
            <option value="1">Choose Collection</option>
            {collections.map((i)=><option value={i}>{i}</option>)}           
        </select>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Reward Type</label>
      <div class="col-sm-8">
        <select className="form-select" onChange={(e)=>setForm({...form,reward:e.target.value})}>
            <option value="0">Choose Reward</option>
            <option value="NFT">NFT</option>
            <option value="Coin">Coin</option>     
        </select>
      </div>
    </div>
    <button className="btn btn-primary me-2" onClick={()=>enable()}>Enable</button>
    <button className="btn btn-primary me-2" onClick={()=>mint()}>Mint Reward</button>
    <button className="btn btn-primary me-2" onClick={()=>setadmin()}>Set Admin</button>
    </div>
}
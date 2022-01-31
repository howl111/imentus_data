import { useEffect, useState } from "react"
import * as anchor from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
import { useWallet } from "@solana/wallet-adapter-react";
import { parse } from "peer-id";
import axios from "axios";
export const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  );
export const Coins = () => {
    const [form,setForm] = useState({
        name: "",
        symbol: "",
        supply: 0,
        decimals: 0
    });
    const [tokens,setTokens] = useState([]);
    const [progress,setProgress] = useState(0);
    const [alert,setAlert] = useState(false);
    const [failedAlert,setFailedAlert] = useState(false);

    const {publicKey} = useWallet();
    useEffect(async ()=>{
        const res = await axios.get("/coins");
        const data = await res.data;
        setTokens(data);
    },[])
    const mint = async () => {
        if(!publicKey) {
          setAlert(true);
          setTimeout(()=>setAlert(false),3000);
          return;
        }
        console.log(form.supply)
        const connection = new anchor.web3.Connection("https://api.devnet.solana.com")
        const transaction = new anchor.web3.Transaction();
        let mint = undefined;
        let fromTokenAccount = undefined;
        let from = anchor.web3.Keypair.generate();
        var fromAirdropSignature = await connection.requestAirdrop(
            from.publicKey,
            anchor.web3.LAMPORTS_PER_SOL,
        );
        setProgress("10");
        await connection.confirmTransaction(fromAirdropSignature);
        setProgress("20");
        mint = await splToken.Token.createMint(
            connection,
            from,
            from.publicKey,
            null,
            parseInt(form.decimals),
            splToken.TOKEN_PROGRAM_ID,
        );
        setProgress("40");
        fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(publicKey);
        setProgress("50");
        await mint.mintTo(
            fromTokenAccount.address, //who it goes to
            from.publicKey, // minting authority
            [], // multisig
            parseInt(form.supply), // how many
        );
        setProgress("70");      
        await mint.setAuthority(
            mint.publicKey,
            null,
            "MintTokens",
            from.publicKey,
            []
        )
        setProgress("100");
        setFailedAlert(true);
        setTimeout(()=>setFailedAlert(false),3000);
        /* global BigInt */
        const data = {name:form.name,symbol:form.symbol,supply:parseInt(form.supply),token:mint.publicKey.toString(),decimals:parseInt(form.decimals)};
        const res = await axios.post("/coins",data);
        setTokens([...tokens,data]);
    }
    return <div>
         {alert && <div class="alert alert-primary" role="alert">
        Please, connect your wallet
      </div>}
      {failedAlert && <div class="alert alert-primary" role="alert">
        Unable to Mint new coin
      </div>}
        <p className="pagetitle">Manage Coins</p>
        <div>
        <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Token Name</label>
      <div class="col-sm-8">
        <input name="tokenname" className="form-control" type="text" onChange={(e)=>setForm({...form,name:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Token Symbol</label>
      <div class="col-sm-8">
        <input name="tokensymbol" className="form-control" type="text" onChange={(e)=>setForm({...form,symbol:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Supply</label>
      <div class="col-sm-8">
        <input name="tokensupply" className="form-control" type="number" onChange={(e)=>setForm({...form,supply:e.target.value})}></input>
      </div>
    </div>
    
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Decimals</label>
      <div class="col-sm-8">
        <input name="tokendecimal" className="form-control" type="number" onChange={(e)=>setForm({...form,decimals:e.target.value})}></input>
      </div>
    </div>
    </div>
    <button className="btn btn-primary" onClick={()=>mint()}>Mint</button>
    <p className="pagetitle mt-5">Minting progress</p>
    <div class="progress" style={{height:"10%"}}>
  
    <div class="progress-bar" role="progressbar" style={{width:progress+"%"}} aria-valuenow={""+progress} aria-valuemin="0" aria-valuemax="100">{progress}</div>
    </div>
    <p className="pagetitle mt-5">Existing coins</p>
    <table className="table">
        <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Symbol</th>
                <th scope="col">Supply</th>
                <th scope="col">Token</th>
            </tr>
        </thead>
        <tbody>
            {tokens && tokens.map((i,row)=>{
                return <tr>
                    <th scope="row">{row}</th>
                    <td>{i.name}</td>
                    <td>{i.symbol}</td>
                    <td>{i.supply}</td>
                    <td>{i.token}</td>
                </tr>
            })}
        </tbody>
  </table>
        
    
    </div>
}
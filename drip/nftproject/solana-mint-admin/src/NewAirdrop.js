import {useEffect, useState} from 'react';
import axios from 'axios';
import * as splToken from '@solana/spl-token';
import { mintNFT } from './mint';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
import { useLocation, useParams } from 'react-router-dom';
import {SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_PROGRAM_ID,METADATA_PROGRAM_ID,} from './mint.js'
import {Token, MintLayout} from '@solana/spl-token';
import { PublicKey,  LAMPORTS_PER_SOL} from '@solana/web3.js';
import { sendTransactions } from './sendTransactions';

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(METADATA_PROGRAM_ID);
const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
    'cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ',
  );

const getTokenWallet = async (
    wallet,
    mint
  ) => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      )
    )[0];
  };


const getMetadata = async (
    mint
  ) => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  }


const getMasterEdition = async (
    mint
  ) => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress,
    payer,
    walletAddress,
    splTokenMintAddress
  ) => {
    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
      { pubkey: walletAddress, isSigner: false, isWritable: false },
      { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
      {
        pubkey: anchor.web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    return new anchor.web3.TransactionInstruction({
      keys,
      programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      data: Buffer.from([]),
    });
  }


export const NewAirdrop = (props) => {
    const [form,setForm] = useState({
        current: "1",
        amount: "",
        accounts: "1",
        collection: "",
        mint: ""
    })
    const [collections,setCollections] = useState([]);
    const {publicKey,sendTransaction} = useWallet();
    const [tokens,setTokens] = useState([]);
    useEffect(async ()=>{
        const res = await axios.get("/collections");
        const data = await res.data;
        setCollections(data); 
    },[])

    const choice = parseInt(form.current);

    useEffect(async ()=>{
        const res = await axios.get("/coins");
        const data = await res.data;
        setTokens(data);
    },[publicKey])
    const wallet = useWallet();
    
    const anchorWallet = {publicKey,sendTransaction,sendTransactions};
    const data = useLocation();
    const {name} = useParams();
    async function airdrop(type) {
        
        console.log(type);
        
        const connection = new anchor.web3.Connection("https://api.devnet.solana.com")
        const transaction = new anchor.web3.Transaction();
        
        
        
        let fromTokenAccount = undefined;
        let account = undefined;
        if(type == 2) {
            console.log(tokens[parseInt(form.mint)].token);
            let mint = new anchor.web3.PublicKey(tokens[parseInt(form.mint)].token);
            let acc = await connection.getTokenLargestAccounts(mint);
            console.log(acc);
            let acc2 = await connection.getParsedAccountInfo(acc.value[0].address);
            console.log(acc2.value.data.parsed.info.owner);
            account = new anchor.web3.PublicKey(acc2.value.data.parsed.info.owner);
            fromTokenAccount = acc.value[0].address;
        }
        let from = anchor.web3.Keypair.generate();
        var fromAirdropSignature = await connection.requestAirdrop(
            from.publicKey,
            anchor.web3.LAMPORTS_PER_SOL,
        );
        const wallets = data.state.wallets;
        await connection.confirmTransaction(fromAirdropSignature);
        if(type == 3) {
            
            const payer = publicKey;
            const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
            const provider = new anchor.Provider(connection, anchorWallet, {
                preflightCommitment: "recent",
            });
    
            const idl = await anchor.Program.fetchIdl(
                CANDY_MACHINE_PROGRAM,
                provider
            );
            console.log(form.collection);
            const program = new anchor.Program(idl, CANDY_MACHINE_PROGRAM, provider);
            const result  = await axios.get(process.env.REACT_APP_API_ENDPOINT+'/candymachineconfig/'+form.collection);
            const cm = await result.data;
            if(typeof(cm) === "string") {
              alert("Selected collection doesnt have candy machine");
              return;
            }
            const candyMachine = {connection,program,id:new anchor.web3.PublicKey(cm.candyMachineAddress)};
            const config = new anchor.web3.PublicKey(cm.program.config);
            const treasury = new anchor.web3.PublicKey(cm.authority);
            const signersMatrix = [];
            const instructionsMatrix = [];
            const quantity = 3;
            
            for (let index = 0; index < parseInt(form.accounts); index++) {
                const mint = anchor.web3.Keypair.generate();
                const token = await getTokenWallet(new anchor.web3.PublicKey(wallets[index]), mint.publicKey);
                const { connection } = candyMachine;
                const rent = await connection.getMinimumBalanceForRentExemption(
                  MintLayout.span
                );
                const instructions = [
                  anchor.web3.SystemProgram.createAccount({
                    fromPubkey: payer,
                    newAccountPubkey: mint.publicKey,
                    space: MintLayout.span,
                    lamports: rent,
                    programId: TOKEN_PROGRAM_ID,
                  }),
                  Token.createInitMintInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    0,
                    payer,
                    payer
                  ),
                  createAssociatedTokenAccountInstruction(
                    token,
                    payer,
                    new anchor.web3.PublicKey(wallets[index]),
                    mint.publicKey
                  ),
                  Token.createMintToInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    token,
                    payer,
                    [],
                    1
                  ),
                ];
                const masterEdition = await getMasterEdition(mint.publicKey);
                const metadata = await getMetadata(mint.publicKey);
              
                instructions.push(
                  await candyMachine.program.instruction.mintNft({
                    accounts: {
                      config,
                      candyMachine: candyMachine.id,
                      payer: payer,
                      wallet: treasury,
                      mint: mint.publicKey,
                      metadata,
                      masterEdition,
                      mintAuthority: payer,
                      updateAuthority: payer,
                      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                      tokenProgram: TOKEN_PROGRAM_ID,
                      systemProgram: anchor.web3.SystemProgram.programId,
                      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                    }
                  }),
                );
                const signers = [mint];
            
                signersMatrix.push(signers)
                instructionsMatrix.push(instructions)
              }
              console.log(instructionsMatrix);
              console.log(candyMachine);
              return await sendTransactions(
                candyMachine.program.provider.connection,
                wallet,
                instructionsMatrix,
                signersMatrix,
              );
              
        }
        console.log(data);
        for(let i=0;i<parseInt(form.accounts);i++) {
            if(type == 2) {   
                console.log("newmint")
                console.log(wallets[i]);
                let mint = new anchor.web3.PublicKey(tokens[parseInt(form.mint)].token);
                const token = await getTokenWallet(new anchor.web3.PublicKey(wallets[i]), mint);
                console.log("token",token.toString(),fromTokenAccount.toString(),account.toString());
                const acc = await connection.getAccountInfo(token);
                if(acc == null)
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        token,
                        publicKey,
                        new anchor.web3.PublicKey(wallets[i]),
                        mint)
                )
                transaction.add(
                    splToken.Token.createTransferInstruction(
                        splToken.TOKEN_PROGRAM_ID,
                        fromTokenAccount,
                        token,
                        account,
                        [],
                        parseInt(form.amount),
                    ),
                )
            } else {
                console.log(form.amount,parseFloat(form.amount));
                transaction.add(
                    anchor.web3.SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: new anchor.web3.PublicKey(wallets[i]),
                        lamports: LAMPORTS_PER_SOL * parseFloat(form.amount)
                    })
                )
            }
        }
        try {
          let tx = await wallet.signTransaction(transaction)
          
          axios.post(process.env.REACT_APP_API_ENDPOINT+'/airdrop/schedule',{tx});
          alert("Scheduled");
        } catch(e) {
            alert("Error, please try again");
            console.log(e);
        }
    }
    return <div><p className="pagetitle">Collection {data.state.name} <br/> New Airdrop</p>
      <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Choose</label>
      <div class="col-sm-8">
        <select className="form-select" onChange={(e)=>setForm({...form,current:e.target.value})}>
            <option value="1">Sol</option>
            <option value="2">Token</option>
            <option value="3">NFT</option>
        </select>
      </div>
    </div>{choice == 3 &&
     <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Collection</label>
      <div class="col-sm-8">
        <select className="form-select" onChange={(e)=>setForm({...form,collection:e.target.value})}>
            <option value="1">Choose Collection</option>
            {collections.map((i)=><option value={i}>{i}</option>)}           
        </select>
      </div>
    </div>}
    
    {choice == 2 && <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Coin</label>
      <div class="col-sm-8">
        <select className="form-select" onChange={(e)=>setForm({...form,mint:e.target.value})}>
            <option value="1">Choose Mint</option>
            {tokens.map((i,c)=><option value={c}>{i.name}</option>)}           
        </select>
      </div>
    </div>}

    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Number of accounts</label>
      <div class="col-sm-8">
        <input name="accounts" className="form-control" type="number" onChange={(e)=>setForm({...form,accounts:e.target.value})}></input>
      </div>
    </div>
    {choice < 3 && 
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Amount</label>
      <div class="col-sm-8">
        <input name="amount" className="form-control" type="number" onChange={(e)=>setForm({...form,amount:e.target.value})}></input>
      </div>
    </div>}
    <button className="btn btn-primary" onClick={()=>airdrop(parseInt(form.current))}>Airdrop</button>
    </div>
}
import * as anchor from '@project-serum/anchor';
import { SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import axios from 'axios';
import { SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID } from './mint';
const programid = new anchor.web3.PublicKey("8tDakg4UmLm684GzzPCMFvSR9ooQx52fmbeC47dD4yU7");
export const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

export class Eligble {
    constructor(args) {
        this.admin = args.admin;
        this.collections = args.collections;
        this.current = args.current;
        this.length = args.length
    }
}

export const getProgram = async (wallet) => {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
    const provider = new anchor.Provider(connection, wallet, {
        preflightCommitment: "recent",
    });
    
    const res = await axios.get(process.env.REACT_APP_API_ENDPOINT+"/stakeidl");
    const idl = await res.data;
    const program = new anchor.Program(idl, programid, provider);
    return program;
}

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

export const stake = async (wallet,payer,mint,period,collection) => {
   
    const mintPublicKey = new anchor.web3.PublicKey(mint);
    const tokenAccount = await getTokenWallet(payer,mintPublicKey);
    console.log(tokenAccount);
    const [escrow,escrowBump] = await anchor.web3.PublicKey.findProgramAddress([mintPublicKey.toBuffer()],programid);
    const [escrowData,escrowDataBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("data")),mintPublicKey.toBuffer()],programid);
    const [eligible,eligibleBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],programid);
    const program = await getProgram(wallet);
    const signer = anchor.web3.Keypair.generate();
    console.log(program.provider.wallet);
    console.log(program.account);
    console.log(escrowBump);
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");

    await connection.requestAirdrop(
        signer.publicKey,
        anchor.web3.LAMPORTS_PER_SOL,

    );
    
    wallet.sendTransaction(
        new anchor.web3.Transaction().add(
            program.instruction.stake(new anchor.BN(escrowBump),new anchor.BN(escrowDataBump),new anchor.BN(parseInt(period)),collection,{
                accounts: {
                    wallet:signer.publicKey,
                    owner:payer,
                    escrowAccount:escrow,
                    escrowData,
                    eligible,
                    fromTokenAccount: tokenAccount,
                    mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                },
                signers: [signer]
            })
        ), connection,{signers: [signer]})

    

    

    // program.instruction.stake(new anchor.BN(parseInt(period)),collection,escrowBump,escrowDataBump,{
    //     accounts: {
    //         wallet:signer.publicKey,
    //         owner:payer,
    //         escrowAccount:escrow,
    //         escrowData: escrowData,
    //         eligible,
    //         fromTokenAccount: tokenAccount,
    //         mint,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         systemProgram: anchor.web3.SystemProgram.programId,
    //         rent: anchor.web3.SYSVAR_RENT_PUBKEY
    //     },
    //     signers: [signer]
    // })
}

export const withdraw = async (wallet,payer) => {
    const program = await getProgram(wallet);
    const [collections,bump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("soleli"))],program.programId);
    const eligible = await program.account.eligible.fetch(collections);
    const {escrow, data, mint} = eligible.store.filter((i)=>i.wallet.localeCompare(payer.publicKey.toString()))
    const tokenAccount = anchor.web3.Keypair.generate();
    program.rpc.withdraw({accounts: {
       wallet: payer,
       escrowAccount: escrow,
       tokenAccount: tokenAccount.publicKey,
       mint,
       tokenProgram: TOKEN_PROGRAM_ID,
       eligible: collections,
       data,
       systemProgram: anchor.web3.SystemProgram.programId,
       rent: anchor.web3.SYSVAR_RENT_PUBKEY
    },signers: [tokenAccount]})

}

export const claim = async (wallet, mint, owner) => {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
    const [escrow,escrowBump] = await anchor.web3.PublicKey.findProgramAddress([mint.toBuffer()],programid);
    const [escrowData,escrowDataBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("data")),mint.toBuffer()],programid);
    const [eligible,eligibleBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],programid);
    const [rmint,rmintbump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("mint"))],programid);
    const [token,tokenbump] =  await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("reward"))],programid);
    const payer = anchor.web3.Keypair.generate();
    const ownerToken = await getTokenWallet(owner,mint);
    const ownerReward = anchor.web3.Keypair.generate();
    await connection.requestAirdrop(
        payer.publicKey,
        anchor.web3.LAMPORTS_PER_SOL,

    );
    console.log(rmint.toString())
    console.log(token.toString())
    console.log(eligible.toString());
    const program = await getProgram(wallet);
    await program.rpc.claim(eligibleBump,rmintbump,{
        accounts: {
            payer: payer.publicKey,
            escrowToken: escrow,
            escrowData,
            mint,
            rewardMint: rmint,
            rewardToken:token,
            ownerReward: ownerReward.publicKey,
            owner,
            ownerToken,
            eligible,
            tokenProgram:TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        },
        signers: [payer,ownerReward]
    })
}
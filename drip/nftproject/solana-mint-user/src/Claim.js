import { Button, Table } from "reactstrap"
import { useEffect, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "./Program";
import axios from 'axios';
import {claim} from './Program';
export function Claim() {
    const [nfts,setNfts] = useState([]);
    const wallet = useWallet();
    useEffect(async ()=>{
        let array = [];
        try {
            const program = await getProgram(wallet);

            const array = [];
            const programid = new anchor.web3.PublicKey("8tDakg4UmLm684GzzPCMFvSR9ooQx52fmbeC47dD4yU7");
            const programAccount =  (await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],programid))[0];
            const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
            const nfts = await Metadata.findByOwnerV2(connection,programAccount);
            console.log(nfts);
            for (const i of nfts) {
                const res = await axios.get(i.data.data.uri);
                const data = await res.data;
                const mintPublicKey = new anchor.web3.PublicKey(i.data.mint);
                const escrowDataPublicKey = (await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("data")),mintPublicKey.toBuffer()],programid))[0];
                const escrowData = await program.account.data.fetch(escrowDataPublicKey);
                console.log(escrowData);
                if(wallet.publicKey.equals(escrowData.owner))
                    array.push({flexible:escrowData.flexible,escrowAccount:escrowData.escrowAccount,mint:mintPublicKey,name:data.name,image:data.image,stakeDate:new Date(escrowData.timestamp*1000),maturity:new Date((escrowData.withdrawtimestamp*1000+escrowData.timestamp*1000))});
            }
            console.log(array);
            setNfts(array);
        } catch(e) {
           console.log(e);
        }
    },[]);
    return <div>
        <p className="pagetitle">Claim your nft</p>
            <Table>
                <thead>
                    <tr>
                        <th>
                            #
                        </th>
                        <th>
                            Image
                        </th>
                        <th>
                            Details
                        </th>
                        <th>
                            Date of Stake
                        </th>
                        <th>
                            Date of Maturity
                        </th>
                        <th>
                            Reward
                        </th>
                        <th>
                            Claim
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {nfts.map((i,index)=><tr>
                        <th>
                          {index}
                        </th>
                        <td>
                            <img src={i.image} width="150" height="150"/>
                        </td>
                        <td>
                            <p>{i.name}</p>
                        </td>
                        <td>
                            <p>{i.stakeDate.toString()}</p>
                        </td>
                        <td>
                            <p>{i.maturity.toString()}</p>
                        </td>
                        <td>
                            <p>Coin</p>
                        </td>
                        <td>
                            <Button type="button" onClick={() => claim(wallet,i.mint,wallet.publicKey)}>{i.flexible?"Unstake":"Claim"}</Button>
                        </td>
                        </tr>)}
                </tbody>
            </Table>
        </div>
}
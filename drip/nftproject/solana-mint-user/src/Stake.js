import axios from 'axios';
import {useEffect,useState} from 'react';
import {Form,FormGroup,Label,Input,Button,Col} from 'reactstrap';
import {useWallet} from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
import { deserializeUnchecked} from 'borsh';
import { getProgram, stake } from './Program';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
export const METADATA_PROGRAM_ID = new anchor.web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
export const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  );
  const programid = new anchor.web3.PublicKey("8tDakg4UmLm684GzzPCMFvSR9ooQx52fmbeC47dD4yU7");
export const Stake = () => {
    const [collections,setCollections] = useState([]);
    const [nfts,setNfts] = useState([]);
    const wallet = useWallet();
    const [form,setForm] = useState({
        collection: "",
        nft: "",
        period: ""
    });
    useEffect(async ()=>{
        const program = await getProgram(wallet);

        const [collections,bump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],program.programId);
        const eligible = await program.account.eligible.fetch(collections);
        console.log(eligible);
        setCollections(eligible.collections);
    },[])

    useEffect(async ()=>{
        if(!wallet.publicKey) {
            alert("Error, Please connect to wallet");
            return;
        }
        let array = [];
        try {
        const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
        const nfts = await Metadata.findByOwnerV2(connection,wallet.publicKey);
        for(const i of nfts) {
            console.log(i.data.datauri);
            const res = await axios.get(i.data.data.uri);
            const data = await res.data;
            console.log(data);
            if(data.collection.name.localeCompare(form.collection) == 0)
                array.push(i);
        }
        console.log(nfts);
        setNfts(array);
        } catch(e) {
            console.log(e);
        }
        
    },[wallet.publicKey,form])

    return <div className="stake">
        <p className="pagetitle">Stake your NFT</p>
        <Form>
            <FormGroup row>
                <Label for="exampleEmail" sm={3}>
                    Collection
                </Label>
                <Col sm={8}>
                <Input
                    id="exampleSelect"
                    name="select"
                    type="select"
                    onChange={(event)=>setForm({...form,collection:event.target.value})}
                >
                    <option>Choose Collection</option>
                    {collections.map((i)=><option>{i}</option>)}
                </Input>
                </Col>
            </FormGroup>
            <FormGroup row>
                <Label for="exampleEmail" sm={3}>
                    Choose NFT
                </Label>
                <Col sm={8}>
                <Input
                    id="exampleSelect"
                    name="select"
                    type="select"
                    onChange={(event)=>setForm({...form,nft:event.target.value})}
                >
                    <option>{nfts.length == 0 ? "Fetching NFTs from wallet" : "Choose NFT"}</option>
                    {nfts.map((i,index)=><option value={index}>{i.data.data.name}</option>)}
                </Input>
                </Col>
            </FormGroup>
            <FormGroup row>
                <Label for="exampleEmail" sm={3}>
                    Choose Period
                </Label>
                <Col sm={8}>
                <Input
                    id="exampleSelect"
                    name="select"
                    type="select"
                    onChange={(event)=>setForm({...form,period:event.target.value})}
                >
                    <option>Choose Period</option>
                    <option value={0}>Flexible</option>
                    <option value={60*60*24}>1 Day</option>
                    <option value={60*60*24*30}>1 Month</option>
                    <option value={60*60*24*30*365}>1 Year</option>
                    <option value={60}>1 Minute</option>
                </Input>
                </Col>
            </FormGroup>
            <p className="info">Your reward for staking is {parseInt(form.period)<=2952000 ? "nft" : "custom token"}</p>
            <Button type="button" onClick={()=>stake(wallet,wallet.publicKey,nfts[parseInt(form.nft)].data.mint,form.period,form.collection)}>Stake now</Button>
        </Form>
    </div>

}
import {Card,CardImg,CardBody,CardTitle,CardSubtitle,CardText, Button} from 'reactstrap';
import { useState, useEffect } from 'react';
import { storeForm } from './ipfs';
import { arweaveform } from './arweave';
import { useWallet, useConnection} from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
import axios from 'axios';
import { mintOneToken } from './mint';
import { PublicKey } from '@solana/web3.js';


const CANDY_MACHINE_PROGRAM = new PublicKey(
  'cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ',
);


export const NFTCard = (props) => {
    const [metadata,setMetadata] = useState({});
    const {connection}  = useConnection();
    const anchorWallet = useWallet();
    const [isCandymachine, setCandymachine] = useState(false);
    let pubkey = undefined;
    let collection = props.collection.replace(/ /g,"");
    if(anchorWallet.publicKey) {
      pubkey = anchorWallet.publicKey.toString();
    }
    useEffect(async ()=> {
        try {
        if(collection.length > 0) {
        const result = await fetch(process.env.REACT_APP_API_ENDPOINT+`/${collection}/${props.current}.json`);
        const data = await result.json();
        setMetadata(data);
        setCandymachine(false);
        const json2 = await fetch(process.env.REACT_APP_API_ENDPOINT+`/getconfig/${collection}`);
        const json2data = await json2.json();
        if(json2data.candymachine)
          setCandymachine(true);
        console.log(isCandymachine);
        }
        }catch(e) {
          alert("Error loading data");
        }
    },[props.collection,props.current])

    const candyMachine = async () => {
      console.log(anchorWallet);
      const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
      const provider = new anchor.Provider(connection, anchorWallet, {
        preflightCommitment: "recent",
      });
    
      const idl = await anchor.Program.fetchIdl(
        CANDY_MACHINE_PROGRAM,
        provider
      );
    
      const program = new anchor.Program(idl, CANDY_MACHINE_PROGRAM, provider);
      const result  = await axios.get(process.env.REACT_APP_API_ENDPOINT+'/candymachineconfig/'+collection);
      const cm = await result.data;
      console.log(cm.candyMachineAddress);
      try {
        mintOneToken(metadata,{connection,program,id:new PublicKey(cm.candyMachineAddress)},new PublicKey(cm.program.config),anchorWallet.publicKey,new PublicKey(cm.authority));
      } catch(e) {
        alert("Error please try again");
      }
      props.reload();
    }
    
    return <Card className="nftcard small">
    <CardImg
      alt="Card image cap"
      src={process.env.REACT_APP_API_ENDPOINT+"/"+collection+"/"+props.current+".png"}
      top
      width="200"
      height="200"
    />
    <CardBody>
      <CardTitle tag="h5">
        {metadata.name}
      </CardTitle>
      <CardSubtitle
        className="mb-2 text-muted"
        tag="h6"
      >
        {metadata.symbol}
      </CardSubtitle>
      <CardText>
        {metadata.description}
      </CardText>
        <Button className="gap" onClick={()=>props.minted ? candyMachine() : arweaveform(metadata,collection,props.current,pubkey,anchorWallet)}>
        { props.minted ? "Mint using candymachine" : "Mint" }
    </Button>
    </CardBody>
  </Card>
}
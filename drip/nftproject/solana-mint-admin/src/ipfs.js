import { MintLayout } from '@solana/spl-token';
import * as IPFS from 'ipfs-core';
import { mintNFT } from './mint';
import { useState, useEffect } from 'react';

let client = null;



// async function getAuctionFile(setAuctions) {
//     try {
//         const res = await getClient().get("QmenBFMBJWCCzixwXi7sgX1QXw7sZrhbkswrJ1jw99yiHi");
//         for await (const i of res) {
//             setAuctions(JSON.parse(i.toString()));
//         }
//         return;
//     } catch (err) {
//         setAuctions([]);
//         writeAuctionFile([]);
//     }
// }

export async function writeAuctionFile(auctions) {
    console.log(auctions);
    let blob = new Blob([JSON.stringify(auctions)], {type : 'application/json'});
   // getClient().add({path: 'auction.json', content: blob});
}


function randomName() {
    let chars = 'abcdefghijklmnopqrstuvwyz123456789';
    let name = "";
    for(var i=0;i<10;i++) {
       let index = parseInt(Math.random()*10)
       name += chars[index]
    }
    return name;
}

export async function storeForm(formState) {
  let name = randomName(); 
  let client = await IPFS.create()
  let result = await client.files.write("/metadata/"+ name+".png", formState.file,{"create":true});
  for await (const i of client.files.ls("/metadata"))
    if(i.name.split(".")[0].includes(name))
        result = i;
  let metadataContent =  {
    name: formState.name,
    symbol: formState.symbol,
    description: formState.description,
    seller_fee_basis_points: 0,
    image: `http://ipfs.io/ipfs/${result.cid}?ext=png`,
    animation_url: "",
    attributes: [
        {
            "trait_type": "web",
            "value": "yes"
        },
        {
            "trait_type": "mobile",
            "value": "yes"
        },
        {
            "trait_type": "extension",
            "value": "yes"
        }
    ],
    external_url: "",
    properties: {
      files:[{
        uri: `http://ipfs.io/ipfs/${result.cid}?ext=png`,
        type: "image/png"
      }],
      "category":"image",
      creators:[{
          address: "DE7PYttRnBmUE7gbNqpr8WtWJyGhMdnCvKnKeJDV1bk3",
          share: 100,
          verified: false
      }],
    },
  };

  let blob = new Blob([JSON.stringify(metadataContent)], {type : 'application/json'});
  const uriname = name+'.json';
  result = await client.files.write("/metadata/"+uriname,blob,{"create":true});
  console.log(result);
  
      
}

export function useAuctions() {
    const [auctions,setAuctions] = useState([]);

    useEffect(()=>{
       // getAuctionFile(setAuctions);
        return () => writeAuctionFile(auctions);
    },[auctions])
    return [auctions, setAuctions];
}
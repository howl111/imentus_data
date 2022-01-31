import { MintLayout } from '@solana/spl-token';
import * as IPFS from 'ipfs-core';
import { mintNFT } from './mint';
import { useState, useEffect } from 'react';

let client = null;



function randomName() {
    let chars = 'abcdefghijklmnopqrstuvwyz123456789';
    let name = "";
    for(var i=0;i<10;i++) {
       let index = parseInt(Math.random()*10)
       name += chars[index]
    }
    return name;
}

export async function storeForm(formState,collection,current,pubkey) {
  let name = randomName(); 
  let client = await IPFS.create()
  let image = await fetch(process.env.REACT_APP_API_ENDPOINT+"/"+collection+"/"+current+".png");
  
  let imageblob = await image.blob();
  console.log(imageblob);
  let result = await client.add({path:name+".png", content:imageblob});
  console.log(result.cid);
  let metadataContent =  {
    name: formState.name,
    symbol: formState.symbol,
    description: formState.description,
    seller_fee_basis_points: 0,
    image: `http://ipfs.io/ipfs/${result.cid}?ext=png`,
    animation_url: "",
    attributes: [
        {
            "trait_type": "color",
            "value": "yellow"
        },
        {
            "trait_type": "shape",
            "value": "balloon"
        },
        {
            "trait_type": "total",
            "value": "8"
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
          address: pubkey,
          share: 100,
          verified: false
      }],
    },
  };

  let blob = new Blob([JSON.stringify(metadataContent)], {type : 'application/json'});
  const uriname = name+'.json';
  result = await client.add({path:uriname,content:blob});
  console.log(result);
  mintNFT(metadataContent,`http://ipfs.io/ipfs/${result.cid}`)
      
}

import { configure } from '@testing-library/dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
export const NFTForm = () => {
    const {name} = useParams();
    const {publicKey} = useWallet();
    const [form,setForm] = useState({
        name: "",
        symbol: "",
        description: "",
        file: null,
      })
    const [properties,setProperties] = useState([]);
      useEffect(async () =>{
        try {
        const result = await axios.get("/getconfig/"+name);
        const data = await result.data;
        setProperties(data.properties);
        console.log(properties);
        } catch(e) {
          alert("Error, please try again");
        }
      },[])
    
      const uploadLocally = async () => {
        try {
        if(!publicKey) {
          alert("Connect to wallet");
          return;
        }
        const result = await axios.get("/totalnfts/"+name);
        const number = await result.data;
        let metadataContent =  {
          name: form.name,
          symbol: form.symbol,
          description: form.description,
          seller_fee_basis_points: 0,
          image: number+".png",
          collection: {
            name,
            family: name
          },
          animation_url: "",
          attributes: [
              properties.map((i)=>({"trait_type":i,"value":form[i]}))
          ],
          external_url: "",
          properties: {
            files:[{
              uri: number+".png",
              type: "image/png"
            }],
            "category":"image",
            creators:[{
                address: publicKey.toString(),
                share: 100,
                verified: false
            }],
          },
        };
        const data = new FormData();
        data.append("metadata",new Blob([JSON.stringify(metadataContent)],{type:"application/json"}));
        data.append("image",form.file);
        axios.post("/upload/"+name,data);
        alert("saved");
        } catch(e) {
          alert("Error, please try again");
        }
      }
    
    return <div><p className="pagetitle">NFT Form</p>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">NFT name</label>
      <div class="col-sm-10">
        <input name="name" className="form-control" type="text" onChange={(e)=>setForm({...form,name:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">NFT symbol</label>
      <div class="col-sm-10">
        <input name="symbol" type="text"  className="form-control" onChange={(e)=>setForm({...form,symbol:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">NFT description</label>
      <div class="col-sm-10">
        <input name="description" type="text" className="form-control" onChange={(e)=>setForm({...form,description:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
    <label for="inputEmail3" class="col-sm-2 col-form-label">NFT Image</label>
      <div class="col-sm-10">
        <input name="file" type="file" className="form-control" onChange={(e)=>setForm({...form,file:e.target.files[0]})}></input>
      </div>
    </div>
    {properties.map((i)=>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">{i}</label>
      <div class="col-sm-10">
        <input name={i} type="text" className="form-control" onChange={(e)=>setForm({...form,[i]:e.target.value})}></input>
      </div>
    </div>
    )}
    <button className="btn btn-primary" onClick={()=>uploadLocally()}>Save</button>
    </div>
}
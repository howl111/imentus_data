import {useState, useEffect,useRef} from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';
import {useWallet} from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
export const CsvUpload = (props) => {
    console.log(props.config);
    const {publicKey} = useWallet();
    const [alert,setAlert] = useState(false);
    const [uploadAlert,setUploadAlert] = useState(false);
    const [form,setForm] = useState({
        collection_name: "",
        collection_family: "",
        royalty: 0,
        file: null,
        imagezip: null,
        properties: []
    });
    const propertyRef = useRef(); 
    useEffect(()=> {
        console.log(props.config)
        if(props.config && props.config.name)
            setForm(Object.assign(form,{collection_name:props.config.name,collection_family:props.config.family,royalty:props.config.seller_fee_basis_points,properties:props.config.properties}))
        console.log(form);
    },[props.config]);
    console.log(form.properties);
    let property = "";
    const uploadLocally = () => {
      try {
        if(!publicKey) {
          alert("Wallet not connected");
          setAlert(true);
          setTimeout(()=>setAlert(false),3000);
          return;
        }
        let formdata = new FormData();
        formdata.append('publickey',publicKey.toString());
        formdata.append('collection_name',form.collection_name);
        formdata.append('collection_family',form.collection_family);
        formdata.append('royalty',form.royalty);
        formdata.append('csvmetadata',form.file);
        formdata.append('imagezip',form.imagezip);
        formdata.append('properties',JSON.stringify(form.properties));
        axios.post("/upload/"+form.collection_name.replace(/ /g,''),formdata);
        alert("Saved");
      } catch(e) {
        setUploadAlert(true);
        setTimeout(()=>setUploadAlert(false),3000);
      }
    };
    return <div>
      {alert && <div class="alert alert-primary" role="alert">
        Please, connect your wallet
      </div>}
      {uploadAlert && <div class="alert alert-primary" role="alert">
        Unable to create new collection
      </div>}
      <p className="pagetitle">Add or Edit Collection</p>
        <div>
        <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Collection name</label>
      <div class="col-sm-8">
        <input name="collectionname" defaultValue={form.collection_name} className="form-control" type="text" onChange={(e)=>setForm({...form,collection_name:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Collection Family</label>
      <div class="col-sm-8">
        <input name="collectionfamily" defaultValue={form.collection_family} className="form-control" type="text" onChange={(e)=>setForm({...form,collection_family:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-3 col-form-label">Royalty Percentage</label>
      <div class="col-sm-8">
        <input name="royalty" value={form.royalty} className="form-control" type="number" onChange={(e)=>setForm({...form,royalty:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
    <label for="inputEmail3" class="col-sm-2 col-form-label">CSV File</label>
      <div class="col-sm-10">
        <input name="file" type="file" className="form-control" onChange={(e)=>setForm({...form,file:e.target.files[0]})}></input>
      </div>
    </div>
    <div className="row mb-3">
    <label for="inputEmail3" class="col-sm-2 col-form-label">Upload Images</label>
      <div class="col-sm-10">
        <input name="file" type="file" className="form-control" onChange={(e)=>setForm({...form,imagezip:e.target.files[0]})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Properties</label>
      <input ref={propertyRef}name="property" className="col form-control" type="text" onChange={(e)=>property=e.target.value}></input>
      <button className="col-sm-2 btn btn-primary" onClick={()=>{setForm({...form,properties:[...form.properties,property]});propertyRef.current.value="";}}>Add Property</button>
    </div>
    <div className="container">
        <div className="gridsm">
        {form.properties.map((i,index)=>
        <div className="col card"><p>{i}</p></div>
        )}
        </div>
    </div>
    {props.children}
    <div className="manageheader">
        <Link to="/collections"><button className="btn btn-danger">Cancel</button></Link>
        <button className="btn btn-primary" onClick={()=>uploadLocally()}>Save</button>
    </div>
    </div>
    </div>;
}
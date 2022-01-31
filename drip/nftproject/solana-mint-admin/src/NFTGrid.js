import { set } from '@project-serum/anchor/dist/cjs/utils/features';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
export const NFTItem = (props) => {
    const name = props.name.replace(/ /g,"");
    return <div className="card">
        <img className="card-img-top" src={process.env.REACT_APP_API_ENDPOINT+"/"+name+"/0.png"} width="200" height="200"/>        
        <Link to={"/collection/"+props.name.replace(/ /g,"")} state={{name:props.name}} className="link"><p className="card-text">{props.name}</p></Link>
        <div className="d-flex flex-column">
        <Link to={"/snapshot/"+name} state={{name:props.name,pagename:"NFT Holder Snapshot"}}className="link mt-1"><button className="btn btn-primary">NFT Holder Snapshot</button></Link><br/>
        <Link to={"/snapshot/"+name} state={{name:props.name,pagename:"NFT Stake Snapshot"}}className="link mt-1"><button className="btn btn-primary">NFT Stake Snapshot</button></Link><br/>
        <Link to={"/add-edit-collection/"+name} className="link mt-1"><button className="btn btn-primary">Edit</button></Link><br/>
        </div>
    </div>
}

export const NFTGrid = () => {
    const [jsons,setJsons] = useState([]);
    const [alert,setAlert] = useState(false);
    useEffect(async ()=> {
        try {
        const result = await axios.get("/collections");
        const resultdata = result.data;
        const j = [];
        console.log(resultdata);
        for(const i of resultdata) {
            const result = await axios.get("/"+i.replace(/ /g,"")+"/0.json");
            j.push({name:i,image:process.env.REACT_APP_API_ENDPOINT+"/"+i.name+"/"+result.data.image});
        }
        setJsons(j);
        console.log(jsons);
        } catch(e) {
            setAlert(true);
            setTimeout(()=>setAlert(false),3000);
        }
    },[])
    return <div>
      {alert && <div class="alert alert-primary" role="alert">
        Error, Loading data
        </div>}
        <div className="flexible-gap">
            <p className="pagetitle">Manage Collections</p>
            <Link to="/add-edit-collection"><button className="btn btn-primary">Add Collection</button></Link>
        </div>
        <div className="grid">
            {jsons.map((value,index)=><NFTItem name={value.name} image={value.image}/>)}
        </div>
    </div>
}
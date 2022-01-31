import { CsvUpload } from "./CsvUpload";
import { useState, useEffect } from 'react';
import { useParams } from "react-router";
import { NFTItem } from "./Collection";
import {Link} from 'react-router-dom';
import axios from 'axios';
export const EditUpload = () => {
    const [metadata,setMetadata] = useState([]);
    const [config, setConfig] = useState({});
    const {name} = useParams();
    useEffect(async () => {
        const result = await axios.get(process.env.REACT_APP_API_ENDPOINT+"/collection/"+name);
        const files = await result.data;
        let metadata = [];
        for(const i of files) {
            const result = await axios.get(process.env.REACT_APP_API_ENDPOINT+"/"+name+"/"+i);
            const data = await result.data;
            metadata.push(data);
        }
        const result2 = await axios.get(process.env.REACT_APP_API_ENDPOINT+"/getconfig/"+name);
        const config = await result2.data;
        setConfig(config);
        console.log(config);
        console.log(metadata);
        setMetadata(metadata);
    },[]);

    return <div>
        
        <CsvUpload config={config}>
        <Link to={"/mint/"+name}><button className="btn btn-primary">Mint using candy machine</button></Link>
        <div className="manageheader">
            <p>NFTs</p>
            <Link to={"/upload-nft/"+name}>
            <button className="btn btn-primary">Add NFT</button>
            </Link>
        </div>
        <div className="grid">
        {metadata.map((value,index)=><NFTItem name={value.name} image={process.env.REACT_APP_API_ENDPOINT+`/${name}/${index}.png`}/>)}
        </div>
        </CsvUpload>
    </div>
}
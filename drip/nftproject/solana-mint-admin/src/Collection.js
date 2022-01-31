import { useParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
export const NFTItem = (props) => {
    return <div className="card">
        <img className="card-img-top" src={props.image} width="200" height="200"/>
        <p>{props.name}</p>
    </div>
}
export const Collection = () => {
    const [metadata,setMetadata] = useState([]);
    const {name} = useParams();
    const {state} = useLocation();
    useEffect(async () => {
        const result = await axios.get("/collection/"+name);
        const files = await result.data;
        let metadata = [];
        for(const i of files) {
            const result = await axios.get("/"+name+"/"+i);
            const data = await result.data;
            metadata.push(data);
        }
        console.log(metadata);
        setMetadata(metadata);
    },[]);
    
    return <div>
        <div className="collectionheader">
            <img src={process.env.REACT_APP_API_ENDPOINT+"/"+name+"/0.png"} width="200" height="200"/>
            <p className="collectionname">{state.name}</p>
        </div>
        <div className="grid">
            {metadata.map((value,index)=><NFTItem name={value.name} image={process.env.REACT_APP_API_ENDPOINT+`/${name}/${index}.png`}/>)}
        </div>
    </div>
}
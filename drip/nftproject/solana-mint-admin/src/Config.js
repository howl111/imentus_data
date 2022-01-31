import axios from "axios";
import { useState, useEffect } from "react"
export const Config = () => {
    const [config,setConfig] = useState({
        collection: "",
        family: "",
        property1: "",
        property2: "",
        property3: "",
        property4: "",
        property5: ""
    });

    useEffect(async ()=>{
        const res = await axios("http://localhost:4000/getconfig");
        const data = await res.data;
        setConfig(data);
    },[])

    const uploadLocally = () => {
        axios.post('http://localhost:4000/uploadconfig',config);
    } 
    return <div><h1>Collection Config</h1>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Collection Name</label>
      <div class="col-sm-10">
        <input name="name" defaultValue={config.collection} className="form-control" type="text" onChange={(e)=>setConfig({...config,collection:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Collection Family</label>
      <div class="col-sm-10">
        <input name="name" defaultValue={config.family} className="form-control" type="text" onChange={(e)=>setConfig({...config,family:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Property1</label>
      <div class="col-sm-10">
        <input name="symbol" defaultValue={config.property1} type="text"  className="form-control" onChange={(e)=>setConfig({...config,property1:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Property2</label>
      <div class="col-sm-10">
        <input name="symbol" defaultValue={config.property2} type="text"  className="form-control" onChange={(e)=>setConfig({...config,property2:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Property3</label>
      <div class="col-sm-10">
        <input name="symbol" defaultValue={config.property3} type="text"  className="form-control" onChange={(e)=>setConfig({...config,property3:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Property4</label>
      <div class="col-sm-10">
        <input name="symbol" defaultValue={config.property4} type="text"  className="form-control" onChange={(e)=>setConfig({...config,property4:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Property5</label>
      <div class="col-sm-10">
        <input name="symbol"  defaultValue={config.property5} type="text"  className="form-control" onChange={(e)=>setConfig({...config,property5:e.target.value})}></input>
      </div>
    </div>
    <button className="btn btn-primary" onClick={()=>uploadLocally()}>Save Config</button>
    </div>
}
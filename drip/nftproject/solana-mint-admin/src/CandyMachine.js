import {useState, useEffect} from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {useWallet} from '@solana/wallet-adapter-react';
export const CandyMachine = () => {
    const [form,setForm] = useState({
        date: "",
        price: "0.1"
    })

    const [progress,setProgress] = useState(0);

    useEffect(()=>{
      const id = setInterval(async ()=>{
        if(progress != 100) {
        const response = await axios.get("/candymachine/progress");
        const data = await response.data;
        if(parseInt(data) == 100)
          alert("Success");
        setProgress(parseInt(data));
        }
      },1000);

      return () => clearInterval(id);
    })

    const {name} = useParams();
    const {publicKey} = useWallet();
    const mint = async () => {
      try {
        if(form.date.length == 0) {
          alert("Please enter date");
          return;
        }
        const date = new Date(form.date);
        const format = date.toGMTString().slice(5);
        const pubkeybuffer = publicKey.toBytes().toJSON().data;
        let formData = new FormData();
        console.log(format)
        formData.append('startdate',format);
        formData.append('price',form.price);
        const result  = await axios.post('/candymachine/'+name,formData);
        const response = await result.data;

        if(response.localeCompare("success") == 0)
            alert("Creating candy machine");
        else
            alert("Candy machine already exists");
      } catch(e) {
        alert("Error, please try again");
      }
    }
    return <div><p className="pagetitle">Mint using CandyMachine</p>
<div className="row mb-3">
  <label for="inputEmail3" class="col-sm-3 col-form-label">Available date</label>
  <div class="col-sm-8">
    <input name="date" required className="form-control" type="datetime-local" onChange={(e)=>setForm({...form,date:e.target.value})}></input>
  </div>
</div>
<div className="row mb-3">
  <label for="inputEmail3" class="col-sm-3 col-form-label">Price</label>
  <div class="col-sm-8">
    <input name="price" defaultValue="0.1" step="0.1" className="form-control" type="number" onChange={(e)=>setForm({...form,price:e.target.value})}></input>
  </div>
</div>

<button className="btn btn-primary" onClick={()=>mint()}>Mint</button>
<p className="ptitle">{progress > 0 ? "Creating Candy machine": "Not created"}</p>
<div class="progress" style={{height:"10%"}}>
  
  <div class="progress-bar" role="progressbar" style={{width:progress+"%"}} aria-valuenow={""+progress} aria-valuemin="0" aria-valuemax="100">{progress}</div>
</div>
</div>
}
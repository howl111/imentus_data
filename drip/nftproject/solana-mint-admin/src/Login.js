import axios from 'axios';
import {useState} from 'react';
import logo from './Winitlogo.png';
export const Login = (props) => {
    const [form,setForm] = useState({
        email:"",
        password:"",
    })

    const login = async () => {
        const res = await axios.post(process.env.REACT_APP_API_ENDPOINT+"/login",form);
        const data = await res.data;
        if(data.error.localeCompare("Success") == 0) {
            alert("Signed in");
            props.auth(data.token);
        } else
            alert("Error, please try again");
    }

    const register = async () => {
        const res = await axios.post(process.env.REACT_APP_API_ENDPOINT+"/register",form);
        const data = await res.data;
        if(data.localeCompare("Success") == 0)
            alert("Registered")
        else
            alert("Error, please try again");
    }
    return <div>
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
          <div class="container-fluid">
          <a class="navbar-brand" href="#">
          <img src={logo} className="logo"/>
            Admin
          </a>
          </div>
        </nav>
    <div className="login"><p className="pagetitle">Login</p>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Email</label>
      <div class="col-sm-10">
        <input name="email" className="form-control" type="email" onChange={(e)=>setForm({...form,email:e.target.value})}></input>
      </div>
    </div>
    <div className="row mb-3">
      <label for="inputEmail3" class="col-sm-2 col-form-label">Password</label>
      <div class="col-sm-10">
        <input name="password" type="password"  className="form-control" onChange={(e)=>setForm({...form,password:e.target.value})}></input>
      </div>
    </div>
    <button className="btn btn-primary" onClick={()=>login()}>Login</button>
    <button className="ms-2 btn btn-primary" onClick={()=>register()}>Register</button>
    </div>
    </div>;
}
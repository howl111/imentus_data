
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Login} from './Login';
import {Admin} from './Admin';
import { useState, useEffect } from 'react';
import axios from 'axios';
import jwt from 'express-jwt';

axios.defaults.baseURL =  process.env.REACT_APP_API_ENDPOINT;
axios.defaults.withCredentials = true;


function App() {
  const [authenticated,setAuthenticated] = useState(false);

  useEffect(async ()=>{
    if(localStorage.getItem("jwt") != undefined) {
      setAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = "Bearer "+localStorage.getItem("jwt");
    }
  },[])

  const storeJWT = (jwt)=>{
    setAuthenticated(true);
    axios.defaults.headers.common['Authorization'] = "Bearer "+jwt;
    console.log(axios.defaults.headers.common);
    localStorage.setItem("jwt",jwt);
  }
  return authenticated? <Admin/>: <Login auth={storeJWT}/>
}

export default App;

import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink } from "reactstrap"
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from "react";
import axios from 'axios';
import logo from './Winitlogo.png';
import {Link} from 'react-router-dom';
export const Topnavbar = (props) => {
    const [collections,setCollections] = useState([]);
    const [active, setActive] = useState(0);
    useEffect(async ()=>{
      const result = await axios.get(process.env.REACT_APP_API_ENDPOINT+'/collections');
      const data = await result.data;
      if(data.length > 0) {
        setCollections(data);
        props.setCollection(data[0]);
      }
    },[])
    return <Navbar
    color="light"
    expand="md"
    light
  >
    <NavbarBrand href="/">
      <img src={logo} className="logo"/>
    </NavbarBrand>
    <NavbarToggler onClick={function noRefCheck(){}} />
    <Collapse navbar>
      <Nav
        navbar
        >
          <NavItem>
            <NavLink><Link to="/">Mint NFT</Link></NavLink>
          </NavItem>
          <NavItem>
          <NavLink><Link to="/stake">Stake NFT</Link></NavLink>
          </NavItem>
          <NavItem>
          <NavLink><Link to="/claim">Claim NFT</Link></NavLink>
          </NavItem>
      </Nav>
      <Nav
        className="rightside"
        navbar
        style={{justifyContent:"flex-end"}}
      >
        <UncontrolledDropdown
          inNavbar
          nav
        >
          <DropdownToggle
            caret
            nav
          >
            {props.collection.length > 0 ? props.collection : "No collection available"}
          </DropdownToggle>
          
          <DropdownMenu>
            <DropdownItem>
              Select
            </DropdownItem>
            {collections.map((i)=>{
              return <DropdownItem onClick={()=>props.setCollection(i)}>{i}</DropdownItem>
            })}
          </DropdownMenu>
        </UncontrolledDropdown>
        <NavItem className="flex">
          <WalletModalProvider>
            <WalletMultiButton/>
            <WalletDisconnectButton />
          </WalletModalProvider>
        </NavItem>
      </Nav>
    </Collapse>
  </Navbar>
}
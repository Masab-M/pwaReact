import React, { useEffect } from 'react';
import './App.css';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Feed from './View/Feed';
import Location from './View/Location';
import Logo from "./Assets/Images/Progressive_Web_Apps_Logo.svg.png"
import Home from './View/Home';
import {BiHomeAlt2,BiCurrentLocation} from "react-icons/bi"
import {CgFeed} from "react-icons/cg"
import "./Assets/CSS/index.app.css"
function App() {
  useEffect(() => {
    
  }, [])
  
  return (
    <div className="App">
      <nav>
        <div className="logo">
          <img src={Logo} alt="" />
        </div>
        <div className="Navlinks">
          <ul className="navScreens">
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/feed">Feed</NavLink>
            </li>
            <li>
              <NavLink to="/location">Locate</NavLink>
            </li>
          </ul>
        </div>
      </nav>
       <Routes>
        <Route path="/" element={ <Home/> } />
        <Route path="location" element={ <Location/> } />
        <Route path="feed" element={ <Feed/> } />
      </Routes>
      <div className="AppNav">
        <div className="AppMenus">
          <div className="Menulist">
            <div className="AppScreeen">
              <NavLink to={'/location'}>
               <BiCurrentLocation/>
              </NavLink>
            </div>
            <div className="AppScreeen">
            <NavLink to={'/'}>
              <BiHomeAlt2/>
              </NavLink>
            </div>
            <div className="AppScreeen">
            <NavLink to={'/feed'}>
              <CgFeed/>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

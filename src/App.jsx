import React, { Suspense, lazy } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

import './App.css';
import "./Assets/CSS/index.app.css"
import Logo from "./Assets/Images/Progressive_Web_Apps_Logo.svg.png"

import {BiHomeAlt2,BiCurrentLocation} from "react-icons/bi"
import {CgFeed} from "react-icons/cg"

const Location =lazy(()=> import('./View/Location'));
const Home =lazy(()=> import('./View/Home')) ;
const DraftFeeds = lazy(()=> import('./View/DraftFeeds'));
const Feed = lazy(()=> import('./View/Feed'));

function App() {
  
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
      <Suspense fallback={
        <>
        <div className="spinner"></div>
        </>
      }>
       <Routes>
        <Route path="/" element={ <Home/> } />
        <Route path="location" element={ <Location/> } />
        <Route path="draft" element={ <DraftFeeds/> } />
        <Route path="feed" element={ <Feed/> } />
      </Routes>
      </Suspense>
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

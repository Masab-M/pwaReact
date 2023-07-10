import React from 'react'
import { Link } from 'react-router-dom'
import Postimage from "../Assets/Images/Content creation_Outline.svg"
import Location from "../Assets/Images/Map_Flatline.svg"
import "../Assets/CSS/Home.css"
export default function Home() {
  return (
    <>
    <div className="tileMenu">
        <div className="tiles">
            <Link to="feed" className='singleTile'>
                <div className="iconImage feedIcon">
                    <img src={Postimage} alt=""/>
                </div>
                <div className="title">
                    <h4>Feed</h4>
                </div>
            </Link>
            <Link to="location" className='singleTile'>
            <div className="iconImage locationIcon">
                    <img src={Location} alt="" />
                </div>
                <div className="title">
                    <h4>Location</h4>
                </div>
            </Link>
        </div>
    </div>
    </>
  )
}

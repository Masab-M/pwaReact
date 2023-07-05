import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
    <div className="tileMenu">
        <div className="tiles">
            <Link to="feed" className='singleTile'>
                <div className="title">
                    <h4>Feed</h4>
                </div>
            </Link>
            <Link to="location" className='singleTile'>
                <div className="title">
                    <h4>Location</h4>
                </div>
            </Link>
        </div>
    </div>
    </>
  )
}

import React, { useEffect, useState } from 'react'
import { useRef } from 'react';
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai"
import { BsThreeDots } from "react-icons/bs"
export default function SingleFeed({ setEditPostType, data, id, showModal, setdeleteID, setupdateId, showEditModal, setHeading, setContent, isLogin }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [moreInfo, setMoreInfo] = useState(false)
    const [seeMore, setSeeMore] = useState(false)
    const handleImageLoad = () => {
        setImageLoaded(true);
    };
    const dropDownRef = useRef(null);
    function timeConverter(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var time = date + ' ' + month + ' ' + year;
        return time;
    }
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
                setMoreInfo(false)
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropDownRef]);
    return (
        <div className='post'>
            <div className="content">
                <div className="postContent">
                    <h4>{data.heading}</h4>
                    {
                        data.content.length > 120 ?
                            <>
                                {
                                    seeMore ?
                                        <>
                                            <p>{data.content}
                                                <span className='showMoreBtn' onClick={() => {
                                                    setSeeMore(false)
                                                }}>Show Less</span>
                                            </p>
                                        </>
                                        :
                                        <>
                                            <p>{data.content.substring(0, 100)}...
                                                <span className='showMoreBtn' onClick={() => {
                                                    setSeeMore(true)
                                                }}>Show More</span>
                                            </p>
                                        </>
                                }
                            </>
                            :
                            <p>{data.content}</p>
                    }
                </div>
                {
                    (isLogin && data.uid === localStorage.getItem('uid')) &&
                    <div className="udActions" ref={dropDownRef}>
                        <div className="moreInfo" onClick={() => {
                            setMoreInfo(!moreInfo)
                        }}>
                            <BsThreeDots />
                        </div>
                        {
                            moreInfo &&
                            <div className="moreDropDropDown">
                                <div className="Update">
                                    <AiOutlineEdit onClick={() => {
                                        setMoreInfo(false)
                                        setupdateId({
                                            id: id,
                                            data: data
                                        })
                                        setEditPostType('new')
                                        setHeading({ error: false, value: data.heading })
                                        setContent({ error: false, value: data.content })
                                        showEditModal()
                                    }} />
                                </div>
                                <div className="delete">
                                    <AiOutlineDelete onClick={() => {
                                        setMoreInfo(false)
                                        setEditPostType('new')
                                        setdeleteID(id)
                                        showModal()
                                    }} />
                                </div>
                            </div>
                        }
                    </div>
                }
            </div>
            <div className="postImage">
                {!imageLoaded && <div className='LazyPlaceHolder'></div>}
                <img src={data.image} alt="" className={imageLoaded ? 'loaded' : ''} loading='lazy' onLoad={handleImageLoad} />
            </div>
            <div className="Location">
                {
                    data.timestamp &&
                    <span>{timeConverter(data.timestamp)}</span>
                }
                <span>{data.location}</span>
            </div>
        </div>
    )
}

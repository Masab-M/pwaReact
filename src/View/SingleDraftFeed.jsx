import React, { useEffect, useRef, useState } from 'react'
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai"
import { BsThreeDots } from "react-icons/bs"

export default function SingleDraftFeed({ setEditPostType, data, showModal, setdeleteID, setupdateId, showEditModal, setHeading, setContent }) {
    const [Image, setImage] = useState('')
    const [imageLoaded, setImageLoaded] = useState(false);
    const [moreInfo, setMoreInfo] = useState(false)
    const [seeMore, setSeeMore] = useState(false)
    const dropDownRef = useRef()
    const handleImageLoad = () => {
        setImageLoaded(true);
    };
    function timeConverter(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        // var hour = a.getHours();
        // var min = a.getMinutes();
        // var sec = a.getSeconds();
        // var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
        var time = date + ' ' + month + ' ' + year;
        return time;
    }
    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = _e => resolve(reader.result);
            reader.onerror = _e => reject(reader.error);
            reader.onabort = _e => reject(new Error("Read aborted"));
            reader.readAsDataURL(blob);
        });
    }
    useEffect(() => {
        blobToDataURL(data.image).then((res) => {
            setImage(res)
        })
    }, [])
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
            <div className="draftedTag">
                <span>Draft</span>
            </div>
            <div className="content">
                <div className="postContent">
                    <h4>{data.heading}</h4>
                    {
                    data.content.length>120 ?
                    <>
                    {
                        seeMore?
                        <>
                        <p>{data.content}
                        <span className='showMoreBtn' onClick={()=>{
                            setSeeMore(false)
                        }}>Show Less</span>
                        </p>
                        </>
                        :
                        <>
                        <p>{data.content.substring(0,100)}...
                        <span className='showMoreBtn' onClick={()=>{
                            setSeeMore(true)
                        }}>Show More</span>
                        </p>
                        </>
                    }
                    </>
                    :
                    <p>{data.content}</p>
                }
                    {
                        data.timestamp &&
                        <span>{timeConverter(data.timestamp)}</span>
                    }
                </div>
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
                                    setupdateId({
                                        id: data.id,
                                        data: data
                                    })
                                    setEditPostType('draft')
                                    setHeading({ error: false, value: data.heading })
                                    setContent({ error: false, value: data.content })
                                    showEditModal()
                                }} />
                            </div>
                            <div className="delete">
                                <AiOutlineDelete onClick={() => {
                                    setdeleteID(data.id)
                                    setEditPostType('draft')
                                    showModal()
                                }} />
                            </div>
                        </div>
                    }
                </div>
            </div>
            <div className="postImage">
                {!imageLoaded && <div className='LazyPlaceHolder'></div>}
                <img src={Image} alt="" className={imageLoaded ? 'loaded' : ''} loading='lazy' onLoad={handleImageLoad} />
            </div>
            <div className="Location">
                <span>{data.location}</span>
            </div>
        </div>
    )
}

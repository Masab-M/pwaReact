import React, { useEffect, useState } from 'react'
import  {AiOutlineEdit,AiOutlineDelete} from "react-icons/ai"
export default function SingleDraftFeed({data,showModal,setdeleteID,setupdateId,showEditModal}) {
    const [Image, setImage] = useState('')
    const [imageLoaded, setImageLoaded] = useState(false);

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
        blobToDataURL(data.image).then((res)=>{
            setImage(res)
        })
      }, [])

  return (
    <div className='post'>
            <div className="draftedTag">
                <span>Draft</span>
            </div>
        <div className="content">
            <div className="postContent">
                <h4>{data.heading}</h4>
                <p>{data.content}</p>
                {
                    data.timestamp &&
                    <span>{timeConverter(data.timestamp)}</span>
                }
            </div>
            <div className="udActions">
                <div className="Update">
                    <AiOutlineEdit onClick={()=>{
                        setupdateId({
                            id:data.id,
                            data:data
                        })
                        showEditModal()
                    }}/>
                </div>
                <div className="delete">
                    <AiOutlineDelete onClick={()=>{
                        setdeleteID(data.id)
                        showModal()
                    }}/>
                </div>
            </div>
        </div>
        <div className="postImage">
        {!imageLoaded &&  <div className='LazyPlaceHolder'></div>}
            <img src={Image} alt="" className={imageLoaded ? 'loaded' : ''} loading='lazy' onLoad={handleImageLoad}/>
        </div>
        <div className="Location">
            <span>{data.location}</span>
        </div>
    </div>
  )
}

import React from 'react'
import  {AiOutlineEdit,AiOutlineDelete} from "react-icons/ai"
export default function SingleFeed({data,id,showModal,setdeleteID,setupdateId,showEditModal}) {
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
  return (
    <div className='post'>
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
                            id:id,
                            data:data
                        })
                        showEditModal()
                    }}/>
                </div>
                <div className="delete">
                    <AiOutlineDelete onClick={()=>{
                        setdeleteID(id)
                        showModal()
                    }}/>
                </div>
            </div>
        </div>
        <div className="postImage">
            <img src={data.image} alt="" />
        </div>
        <div className="Location">
            <span>{data.location}</span>
        </div>
    </div>
  )
}

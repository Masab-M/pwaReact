import React, { useCallback, useEffect, useRef, useState } from 'react'
import { indexDB } from "../Utils/indexdb";
import SingleDraftFeed from './SingleDraftFeed';
import Modal from '../Partials/Modal';
import { BiImageAdd } from "react-icons/bi"
import { BsFiles, BsPhoneFlip } from "react-icons/bs"
import { IoMdFlash, IoMdFlashOff } from "react-icons/io"
import { GrClose } from "react-icons/gr"
import Cropper from 'react-easy-crop'
import getCroppedImg from '../Partials/Crop/GetCropImage'
export default function DraftFeeds() {
    const [draftPost, setDraftPost] = useState([])
    const [draftDeleteId, setDraftDeleteId] = useState(null)
    const [draftdeleteModal, setDraftdeleteModal] = useState(false)
    const [editPostModal, setEditPostModal] = useState(false)
    const [cameraType, setCameraType] = useState(true)
    const canvasRef = useRef(null)
    const [imageEdited, setImageEdited] = useState(false)
    const [refresh, setRefresh] = useState(false)
    const videoRef = useRef(null)
    const [imageEditModal, setImageEditModal] = useState(false)
    const [torch, setTorch] = useState(false)
    const [cameraAccess, setCameraAccess] = useState(false)
    const [addingPost, setAddingPost] = useState(false)
    const [formErr, setFormErr] = useState(false)
    const editPostRef = useRef(null)
    const [editId, setEditId] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [rotation, setRotation] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])
    const showCroppedImage = useCallback(async () => {
        try {
            const croppedImage = await getCroppedImg(
                editId && editId.image,
                croppedAreaPixels,
                rotation
            )
            let postObj = structuredClone(editId);
            postObj.image = croppedImage;
            setEditId(postObj)
            handleImageEditClose()
        } catch (e) {
            console.error(e)
        }
    }, [croppedAreaPixels, rotation])
    useEffect(() => {
        if (cameraAccess) {
            videoRef.current.srcObject.getVideoTracks().forEach(track => {
                track.stop()
            })
            openCamera()
        }
    }, [cameraType])
    function getWindowDimensions() {
        const { innerWidth: width, innerHeight: height } = window;
        return {
            width,
            height
        };
    }
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
    async function getIndexDBData() {
        const posts = await indexDB.posts.toArray();
        return posts;
    }
    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    useEffect(() => {
        getIndexDBData().then((res) => {
            if (res.length > 0) {
                setDraftPost(res)
            }
            else{
                setDraftPost([])
            }
        })
    }, [refresh])
    const handlePostDraftDeleteClose = () => {
        setDraftdeleteModal(false);
    };
    const handlePostDraftDeleteShow = () => {
        setDraftdeleteModal(true);
    };
    async function deleteIndexRow() {
        await indexDB.posts.delete(draftDeleteId)
        handlePostDraftDeleteClose()
        setRefresh(!refresh)
    }
    const handleEditClose = () => {
        setEditPostModal(false);
        setEditId(null)
    };
    const handleEditShow = () => {
        setEditPostModal(true);
    };
    const handleImageEditClose = () => {
        setImageEditModal(false);
    };
    const handleImageEditShow = () => {
        setImageEditModal(true);
    };
    async function openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    width: windowDimensions.width, height: windowDimensions.height,
                    facingMode: cameraType ? "user" : "environment"
                }
            })
            setCameraAccess(true)
            const videoTracks = stream.getVideoTracks()
            const track = videoTracks[0]
            const btn = document.getElementById('switchFlash')
            btn.addEventListener('click', function () {
                setTorch(true)
                track.applyConstraints({
                    advanced: [{ torch: true }]
                }).catch((err) => {
                    console.log('unsupported');
                })
            });
            const btn2 = document.getElementById('switchFlashOff')
            btn2.addEventListener('click', function () {
                setTorch(false)
                track.applyConstraints({
                    advanced: [{ torch: false }]
                }).catch((err) => {
                    console.log('unsupported');
                })
            });
            document.querySelector('video').srcObject = stream
        } catch (error) {
            console.error(error)
        }
    }
    async function handleEditForm(e){
        e.preventDefault()
        if (e.target[0].value !== '' && e.target[1].value !== '' && editId.image) {
            if(imageEdited)
            {
                let blob = await fetch(editId.image).then(r => r.blob());
                await indexDB.posts.update(editId.id,
                    {
                        heading:e.target[0].value,
                        content:e.target[1].value,
                        image:blob
                    }
                    )
                    handleEditClose()
                    setRefresh(!refresh)
            }
            else{
                await indexDB.posts.update(editId.id,
                    {
                        heading:e.target[0].value,
                        content:e.target[1].value
                    }
                    )
                    handleEditClose()
                    setRefresh(!refresh)
            }
        }
        else{
            setFormErr(true)
        }
    }
    function takeImage() {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        canvasRef.current.getContext('2d').drawImage(
            videoRef.current,
            0, 0,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight
        )
        setCameraAccess(false)
        videoRef.current.srcObject.getVideoTracks().forEach(track => {
            track.stop()
        })
        let postObj = structuredClone(editId);
        postObj.image = canvasRef.current.toDataURL("image/png");;
        setEditId(postObj)
        setImageEdited(true)
        setFormErr(false)
        handleImageEditShow()
    }
    function closeCamera() {
        videoRef.current.srcObject.getVideoTracks().forEach(track => {
            track.stop()
        })
        setTorch(false);
        setCameraAccess(false)
    }
    function handleChangeImage(e) {
        closeCamera()
        var input = e.target;
        var reader = new FileReader();
        reader.onload = function () {
            var dataURL = reader.result;
            if (editPostModal && editId) {
                let postObj = structuredClone(editId);
                postObj.image = dataURL;
                setEditId(postObj)
                setImageEdited(true)
            }
            setFormErr(false)
            handleImageEditShow()
        };
        reader.readAsDataURL(input.files[0]);
    }
    return (
        <>
            <Modal show={editPostModal} handleClose={handleEditClose}>
                <div className="newPostPopup">
                    <form ref={editPostRef} action="" onSubmit={handleEditForm}>
                        <div className="contentSection">
                            <div className="title">
                                <label htmlFor="heading">Heading</label>
                                <input disabled={addingPost} onChange={() => {
                                    setFormErr(false)
                                }} type="text" defaultValue={editId && editId.heading} name="heading" id="heading" placeholder='Add Post Heading' />
                            </div>
                            <div className="newPostContent">
                                <label htmlFor="Content">Description</label>
                                <textarea disabled={addingPost} onChange={() => {
                                    setFormErr(false)
                                }} name="newPostText" defaultValue={editId !== null && editId.content} id="newPostText" cols="30" rows="3" placeholder='Type Your Post Content'></textarea>
                            </div>
                            <div className="ContentI">
                                {
                                    editId !== null && editId.image &&
                                    <img src={editId.image} alt="" srcSet="" />
                                }
                            </div>
                        </div>
                        <div className="postButton">
                            <div className="attachedOptions">
                                <div className={`AddImage ${addingPost ? "disabled" : ""}`}>
                                    <BiImageAdd onClick={() => {
                                        if (!addingPost) {
                                            openCamera()
                                        }
                                    }} />
                                </div>
                            </div>
                            {
                                formErr &&
                                <div className="newPostErr">
                                    <span>Add Image and Content Please</span>
                                </div>
                            }
                            <button type='submit'>
                                {
                                    addingPost ?
                                        "Posting..."
                                        :
                                        "Post"
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
         <Modal show={draftdeleteModal} handleClose={handlePostDraftDeleteClose}>
                <div className="deleteModal">
                    <div className="Instructions">
                        <p>Do you want to delete this Draft Feed</p>
                    </div>
                    <div className="confirmbuttons">
                        <button onClick={handlePostDraftDeleteClose}>Cancel</button>
                        <button onClick={deleteIndexRow}>Delete</button>
                    </div>
                </div>
            </Modal>
            <Modal show={imageEditModal} handleClose={handleImageEditClose}>
                <div className="imageCrop">
                    <div className="image">
                        <Cropper
                            image={editId && editId.image}
                            crop={crop}
                            rotation={rotation}
                            zoom={zoom}
                            aspect={4 / 5}
                            restrictPosition={false}
                            onCropChange={setCrop}
                            objectFit='contain'
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div className="CropA">
                        <div className="ZoomRotate">
                            <div className="zoom">
                                <label htmlFor="">Zoom</label>
                                <input type="range" value={zoom} onChange={(e) => {
                                    setZoom(e.target.value)
                                }} min="1" max="10" step={1} className="slider" id="myRange" />
                                <div className="insSpan">
                                    <span>0</span>
                                    <span>10x</span>
                                </div>
                            </div>
                            <div className="rotate">
                                <label htmlFor="">Rotate</label>
                                <input type="range" value={rotation} onChange={(e) => {
                                    setRotation(e.target.value)
                                }} min="0" max="360" step={1} className="slider" id="myRange" />
                                <div className="insSpan">
                                    <span>0</span>
                                    <span>360 Deg</span>
                                </div>
                            </div>
                        </div>
                        <div className="cropButton">
                            <button onClick={() => {
                                handleImageEditClose()
                            }}>Cancel</button>
                            <button onClick={showCroppedImage}>Crop</button>
                        </div>
                    </div>
                </div>
            </Modal>
            <div className="addphoto">
                <div className={`cameraSection ${cameraAccess ? "show" : "notshow"}`}>
                    <video ref={videoRef} autoPlay playsInline={true} >
                    </video>
                    <div className="camTopActions">
                        <div className="close" onClick={closeCamera}>
                            <GrClose />
                        </div>
                        <div className={`flash ${!torch && "disable"}`} id='switchFlashOff'>
                            <IoMdFlashOff />
                        </div>
                        <div className={`flash ${torch && "disable"}`} id='switchFlash'>
                            <IoMdFlash />
                        </div>
                    </div>
                    <div className="mainActions">
                        <div className="Library">
                            <label htmlFor="img">
                                <BsFiles />
                            </label>
                            <input type="file" id="img" name="img" accept="image/*" className="w-100" onChange={handleChangeImage} hidden />
                        </div>
                        <div className="takePhoto" onClick={takeImage}>
                            <div className="CaptureButton" >
                            </div>
                        </div>
                        <div className="flipCamera" onClick={() => {
                            setCameraType(!cameraType)
                        }}>
                            <BsPhoneFlip />
                        </div>
                    </div>
                </div>
                <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                />
            </div>
        <div className="feedlist">
            {
                draftPost ?
                    draftPost.length > 0 ?
                        draftPost.map((p, i) =>
                            <SingleDraftFeed key={i} data={p} showModal={handlePostDraftDeleteShow} setdeleteID={setDraftDeleteId} setupdateId={setEditId} showEditModal={handleEditShow} />
                        )
                        :
                        <div className="postEmpty">
                            <span>No Post is Pending for Sync</span>
                        </div>
                    :
                    <div className="PostErr">
                        <span>Internet Disconnected</span>
                    </div>
            }
        </div>
        </>
    )
}

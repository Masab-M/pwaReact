import React, { useCallback, useEffect, useRef, useState } from 'react'
import SingleFeed from './SingleFeed'
import { BsFiles, BsPhoneFlip } from "react-icons/bs"
import { IoMdFlash, IoMdFlashOff } from "react-icons/io"
import { GrClose } from "react-icons/gr"
import firebase from '../Utils/Firebase'
import { getFirestore, collection, getDocs, addDoc, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore/lite';
import { BiImageAdd } from "react-icons/bi"
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import "../Assets/CSS/Feed.css"
import Modal from '../Partials/Modal'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../Partials/Crop/GetCropImage'
import { useLiveQuery } from "dexie-react-hooks";
import { indexDB } from "../Utils/indexdb";
export default function Feed() {
    const db = getFirestore(firebase);
    const [posts, setPosts] = useState([])
    const newPostRef = useRef(null)
    const [cameraType, setCameraType] = useState(true)
    const canvasRef = useRef(null)
    const videoRef = useRef(null)
    const [cameraAccess, setCameraAccess] = useState(false)
    const [newPost, setNewPost] = useState({})
    const [refresh, setRefresh] = useState(true)
    const [location, setLocation] = useState('');
    const [addingPost, setAddingPost] = useState(false)
    const [formErr, setFormErr] = useState(false)
    const [torch, setTorch] = useState(false)
    const [newPostModal, setNewPostModal] = useState(false)
    const [postDeleteModal, setPostDeleteModal] = useState(false)
    const [imageEditModal, setImageEditModal] = useState(false)
    const [deleteID, setDeleteID] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [rotation, setRotation] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [editPostModal, setEditPostModal] = useState(false)
    const [editId, setEditId] = useState(null)
    const [imageEdited, setImageEdited] = useState(false)
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const showCroppedImage = useCallback(async () => {
        try {
            const croppedImage = await getCroppedImg(
                (editPostModal && editId) ? editId.data.image : newPost.image,
                croppedAreaPixels,
                rotation
            )
            if (editPostModal && editId) {
                let postObj = structuredClone(editId);
                postObj.data.image = croppedImage;
                setEditId(postObj)
            }
            else {
                let newObj = structuredClone(newPost);
                newObj.image = croppedImage
                setNewPost(newObj)
            }
            handleImageEditClose()
        } catch (e) {
            console.error(e)
        }
    }, [croppedAreaPixels, rotation])
    function getWindowDimensions() {
        const { innerWidth: width, innerHeight: height } = window;
        return {
            width,
            height
        };
    }
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        // if ('serviceWorker' in navigator && 'SyncManager' in window) {
        //     console.log('if');
        //     navigator.serviceWorker.ready.then(function(reg) {
        //       return reg.sync.register('feed');
        //     }).catch(function() {
        //       // system was unable to register for a sync,
        //       // this could be an OS-level restriction
        //         console.log('supported');

        //     //   postDataFromThePage();
        //     });
        //   } else {
        //     // serviceworker/sync not supported
        //     console.log('not supported');
        //     // postDataFromThePage();
        //   }
        findLocation()
        // displayNotification()

        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    useEffect(() => {
        getFeeds().then((data) => {
            console.log(data);
            setPosts(data)
           
        }).catch(async(err) => {
            handleSyncClick("feedRefresh")
            getFeedCache()
        })
    }, [refresh])
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
              // Handle the received message from the service worker
              console.log('Received message from service worker:', event.data);
              if(event.data.tag==="feedRefresh"){
                notifyMe("Back Online")
                setPosts([])
                setRefresh(!refresh)
              }
              if(event.data.tag==="newPostSync")
              {
                notifyMe("Back Online")
                console.log("get data");
              }
            });
          }
      }, []);
    // useEffect(() => {
    //     const channel = new BroadcastChannel('syncChannel');
    //     channel.onmessage = (event) => {
    //       if (event.data.type === 'feedonline') {
    //         setRefresh(!refresh)
    //         console.log('====================================');
    //         console.log('refresh');
    //         console.log('====================================');
    //       }
    //     };
    
    //     return () => {
    //       channel.close();
    //     };
    //   }, []);
    const handleSyncClick = (tagName) => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready
            .then((registration) => {
              return registration.sync.register(tagName);
            })
            .then(() => {
              console.log('Sync registered');
            })
            .catch((error) => {
              console.log('Sync registration failed:', error);
            });
        } else {
          console.log('Background sync is not supported');
        }
      };
    async function getFeedCache() {
        const cacheResponse = await caches.match('firebase-data');
        if (cacheResponse) {
            const cachedData = await cacheResponse.json();
            setPosts(cachedData)
        } else {
            console.log('No cached data available');
        }
    }
    useEffect(() => {
        if (cameraAccess) {
            videoRef.current.srcObject.getVideoTracks().forEach(track => {
                track.stop()
            })
            openCamera()
        }
    }, [cameraType])
    async function displayNotification() {
        if (Notification.permission === 'granted') {
            const reg = await navigator.serviceWorker.getRegistration();
            reg.showNotification("Go go");
        }
    }
    function findLocation() {
        navigator.geolocation.getCurrentPosition(position => {
            fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyACIbySi3LQJrBV9l55JAgM5k6Qy_2SW94`
            )
                .then((response) => response.json())
                .then(async (data) => {
                    if (data.status === 'OK') {
                        const addressComponents = data.results[0].address_components;
                        let state = '';
                        let country = '';

                        for (let i = 0; i < addressComponents.length; i++) {
                            const types = addressComponents[i].types;
                            if (types.includes('administrative_area_level_1')) {
                                state = addressComponents[i].long_name;
                            } else if (types.includes('country')) {
                                country = addressComponents[i].long_name;
                            }
                        }

                        setLocation(`${state}, ${country}`);
                        const cache = await caches.open("my-cache");
                        await cache.put('location-data', new Response(JSON.stringify(data)));
                      
                    } else {
                        console.log('No results found.', data);
                    }
                })
                .catch(async (error) => {
                    console.log('Error occurred while geocoding:', error);
                });
        }, error => {
            getCacheLocation()
            console.error(error)
        }, {
            timeout: 2000,
            maximumAge: 20000,
            enableHighAccuracy: true
        })
    }
    async function getCacheLocation() {
        const cacheResponse = await caches.match('location-data');
        if (cacheResponse) {
            const cachedData = await cacheResponse.json();
            if (cachedData.status === 'OK') {
                const addressComponents = cachedData.results[0].address_components;
                let state = '';
                let country = '';

                for (let i = 0; i < addressComponents.length; i++) {
                    const types = addressComponents[i].types;
                    if (types.includes('administrative_area_level_1')) {
                        state = addressComponents[i].long_name;
                    } else if (types.includes('country')) {
                        country = addressComponents[i].long_name;
                    }
                }

                setLocation(`${state}, ${country}`);
            } else {
                console.log('No results found.', cachedData);
            }
        } else {
            console.log('No cached Location available');
        }
    }
    async function getFeeds() {
        const feedCol = collection(db, 'feed')
        const query1 = query(feedCol);
        const feedSnapshot = await getDocs(query1, orderBy('timestamp', 'desc'))
        console.log(feedSnapshot);
        const feedList = feedSnapshot.docs.map((doc) => {
            return {
                id: doc.id,
                data: doc.data()
            }
        })
        const cache = await caches.open("my-cache");
        await cache.put('firebase-data', new Response(JSON.stringify(feedList)));
        return feedList;
    }
    async function openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    width: windowDimensions.width, height: windowDimensions.height,
                    facingMode: cameraType ? "user" : "environment"
                    // mandatory: { minAspectRatio: 1.333, maxAspectRatio: 1.334},
                    // optional: [
                    //   { minFrameRate: 60 },
                    //   { maxWidth: 640 },
                    //   { maxHeigth: 480 }
                    // ]
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
    function closeCamera() {
        videoRef.current.srcObject.getVideoTracks().forEach(track => {
            track.stop()
        })
        setTorch(false);
        setCameraAccess(false)
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
        console.log(canvasRef.current.toDataURL("image/png"));
        if (editPostModal && editId) {
            let postObj = structuredClone(editId);
            postObj.data.image = canvasRef.current.toDataURL("image/png");;
            setEditId(postObj)
            setImageEdited(true)
        }
        else {
            let newObj = structuredClone(newPost);
            newObj.image = canvasRef.current.toDataURL("image/png");
            setNewPost(newObj)

        }
        setFormErr(false)
        handleImageEditShow()
    }

    async function uploadFile() {
        const storage = getStorage();
        const metadata = {
            contentType: 'image/jpeg',
        };
        const storageRef = ref(storage, `images/${Date.now()}.jpg`, metadata);
        let blob = await fetch((editPostModal && editId) ? editId.data.image : newPost.image).then(r => r.blob());
        uploadBytes(storageRef, blob).then((snapshot) => {
            console.log('Uploaded a blob or file!', snapshot);
            getDownloadURL(snapshot.ref).then((downloadURL) => {
                console.log('File available at', downloadURL);
                notifyMe("File Uploaded Successfully")
                if (editPostModal && editId) {
                    editPost(downloadURL)
                }
                else {
                    addPost(downloadURL)
                }
            });
        });
    }
    async function addPost(imageUrl) {
        console.log({
            image: imageUrl,
            content: newPost.content,
            heading: newPost.heading,
            location: location,
            timestamp: Date.now()
        });
        const docRef = await addDoc(collection(db, "feed"), {
            image: imageUrl,
            content: newPost.content,
            heading: newPost.heading,
            location: location,
            timestamp: Date.now()
        });
        console.log("Document written with ID: ", docRef.id);
        setRefresh(!refresh)
        newPostRef.current.reset();
        handleNewPostClose()
        setAddingPost(false)
        setNewPost({})
        notifyMe("Post Added Successfully")
    }
    async function editPost(imageurl) {
        const docRef = doc(db, "feed", editId.id);
        console.log({
            image: imageurl,
            content: editId.data.content,
            heading: editId.data.heading,
        });
        const data = {
            image: imageurl,
            content: editId.data.content,
            heading: editId.data.heading,
        };
        setDoc(docRef, data)
            .then(docRef => {
                console.log("Entire Document has been updated successfully", docRef);
                handleEditClose();
                setRefresh(!refresh)
                setAddingPost(false)
                setEditId(null)
                notifyMe("Post Edited Successfully")
            })
            .catch(error => {
                console.log(error);
            })
    }
    async function handlePostForm(e) {
        e.preventDefault()
        if (e.target[0].value !== '' && e.target[1].value !== '' && newPost.image) {
            let newObj = newPost;
            newObj.heading = e.target[0].value;
            newObj.content = e.target[1].value;
            console.log('log', newObj);
            setNewPost(newObj)
            if(!navigator.onLine)
            {
                try {
                    console.log({  heading:e.target[0].value,
                        content:e.target[1].value,
                        image:newPost.image,
                        location:location,});
                    await indexDB.posts.add({
                        heading:e.target[0].value,
                        content:e.target[1].value,
                        image:newPost.image,
                        location:location,
                    })
                    e.target.reset();
                    handleNewPostClose();
                    setNewPost({})
                    handleSyncClick("newPostSync")
                } catch (error) {
                    console.log(`Failed to add : ${error}`);
                }
            }
            else{
                uploadFile()
                setAddingPost(true)
            }
        }
        else {
            setFormErr(true)
        }
    }
    function handleChangeImage(e) {
        closeCamera()
        var input = e.target;
        var reader = new FileReader();
        reader.onload = function () {
            var dataURL = reader.result;
            console.log({ [e.target.name]: dataURL })
            if (editPostModal && editId) {
                let postObj = structuredClone(editId);
                postObj.data.image = dataURL;
                setEditId(postObj)
                setImageEdited(true)
            }
            else {
                let newObj = structuredClone(newPost);
                newObj.image = dataURL
                setNewPost(newObj)
            }
            setFormErr(false)
            handleImageEditShow()
        };
        reader.readAsDataURL(input.files[0]);
    }
    function notifyMe(message) {
        if (!("Notification" in window)) {
        } else if (Notification.permission === "granted") {
            // Check whether notification permissions have already been granted;
            // if so, create a notification
            const notification = new Notification(message);
            // …
        } else if (Notification.permission !== "denied") {
            // We need to ask the user for permission
            Notification.requestPermission().then((permission) => {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    const notification = new Notification("Hi there!");
                    // …
                }
            });
        }
    }
    function handleEditForm(e) {
        e.preventDefault()
        if (e.target[0].value !== '' && e.target[1].value !== '' && editId.data.image) {
            let newObj = editId;
            newObj.data.heading = e.target[0].value;
            newObj.data.content = e.target[1].value;
            setEditId(newObj)
            console.log(e.target[0].value);
            if (!imageEdited) {
                editPost(editId.data.image)
            }
            else {
                uploadFile()
            }
            setAddingPost(true)
        }
        else {
            setFormErr(true)
        }
    }
    async function deletePost() {
        await deleteDoc(doc(db, "feed", deleteID)).then((res) => {
            console.log('deleted');
            notifyMe("Post Deleted Successfully")
        })
        handlePostDeleteClose()
        setRefresh(!refresh)
    }
    const handleNewPostClose = () => {
        setNewPostModal(false);
        setNewPost({})
    };
    const handleNewPostShow = () => {
        setNewPostModal(true);
    };
    const handlePostDeleteClose = () => {
        setPostDeleteModal(false);
        setDeleteID(null)
    };
    const handlePostDeleteShow = () => {
        setPostDeleteModal(true);
    };
    const handleImageEditClose = () => {
        setImageEditModal(false);
    };
    const handleImageEditShow = () => {
        setImageEditModal(true);
    };
    const handleEditClose = () => {
        setEditPostModal(false);
        setEditId(null)
    };
    const handleEditShow = () => {
        setEditPostModal(true);
    };
    return (
        <div>
            <button onClick={()=>{
                handleSyncClick("sync-messages")
            }}>Trigger Sync</button>
            <Modal show={newPostModal} handleClose={handleNewPostClose}>
                <div className="newPostPopup">
                    <form ref={newPostRef} action="" onSubmit={handlePostForm}>
                        <div className="contentSection">
                            <div className="title">
                                <label htmlFor="heading">Heading</label>
                                <input disabled={addingPost} type="text" name="heading" id="heading" placeholder='Add Post Heading' />
                            </div>
                            <div className="newPostContent">
                                <label htmlFor="Content">Description</label>
                                <textarea disabled={addingPost} onChange={() => {
                                    setFormErr(false)
                                }} name="newPostText" id="newPostText" cols="30" rows="3" placeholder='Type Your Post Content'></textarea>
                            </div>
                            <div className="ContentI">
                                {
                                    newPost.image &&
                                    <img src={newPost.image} alt="" srcset="" />
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
            <Modal show={editPostModal} handleClose={handleEditClose}>
                <div className="newPostPopup">
                    <form ref={newPostRef} action="" onSubmit={handleEditForm}>
                        <div className="contentSection">
                            <div className="title">
                                <label htmlFor="heading">Heading</label>
                                <input disabled={addingPost} onChange={() => {
                                    setFormErr(false)
                                }} type="text" defaultValue={editId && editId.data.heading} name="heading" id="heading" placeholder='Add Post Heading' />
                            </div>
                            <div className="newPostContent">
                                <label htmlFor="Content">Description</label>
                                <textarea disabled={addingPost} onChange={() => {
                                    setFormErr(false)
                                }} name="newPostText" defaultValue={editId !== null && editId.data.content} id="newPostText" cols="30" rows="3" placeholder='Type Your Post Content'></textarea>
                            </div>
                            <div className="ContentI">
                                {
                                    editId !== null && editId.data.image &&
                                    <img src={editId.data.image} alt="" srcset="" />
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
            <Modal show={imageEditModal} handleClose={handleImageEditClose}>
                <div className="imageCrop">
                    <div className="image">
                        <Cropper
                            image={(editPostModal && editId) ? editId.data.image : newPost.image}
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
                                if (editPostModal && editId) {
                                    let postObj = structuredClone(editId);
                                    postObj.data.image = null;
                                    setEditId(postObj)
                                }
                                else {
                                    let postObj = structuredClone(newPost);
                                    postObj.image = null;
                                    setNewPost(postObj)
                                }
                            }}>Cancel</button>
                            <button onClick={showCroppedImage}>Crop</button>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal show={postDeleteModal} handleClose={handlePostDeleteClose}>
                <div className="deleteModal">
                    <div className="Instructions">
                        <p>Do you want to delete this Feed</p>
                    </div>
                    <div className="confirmbuttons">
                        <button onClick={handlePostDeleteClose}>Cancel</button>
                        <button onClick={deletePost}>Delete</button>
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
            <div className="NewFeed">
                <div className="addFeed">
                    <button onClick={handleNewPostShow}>
                        Add Feed
                        <BiImageAdd />
                    </button>
                </div>
            </div>
            <div className="feedlist">
                {
                    posts ?
                        posts.length > 0 ?
                            posts.map((p, i) =>
                                <SingleFeed key={i} data={p.data} id={p.id} showModal={handlePostDeleteShow} setdeleteID={setDeleteID} setupdateId={setEditId} showEditModal={handleEditShow} />
                            )
                            :
                            <div className="postEmpty">
                                <span>Be First to add new Feed</span>
                            </div>
                        :
                        <div className="PostErr">
                            <span>Internet Disconnected</span>
                        </div>
                }
            </div>
        </div>
    )
}

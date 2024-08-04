import React, { useCallback, useEffect, useRef, useState } from 'react'
import SingleFeed from './SingleFeed'
import { BsFiles, BsPhoneFlip } from "react-icons/bs"
import { IoMdFlash, IoMdFlashOff } from "react-icons/io"
import { GrClose } from "react-icons/gr"
import firebase from '../Utils/Firebase'
import { getFirestore, collection, getDocs, addDoc, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore/lite';
import { BiImageAdd } from "react-icons/bi"
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import "../Assets/CSS/Feed.css"
import Modal from '../Partials/Modal'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../Partials/Crop/GetCropImage'
import { indexDB } from "../Utils/indexdb";
import SingleDraftFeed from './SingleDraftFeed'
import { useNavigate } from 'react-router-dom'

export default function Feed({isLogin,LoginPopup,loginSuccess}) {
    const navigate =useNavigate()
    useEffect(() => {
        if(loginSuccess===true){
            notifyMe('Login Successfull')
            navigate("/feed")
        }
        else if(loginSuccess===false)
        {
            notifyMe('Login Failed Try Again')
        }
    }, [loginSuccess])
    useEffect(() => {
        if(isLogin===false)
        {
            notifyMe('User Log out')
        }
    }, [isLogin])
    
    const textAreaRef = useRef(null)
    const [headingValue, setHeadingValue] = useState({
        value: "",
        error: false
    })
    const [contentValue, setContentValue] = useState({
        value: "",
        error: false
    })
    const textHeadingRef = useRef(null)
    const textHeadingRefNew = useRef(null)
    const textAreaRefNew = useRef(null)
    const calculateTextAreaHeight = (ref) => {
        const element = ref.current;
        element.style.height = 'auto'; // Reset the height to auto
        element.style.height = `${element.scrollHeight}px`; // Set the height to the scroll height
    };

    const handleResizeText = (ref) => {
        calculateTextAreaHeight(ref);
    };
    const calculateHeadingAreaHeight = (ref) => {
        const element = ref.current;
        element.style.height = 'auto'; // Reset the height to auto
        element.style.height = `${element.scrollHeight}px`; // Set the height to the scroll height
    };

    const handleResizeHeading = (ref) => {
        calculateHeadingAreaHeight(ref);
    };
    const db = getFirestore(firebase);
    const [draftPost, setDraftPost] = useState([])
    const [editPostType, setEditPostType] = useState('')
    const [posts, setPosts] = useState(null)
    const newPostRef = useRef(null)
    const editPostRef = useRef(null)
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
    const [imageError, setImageError] = useState(false)
    const [contentLoaded, setContentLoaded] = useState(false)
    const [cameraStatus, setCameraStatus] = useState('')
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
        // syncEdit();
        getIndexDBData().then((res) => {
            if (res.length > 0) {
                setDraftPost(res)
            }
            else {
                setDraftPost([])
            }
        })
        getFeeds().then((data) => {
            setPosts(data)
            setContentLoaded(true)
        }).catch(async (err) => {
            handleSyncClick("feedRefresh")
            getFeedCache()
        })
    }, [refresh])
    useEffect(() => {
        // findLocation()
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
            if (!editPostModal && !newPostModal) return false
            if (editPostModal) {
                handleResizeHeading(textHeadingRef)
                handleResizeText(textAreaRef)
            }
            else if (newPost) {
                handleResizeHeading(textHeadingRefNew)
                handleResizeText(textAreaRefNew)
            }
        }
        window.addEventListener('resize', handleResize);
        if ('serviceWorker' in navigator) {
            const handleMessage = event => {
                if (event.data.tag === "feedRefresh") {
                    try {
                        setPosts(null);
                        setContentLoaded(false)
                        SyncData();
                        syncDelete();
                        syncEdit();
                        // findLocation();
                        notifyMe("Back Online");
                        setRefresh(!refresh);
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
            };

            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
                window.removeEventListener('resize', handleResize);
            };
        }
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    async function syncEdit() {

        getIndexDBEditData().then((res) => {
            if (res.length > 0) {
                res.forEach((p) => {
                    let newObj = {
                        id: p.postId,
                        indexid: p.id,
                        data: {
                            heading: p.heading,
                            content: p.content,
                            image: p.image,
                        }
                    }
                    setEditId(newObj)
                    if (!(newObj.data.image instanceof Blob)) {
                        editPost(newObj)
                    }
                    else {
                        uploadFile(newObj, "edit")
                    }
                })
            }
        })
    }
    async function syncDelete() {

        getIndexDBDeleteData().then((res) => {
            if (res.length > 0) {
                res.forEach((p) => {
                    deletePost(p.postId).then(() => {
                        deleteIndexDeleteKey(p.id)
                        setRefresh(!refresh)
                    })
                })
            }
        })
    }
    async function SyncData() {
        getIndexDBData().then((res) => {
            if (res.length > 0) {
                res.forEach((p) => {
                    let newObj = {
                        indexid: p.id,
                        heading: p.heading,
                        content: p.content,
                        image: p.image,
                        location: p.location
                    }
                    uploadFile(newObj, "new")
                })
            }
        })
    }
    async function deleteIndexEditRow(id) {
        await indexDB.editPosts.delete(id)
    }
    async function deleteIndexRow(id) {
        await indexDB.posts.delete(id)
    }
    async function deleteIndexDeleteKey(id) {
        await indexDB.deletePosts.delete(id)
    }
    async function getIndexDBData() {
        const posts = await indexDB.posts.toArray();
        return posts;
    }
    async function getIndexDBDeleteData() {
        const posts = await indexDB.deletePosts.toArray();
        return posts;
    }
    async function getIndexDBEditData() {
        const posts = await indexDB.editPosts.toArray();
        return posts;
    }
    const handleSyncClick = (tagName) => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready
                .then(async (registration) => {
                    const tags = await registration.sync.getTags()
                    if (tags.includes(tagName)) {
                        return Promise.resolve()
                    } else {
                        return registration.sync.register(tagName)
                            .then(() => {
                            })
                    }
                })
                .catch((error) => {
                    console.error('Sync registration failed:', error);
                });
        } else {
            console.warn('Background sync is not supported');
        }
    };
    async function getFeedCache() {
        const cacheResponse = await caches.match('firebase-data');
        if (cacheResponse) {
            const cachedData = await cacheResponse.json();
            setPosts(cachedData)
            setContentLoaded(true)
            
        } else {
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
    function findLocation() {
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position);
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
                        console.warn('No results', data);
                    }
                })
                .catch(async (error) => {
                    console.error('Error occurred while geocoding:', error);
                });
        }, error => {
            getCacheLocation()
            console.error(error)
        }, {
            timeout: 2000,
            maximumAge: 20000,
            enableHighAccuracy: false
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
                console.error('No results found.', cachedData);
            }
        } else {
            console.error('No cached Location available');
        }
    }
    async function getFeeds() {
        const feedCol = collection(db, 'feed')
        const query1 = query(feedCol, orderBy('timestamp', 'desc'));
        const feedSnapshot = await getDocs(query1)
        const feedList = feedSnapshot.docs.map((doc) => {
            return {
                id: doc.id,
                data: doc.data()
            }
        })
        const cache = await caches.open("my-cache");
        await cache.put('firebase-data', new Response(JSON.stringify(feedList)));
        console.log(feedList);
        return feedList;
    }
    async function openCamera() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        aspectRatio: 1 / 1,
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
                    })
                });
                const btn2 = document.getElementById('switchFlashOff')
                btn2.addEventListener('click', function () {
                    setTorch(false)
                    track.applyConstraints({
                        advanced: [{ torch: false }]
                    }).catch((err) => {
                    })
                });
                document.querySelector('video').srcObject = stream
                setCameraStatus('')
            }
            else {
                console.error('getUserMedia is not supported in this browser.');
                setCameraStatus('Camera is not Supported in this Browser')
              }
            
        } catch (error) {
            console.error(error)
            setCameraStatus('Camera Required, Allow Camera')
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
        setImageError(false)
        setFormErr(false)
        handleImageEditShow()
    }

    async function uploadFile(obj, form) {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${Date.now()}.jpg`);
        // let blob = await fetch((editPostModal && editId) ? editId.data.image : newPost.image).then(r => r.blob());
        await uploadBytes(storageRef, form === "edit" ? obj.data.image : obj.image).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
                if (form === "edit") {
                    obj.data.image = downloadURL
                    editPost(obj)
                }
                else if (form === "new") {
                    obj.image = downloadURL;
                    addPost(obj)
                }
            });
        });
    }
    async function addPost(obj) {
        console.log({
            image: obj.image || null,
            content: obj.content || null,
            heading: obj.heading || null,
            location: location === "" ? obj.location : location,
            timestamp: Date.now() || null,
            uid:obj.uid || null,
        });
        await addDoc(collection(db, "feed"), {
            image: obj.image || null,
            content: obj.content || null,
            heading: obj.heading || null,
            location: 'Remote',
            timestamp: Date.now() || null,
            uid:obj.uid || null,
        });
        if (obj.indexid) {
            deleteIndexRow(obj.indexid).then((res) => {
                setRefresh(true)
                notifyMe("Your feed has been successfully synced.")
            })
        }
        else {
            setRefresh(!refresh)
            newPostRef.current.reset();
            setHeadingValue({ value: '', error: false })
            setContentValue({ value: '', error: false })
            handleNewPostClose()
            setAddingPost(false)
            setNewPost({})
            notifyMe("Your feed has been added successfully.")
        }
    }
    async function editPost(obj) {
        const docRef = doc(db, "feed", editId ? editId.id : obj.id);
        const data = {
            image: obj.data.image,
            content: obj.data.content,
            heading: obj.data.heading,
        };
        updateDoc(docRef, data)
            .then(docRef => {
                if (obj.indexid) {
                    deleteIndexEditRow(obj.indexid).then((res) => {
                        setRefresh(!refresh)
                        notifyMe("Your feed has been successfully synced.")
                    })
                }
                else {
                    setRefresh(!refresh)
                    handleEditClose();
                    setAddingPost(false)
                    setEditId(null)
                    setImageEdited(false)
                    notifyMe("You have successfully edited the feed.")
                }
            })
            .catch(error => {
                console.error(error);
            })
    }
    async function handlePostForm(e) {
        e.preventDefault()
        if (e.target[0].value !== '' && e.target[1].value !== '' && newPost.image) {
            let blob = await fetch(newPost.image).then(r => r.blob());
            let newObj = newPost;
            newObj.heading = e.target[0].value;
            newObj.content = e.target[1].value;
            newObj.image = blob
            newObj.uid=localStorage.getItem('uid')
            setNewPost(newObj)
            if (!navigator.onLine) {
                try {
                    await indexDB.posts.add({
                        heading: e.target[0].value,
                        content: e.target[1].value,
                        image: blob,
                        location: location,
                        uid:localStorage.getItem('uid')
                    })
                    e.target.reset();
                    setHeadingValue({ value: '', error: false })
                    setContentValue({ value: '', error: false })
                    handleNewPostClose();
                    setNewPost({})
                    notifyMe('Draft Feed will be uploaded once system is online.')
                    handleSyncClick("feedRefresh")
                    setRefresh(!refresh)
                } catch (error) {
                    console.error(`Failed to add : ${error}`);
                }
            }
            else {
                uploadFile(newObj, "new")
                setAddingPost(true)
            }
        }
        else {
            setFormErr(true)
        }
    }
    function handleChangeImage(e) {
        closeCamera();
        var input = e.target;
        var file = input.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            var reader = new FileReader();
            reader.onload = function () {
                var dataURL = reader.result;
                if (editPostModal && editId) {
                    let postObj = structuredClone(editId);
                    postObj.data.image = dataURL;
                    setEditId(postObj);
                    setImageEdited(true);
                } else {
                    let newObj = structuredClone(newPost);
                    newObj.image = dataURL;
                    setNewPost(newObj);
                }
                setImageError(false)
                setFormErr(false);
                handleImageEditShow();
            };
            reader.readAsDataURL(file);
        } else {
            setImageError(true)
        }
    }

    function notifyMe(message) {
        try {
          if (!("serviceWorker" in navigator) || !("showNotification" in ServiceWorkerRegistration.prototype)) {
            // Service workers or showNotification are not supported
            alert("Service workers or notifications are not supported in this browser.");
          } else if (Notification.permission === "granted") {
            // Check whether notification permissions have already been granted;
            // if so, create a notification using the service worker
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(message, {
                icon: "/logo192.png" // Optional icon for the notification
              });
            });
          } else if (Notification.permission !== "denied") {
            // We need to ask the user for permission
            Notification.requestPermission().then((permission) => {
              // If the user accepts, let's create a notification using the service worker
              if (permission === "granted") {
                navigator.serviceWorker.ready.then((registration) => {
                  registration.showNotification(message, {
                    body: message,
                    icon: "/logo192.png" // Optional icon for the notification
                  });
                });
              }
            });
          }
        } catch (error) {
          alert("An error occurred while displaying the notification: " + error);
          console.error("An error occurred while displaying the notification:", error);
        }
      }
      
    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    async function handleEditForm(e) {
        e.preventDefault()
        if (e.target[0].value !== '' && e.target[1].value !== '' && editId.data.image) {
            let blob = !imageEdited ? editId.data.image : await fetch(editId.data.image).then(r => r.blob());
            let newObj = editId;
            newObj.data.heading = e.target[0].value;
            newObj.data.content = e.target[1].value;
            newObj.data.image = blob;
            setEditId(newObj)
            if (editPostType === "draft") {
                const editDB = await indexDB.posts.where("id").equals(editId.id).first();
                if (editDB) {
                    await indexDB.posts.update(editDB.id, {
                        heading: e.target[0].value,
                        content: e.target[1].value,
                        image: blob
                    })
                    notifyMe("Feed will be edited once system gets online")
                }
                handleEditClose();
            }
            else {
                if (!navigator.onLine) {
                    const editDB = await indexDB.editPosts.where("postId").equalsIgnoreCase(editId.id).toArray();
                    if (editDB.length > 0) {
                        await indexDB.editPosts.update(editDB[0].id, {
                            heading: e.target[0].value,
                            content: e.target[1].value,
                            image: blob
                        })
                    }
                    else {
                        await indexDB.editPosts.add({
                            postId: editId.id,
                            heading: e.target[0].value,
                            content: e.target[1].value,
                            image: blob
                        })
                    }
                    const updatedItems = [...posts];
                    const index = updatedItems.findIndex(item => item.id === editId.id);
                    if (index !== -1) {
                        let data = {}
                        if (blob instanceof Blob) {
                            await blobToDataURL(blob)
                                .then((dataURL) => {
                                    data = {
                                        heading: e.target[0].value,
                                        content: e.target[1].value,
                                        image: dataURL
                                    }
                                })
                                .catch((error) => {
                                    console.error(error);
                                });

                        }
                        else {
                            data = {
                                heading: e.target[0].value,
                                content: e.target[1].value,
                            }
                        }
                        const updatedItem = {
                            ...updatedItems[index],
                            data: data
                        };
                        updatedItems[index] = updatedItem; // Replace the item at the found index with the updated object
                        setPosts(updatedItems);
                        setContentLoaded(true)
                        
                        const cache = await caches.open("my-cache");
                        await cache.put('firebase-data', new Response(JSON.stringify(updatedItems)));
                    }
                    handleEditClose();
                    notifyMe("Feed will be edited once system gets online")
                    handleSyncClick("feedRefresh")
                }
                else {
                    if (!imageEdited) {
                        editPost(newObj)
                    }
                    else {
                        uploadFile(newObj, "edit")
                    }
                    setAddingPost(true)
                }
            }
        }
        else {
            setFormErr(true)
        }
    }
    async function deletePost(id) {
        if (editPostType === 'draft') {
            deleteIndexRow(id)
            handlePostDeleteClose()
            setRefresh(!refresh)
        }
        else {
            if (!navigator.onLine) {
                const deleteDB = await indexDB.editPosts.where("postId").equalsIgnoreCase(deleteID).toArray();
                if (deleteDB.length > 0) {
                    await indexDB.deletePosts.update(deleteDB[0].id, {
                        postId: deleteID,
                    })
                }
                else {
                    await indexDB.deletePosts.add({
                        postId: deleteID,
                    })
                }
                let filteredArray = posts.filter(item => item.id !== deleteID)
                setPosts(filteredArray);
            setContentLoaded(true)

                const cache = await caches.open("my-cache");
                await cache.put('firebase-data', new Response(JSON.stringify(filteredArray)));
                handlePostDeleteClose()
                notifyMe('Feed will be Deleted once system is online.')
                handleSyncClick("feedRefresh")
            }
            else {
                await deleteDoc(doc(db, "feed", id)).then((res) => {
                    notifyMe("Your feed has been successfully deleted.")
                })
                handlePostDeleteClose()
                setRefresh(!refresh)
            }
        }
    }
    const handleNewPostClose = () => {
        setNewPostModal(false);
        setNewPost({})
        setHeadingValue({ value: '', error: false })
        setContentValue({ value: '', error: false })
        setCameraStatus('')
        setImageError(false)
        setFormErr(false)
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
        setFormErr(false)
        setEditId(null)
        editPostRef.current.reset()
        setHeadingValue({ value: '', error: false })
        setContentValue({ value: '', error: false })
        setCameraStatus('')
        setAddingPost(false)
        setEditId(null)
        setImageEdited(false)
    };
    const handleEditShow = () => {
        setEditPostModal(true);
    };
    useEffect(() => {
        handleResizeText(textAreaRef)
        handleResizeHeading(textHeadingRef)
    }, [editId])
    function checkHeadingCount(e) {
        if (e.target.value.length <= 50 || e.target.value.length === 0) {
            setHeadingValue({ error: false, value: e.target.value });
        } else {
            setHeadingValue({ ...headingValue, error: true });
        }
    }
    function checkContentCount(e) {
        if (e.target.value.length <= 3000 || e.target.value.length === 0) {
            setContentValue({ error: false, value: e.target.value })
        }
        else {
            setContentValue({ ...contentValue, error: true })
        }
    }
    function clearImage() {
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
    }
    return (
        <>
            <Modal show={newPostModal} handleClose={handleNewPostClose}>
                <div className="newPostPopup">
                    <form ref={newPostRef} action="" onSubmit={handlePostForm}>
                        <div className="contentSection">
                            <div className="title">
                                <label htmlFor="heading">Heading</label>
                                <textarea value={headingValue.value} row={1} ref={textHeadingRefNew} onChange={(e)=>{
                                    setFormErr(false)
                                    
                                    checkHeadingCount(e)
                                    }} rows={1} disabled={addingPost} onInput={() => { handleResizeHeading(textHeadingRefNew) }} name="heading" id="heading" placeholder='Add Post Heading' />
                                <div className="inputInfo">
                                    <span>
                                        {
                                            headingValue.error ?
                                                "Only 50 Characters" : ""
                                        }
                                        {
                                            (formErr && headingValue.value==='') &&
                                            "Heading Missing"
                                        }
                                    </span>
                                    <span>{headingValue.value.length}/50</span>
                                </div>
                            </div>
                            <div className="newPostContent">
                                <label htmlFor="Content">Description</label>
                                <textarea ref={textAreaRefNew} value={contentValue.value} onInput={() => { handleResizeText(textAreaRefNew) }} disabled={addingPost} onChange={(e) => {
                                    checkContentCount(e)
                                    setFormErr(false)
                                }} name="newPostText" id="newPostText" cols="30" rows="1" placeholder='Type Your Post Content'></textarea>
                                <div className="inputInfo">
                                    <span>
                                        {
                                            contentValue.error ?
                                                "Only 3000 Characters" : ""
                                        }
                                        {
                                            (formErr && contentValue.value==='') &&
                                            "Content Missing"
                                        }
                                    </span>
                                    <span>{contentValue.value.length}/3000</span>
                                </div>
                            </div>
                            <div className="ContentI">
                                {
                                    imageError &&
                                    <div className="newPostErr">
                                        <span>Only add image files with the extensions 'png' and 'jpeg'.</span>
                                    </div>
                                }
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
                                <div className="newPostErr">
                                    <span>
                                    {
                                        (formErr && !newPost.image) &&
                                        "Image Missing"
                                    }
                                    </span>
                                </div>
                            <button type='submit'>
                                {
                                    addingPost ?
                                        "Posting..."
                                        :
                                        "Post"
                                }
                            </button>
                        </div>
                        <div className="CameraStatus">
                            {
                                cameraStatus!==''
                                &&
                            <span>
                                {
                                    cameraStatus
                                }
                            </span>
                            }
                        </div>
                    </form>
                </div>
            </Modal>
            <Modal show={editPostModal} handleClose={handleEditClose}>
                <div className="newPostPopup">
                    <form ref={editPostRef} action="" onSubmit={handleEditForm}>
                        <div className="contentSection">
                            <div className="title">
                                <label htmlFor="heading">Heading</label>
                                <textarea value={headingValue.value} maxLength={50} rows={1} ref={textHeadingRef} onInput={() => { handleResizeHeading(textHeadingRef) }} disabled={addingPost} onChange={(e) => {
                                    checkHeadingCount(e)
                                    setFormErr(false)
                                }} type="text" name="heading" id="heading" placeholder='Add Post Heading' />
                                <div className="inputInfo">
                                    <span>
                                        {
                                            headingValue.error ?
                                                "Only 50 Characters" : ""
                                        }
                                        {
                                            (formErr && headingValue.value==='') &&
                                            "Heading Missing"
                                        }
                                    </span>
                                    <span>{headingValue.value.length}/50</span>
                                </div>
                            </div>
                            <div className="newPostContent">
                                <label htmlFor="Content">Description</label>
                                <textarea value={contentValue.value} ref={textAreaRef} maxLength={3000} onInput={() => { handleResizeText(textAreaRef) }} disabled={addingPost} onChange={(e) => {
                                    checkContentCount(e)
                                    setFormErr(false)
                                }} name="newPostText" id="newPostText" cols="30" rows="1" placeholder='Type Your Post Content'></textarea>
                                <div className="inputInfo">
                                    <span>
                                        {
                                            contentValue.error ?
                                                "Only 50 Characters" : ""
                                        }
                                          {
                                            (formErr && contentValue.value==='') &&
                                            "Content Missing"
                                        }
                                    </span>
                                    <span>{contentValue.value.length}/3000</span>
                                </div>
                            </div>
                            <div className="ContentI">
                                {
                                    editId !== null && editId.data.image &&
                                    <>
                                        <img src={(editId.data.image instanceof Blob) ? URL.createObjectURL(editId.data.image) : editId.data.image} alt="" srcSet="" />
                                    </>
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
                                <div className="newPostErr">
                                    <span>
                                    {
                                        editId &&
                                            (formErr && !editId.data.image) &&
                                            "Image Missing"
                                    }
                                    </span>
                                </div>
                            <button type='submit'>
                                {
                                    addingPost ?
                                        "Updating..."
                                        :
                                        "Update"
                                }
                            </button>
                        </div>
                        <div className="CameraStatus">
                            {
                                cameraStatus!==''
                                &&
                            <span>
                                {
                                    cameraStatus
                                }
                            </span>
                            }
                        </div>
                    </form>
                </div>
            </Modal>
            <Modal clearImage={clearImage} show={imageEditModal} handleClose={handleImageEditClose}>
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
                                }} min={0} max="10" step={1} className="slider" id="myRange" />
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
                                clearImage()
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
                        <button onClick={() => {
                            deletePost(deleteID)
                        }}>Delete</button>
                    </div>
                </div>
            </Modal>

            <div className="addphoto">
                <div className={`cameraSection ${cameraAccess ? "show" : "notshow"}`}>
                    <video style={{ height: windowDimensions.height, width: windowDimensions.width }} ref={videoRef} autoPlay playsInline={true} >
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
                    <button onClick={()=>{
                        if(isLogin)
                        {
                            handleNewPostShow()
                        }
                        else{
                            LoginPopup()
                        }
                    }}>
                        Add Feed
                        <BiImageAdd />
                    </button>
                </div>
            </div>
            <div className="feedlist">
                {
                    draftPost ?
                        draftPost.length > 0 ?
                            draftPost.slice(0).reverse().map((p, i) =>
                                <SingleDraftFeed key={i} data={p} setEditPostType={setEditPostType} showModal={handlePostDeleteShow} setdeleteID={setDeleteID} setupdateId={setEditId} showEditModal={handleEditShow} setHeading={setHeadingValue} setContent={setContentValue} />
                            )
                            : ''
                        : ''
                }
                {
                    posts ?
                        posts.length > 0 ?
                            posts.map((p, i) =>
                                <SingleFeed key={i} data={p.data} setEditPostType={setEditPostType} id={p.id} showModal={handlePostDeleteShow} setdeleteID={setDeleteID} setupdateId={setEditId} showEditModal={handleEditShow} setHeading={setHeadingValue} setContent={setContentValue} isLogin={isLogin} />
                            )
                            :
                            draftPost.length === 0 &&
                            <div className="postEmpty">
                                <span>Be First to add new Feed</span>
                            </div>
                        :
                        <div className="spinner"></div>
                }
            </div>
        </>
    )
}

fetchDataFromNetwork()

async function fetchDataFromNetwork(url) {
    try {
      // Fetch data from the network
      const response = await fetch(url);
      const apiData = await response.json();

      // Store the data in the cache
      const cache = await caches.open("my-cache");
      await cache.put('your-data', new Response(JSON.stringify(apiData)));
  
      // Return the fetched data
      return apiData;
    } catch (error) {
      // If there's an error fetching from the network, attempt to retrieve from cache
      const cache = await caches.open("my-cache");
      const cachedData = await cache.match('your-data');
  
      if (cachedData) {
        // If data is found in cache, return the cached data
        return cachedData.json();
      } else {
        // If data is not found in cache and there's an error fetching from network, handle the error
        throw error;
      }
    }
  }
  
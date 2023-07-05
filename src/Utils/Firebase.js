import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBahqtm7u4Yrk9oHAE5vxOyi69zyqkuzQA",
  authDomain: "social-feed-6e918.firebaseapp.com",
  projectId: "social-feed-6e918",
  storageBucket: "social-feed-6e918.appspot.com",
  messagingSenderId: "707306439192",
  appId: "1:707306439192:web:560bc764251663469a796d",
};
const firebase = initializeApp(firebaseConfig);
//const db = firebaseapp.firestore();
export default firebase;

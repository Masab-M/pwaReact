import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyANDYL0YX8yfKC-axKtpxjUFUVlKB_vw1M",
  authDomain: "pwa-react-fd69f.firebaseapp.com",
  projectId: "pwa-react-fd69f",
  storageBucket: "pwa-react-fd69f.appspot.com",
  messagingSenderId: "962806344446",
  appId: "1:962806344446:web:7a4fffcfd3bc35556dd3af",
  measurementId: "G-1PTL4B324E"
};
const firebase = initializeApp(firebaseConfig);
//const db = firebaseapp.firestore();
export default firebase;

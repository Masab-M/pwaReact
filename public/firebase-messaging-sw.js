importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);

const firebaseConfig = {
    apiKey: "AIzaSyBahqtm7u4Yrk9oHAE5vxOyi69zyqkuzQA",
    authDomain: "social-feed-6e918.firebaseapp.com",
    projectId: "social-feed-6e918",
    storageBucket: "social-feed-6e918.appspot.com",
    messagingSenderId: "707306439192",
    appId: "1:707306439192:web:560bc764251663469a796d",
  };

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
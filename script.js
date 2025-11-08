// تكوين Firebase - استخدم المعلومات من عندك
const firebaseConfig = {
    apiKey: "AIzaSyD3JAkLqDasFoqChKxFp9JsJZjPGCelJzc",
    authDomain: "rcloud-efb73.firebaseapp.com",
    projectId: "rcloud-efb73",
    storageBucket: "rcloud-efb73.firebasestorage.app",
    messagingSenderId: "725249738242",
    appId: "1:725249738242:web:18372ce51017f0c05b891b"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

// باقي الكود يتبع بنفس الطريقة...
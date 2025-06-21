// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDryJc0Y7JV_Os5DZdEDts5XaFUEtJ7wDk",
  authDomain: "centrodecompra-5fa91.firebaseapp.com",
  projectId: "centrodecompra-5fa91",
  storageBucket: "centrodecompra-5fa91.firebasestorage.app",
  messagingSenderId: "276696026262",
  appId: "1:276696026262:web:979a68c0796ea1d17346b7",
  measurementId: "G-PM11NQL61N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, db, storage, analytics };

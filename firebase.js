import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase
const firebaseConfig = {// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDryJc0Y7JV_Os5DZdEDts5XaFUEtJ7wDk",
  authDomain: "centrodecompra-5fa91.firebaseapp.com",
  projectId: "centrodecompra-5fa91",
  storageBucket: "centrodecompra-5fa91.firebasestorage.app",
  messagingSenderId: "276696026262",
  appId: "1:276696026262:web:979a68c0796ea1d17346b7",
  measurementId: "G-PM11NQL61N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Exporta para uso global
window.firebaseDb = db;
window.firebaseStorage = storage;
window.firebaseAnalytics = analytics;

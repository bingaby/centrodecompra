// firebase.js
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';

// Sua config do Firebase (preencha com seus dados)
const firebaseConfig = {
  apiKey: "AIzaSyDryJc0Y7JV_Os5DZdEDts5XaFUEtJ7wDk",
  authDomain: "centrodecompra-5fa91.firebaseapp.com",
  projectId: "centrodecompra-5fa91",
  storageBucket: "centrodecompra-5fa91.appspot.com", // corrigido .app -> .appspot.com
  messagingSenderId: "276696026262",
  appId: "1:276696026262:web:979a68c0796ea1d17346b7",
  measurementId: "G-PM11NQL61N"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs
};

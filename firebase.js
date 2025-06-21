import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase (copiada do seu projeto Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDryJc0Y7JV_Os5DZdEDts5XaFUEtJ7wDk",
  authDomain: "centrodecompra-5fa91.firebaseapp.com",
  projectId: "centrodecompra-5fa91",
  storageBucket: "centrodecompra-5fa91.appspot.com",
  messagingSenderId: "276696026262",
  appId: "1:276696026262:web:979a68c0796ea1d17346b7",
  measurementId: "G-PM11NQL61N"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços que irá usar
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Exporta para uso global (no navegador)
window.firebaseDb = db;
window.firebaseStorage = storage;
window.firebaseAnalytics = analytics;

import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDiDO5dpk5hMsGkeVnXBdmSuwvd8ACiuHA",
  authDomain: "agente-piemonte.firebaseapp.com",
  projectId: "agente-piemonte",
  storageBucket: "agente-piemonte.firebasestorage.app",
  messagingSenderId: "688049628754",
  appId: "1:688049628754:web:5275c41e8e24cb345ae18b"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };
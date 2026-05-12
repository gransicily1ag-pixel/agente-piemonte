import { initializeApp } from "firebase/app";

import {
  getFirestore,
  collection,
  addDoc
} from "firebase/firestore";

import fs from "fs";

// CONFIG FIREBASE
const firebaseConfig = {

  apiKey: "AIzaSyDiDO5dpk5hMsGkeVnXBdmSuwvd8ACiuHA",

  authDomain: "agente-piemonte.firebaseapp.com",

  projectId: "agente-piemonte",

  storageBucket: "agente-piemonte.appspot.com",

  messagingSenderId: "688049628754",

  appId: "1:688049628754:web:5275c41e8e24cb345ae18b"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

// UID AGENTE
const agenteId = "iDxDuqezYZVyYPuDL1dneR0N4u33";

// LEGGI JSON
const rawData = fs.readFileSync(
  "./src/data/clienti.json"
);

const percorsi = JSON.parse(rawData);

// IMPORT
async function importaClienti() {

  for (const percorso of percorsi) {

    for (const cliente of percorso.clienti) {

      await addDoc(

        collection(
          db,
          "agenti",
          agenteId,
          "clienti"
        ),

        {
          nome: cliente.nome,
          indirizzo: cliente.indirizzo,
          lat: cliente.lat || null,
          lng: cliente.lng || null,
          zona: percorso.nome,
          mapsUrl: percorso.mapsUrl || null
        }

      );

      console.log(
        "Importato:",
        cliente.nome
      );

    }

  }

  console.log("IMPORT COMPLETATO");

}

importaClienti();

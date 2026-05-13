import { useEffect, useMemo, useState } from "react";
import { db, auth } from "./firebase/firebase";
import DashboardAdmin from "./components/DashboardAdmin";
import carIcon from "./assets/car.png";
import L from "leaflet";
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDocs
} from "firebase/firestore";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap
} from "react-leaflet";

const iconaAgente = new L.Icon({
  iconUrl: carIcon,

  iconSize: [45, 45],
  iconAnchor: [22, 22],
});

function FollowMap({ posizione }) {

  const map = useMap();

  useEffect(() => {

    if (!posizione) return;

    map.setView(
      [posizione.lat, posizione.lng],
      map.getZoom(),
      {
        animate: true
      }
    );

  }, [posizione]);

  return null;

}

export default function App() {
  const [search, setSearch] = useState("");
  const [soloDaVisitare, setSoloDaVisitare] = useState(false);
  const [visitati, setVisitati] = useState({});
  const [noteClienti, setNoteClienti] = useState({});
  const [utente, setUtente] = useState(null);
  const [ruolo, setRuolo] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [posizioneLive, setPosizioneLive] = useState(null);
  const [agentiLive, setAgentiLive] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [clienteVicinoCheck, setClienteVicinoCheck] = useState(null);
  console.log("CLIENTI:", clienti);
  console.log("RUOLO:", ruolo);
  console.log("AGENTI LIVE:", agentiLive);
  const agenteId = utente?.uid;
  console.log("UTENTE:", utente);
  console.log("AGENTE ID:", agenteId);

  // =========================
// AUTH UTENTE LOGIN
// Controlla se un utente è loggato
// =========================
useEffect(() => {

  const unsubscribe =
    onAuthStateChanged(auth, (user) => {

      if (user) {
        setUtente(user);
      } else {
        setUtente(null);
      }

    });

  return () => unsubscribe();

}, []);


// =========================
// RUOLO UTENTE
// Legge ruolo admin/agente
// =========================
useEffect(() => {

  if (!agenteId) return;

  const unsubscribe = onSnapshot(

    doc(db, "agenti", agenteId),

    (docSnap) => {

      if (docSnap.exists()) {

        setRuolo(
          docSnap.data().ruolo
        );

      }

    }

  );

  return () => unsubscribe();

}, [agenteId]);


// =========================
// CLIENTI
// AGENTE -> solo suoi clienti
// ADMIN -> tutti i clienti
// =========================
useEffect(() => {

  if (!agenteId || !ruolo) return;

  // ===== ADMIN =====
  if (ruolo === "admin") {

    const unsubscribe = onSnapshot(

      collection(db, "agenti"),

      async (snapshot) => {

        let tuttiClienti = [];

        for (const agenteDoc of snapshot.docs) {

          const agenteUid = agenteDoc.id;

          const clientiSnap = await getDocs(

            collection(
              db,
              "agenti",
              agenteUid,
              "clienti"
            )

          );

          clientiSnap.forEach((clienteDoc) => {

            tuttiClienti.push({

              id: clienteDoc.id,

              agente:
                agenteDoc.data().nome,

              ...clienteDoc.data()

            });

          });

        }

        setClienti(tuttiClienti);

      }

    );

    return () => unsubscribe();

  }

  // ===== AGENTE =====
  const unsubscribe = onSnapshot(

    collection(
      db,
      "agenti",
      agenteId,
      "clienti"
    ),

    (snapshot) => {

      const listaClienti = [];

      snapshot.forEach((docItem) => {

        listaClienti.push({
          id: docItem.id,
          ...docItem.data()
        });

      });

      setClienti(listaClienti);

    }

  );

  return () => unsubscribe();

}, [agenteId, ruolo]);


// =========================
// CLIENTI VISITATI
// Stato visitato/non visitato
// =========================
useEffect(() => {

  if (!agenteId) return;

  const unsubscribe = onSnapshot(

    doc(
      db,
      "agenti",
      agenteId,
      "dati",
      "visitati"
    ),

    (docSnap) => {

      if (docSnap.exists()) {

        setVisitati(
          docSnap.data()
        );

      }

    }

  );

  return () => unsubscribe();

}, [agenteId]);


// =========================
// NOTE CLIENTI
// Note salvate realtime
// =========================
useEffect(() => {

  if (!agenteId) return;

  const unsubscribe = onSnapshot(

    doc(
      db,
      "agenti",
      agenteId,
      "dati",
      "noteClienti"
    ),

    (docSnap) => {

      if (docSnap.exists()) {

        setNoteClienti(
          docSnap.data()
        );

      }

    }

  );

  return () => unsubscribe();

}, [agenteId]);


// =========================
// GEOLOCALIZZAZIONE LIVE
// Salva posizione agente realtime
// =========================
useEffect(() => {

  if (!agenteId) return;

  if (!navigator.geolocation) return;

  const watchId =
    navigator.geolocation.watchPosition(

      async (position) => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        await setDoc(

          doc(
            db,
            "agenti",
            agenteId,
            "dati",
            "posizione"
          ),

          {
            lat,
            lng,
            updatedAt:
              serverTimestamp()
          }

        );

      },

      (error) => {

        console.log(error);

      },

      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }

    );

  return () =>
    navigator.geolocation.clearWatch(
      watchId
    );

}, [agenteId]);


// =========================
// POSIZIONE LIVE
// Legge posizione realtime agente
// =========================
useEffect(() => {

  if (!agenteId) return;

  const unsubscribe = onSnapshot(

    doc(
      db,
      "agenti",
      agenteId,
      "dati",
      "posizione"
    ),

    (docSnap) => {

      if (docSnap.exists()) {

        setPosizioneLive(
          docSnap.data()
        );

      }

    }

  );

  return () => unsubscribe();

}, [agenteId]);


// =========================
// DASHBOARD ADMIN
// Lista agenti realtime
// =========================
useEffect(() => {

  if (!ruolo) return;

  if (ruolo !== "admin") return;

  const unsubscribe = onSnapshot(

    collection(db, "agenti"),

    async (snapshot) => {

      const lista = [];

      for (const agenteDoc of snapshot.docs) {

        const agente =
          agenteDoc.data();

        const agenteUid =
          agenteDoc.id;

        // CLIENTI
        const clientiSnap =
          await getDocs(

            collection(
              db,
              "agenti",
              agenteUid,
              "clienti"
            )

          );

        // POSIZIONE
        let posizione = null;

        const posizioneSnap =
          await getDocs(

            collection(
              db,
              "agenti",
              agenteUid,
              "dati"
            )

          );

        posizioneSnap.forEach((docItem) => {

          if (docItem.id === "posizione") {

            posizione =
              docItem.data();

          }

        });

        lista.push({

          id: agenteUid,

          ...agente,

          clientiTotali:
            clientiSnap.size,

          posizione

        });

      }

      console.log("LISTA ADMIN:", lista);

      setAgentiLive(lista);

    }

  );

  return () => unsubscribe();

}, [ruolo]);

const toggleVisitato = async (clienteKey) => {

  const nuoviVisitati = {
    ...visitati,
    [clienteKey]: !visitati[clienteKey]
  };

  setVisitati(nuoviVisitati);

    await setDoc(

    doc(
      db,
      "agenti",
      agenteId,
      "dati",
      "visitati"
    ),

    nuoviVisitati

  );
};

const aggiornaNota = async (
  clienteKey,
  valore
) => {

  const nuoveNote = {
    ...noteClienti,
    [clienteKey]: valore
  };

  setNoteClienti(nuoveNote);

    await setDoc(
      doc(
      db,
      "agenti",
      agenteId,
      "dati",
      "noteClienti"
    ),

    nuoveNote

  );
};

const login = async () => {

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = auth.currentUser;

    await setDoc(

      doc(db, "agenti", user.uid),

      {
        nome: email.split("@")[0],
        email: user.email,
        ultimoAccesso: serverTimestamp()
      },

      { merge: true }

    );

  } catch (err) {

    alert(err.code);
    console.log(err);

  }

};

const logout = async () => {
  await signOut(auth);
};

const generaPercorsoGoogle = (clientiZona) => {

  if (!posizioneLive) return "#";

  const clientiValidi = clientiZona.filter(
    (c) => c.lat && c.lng
  );

  if (clientiValidi.length === 0) {
    return "#";
  }

  const origin =
    `${posizioneLive.lat},${posizioneLive.lng}`;

  const destination =
    `${clientiValidi[
      clientiValidi.length - 1
    ].lat},${clientiValidi[
      clientiValidi.length - 1
    ].lng}`;

  const waypoints = clientiValidi
    .slice(0, -1)
    .map(
      (c) => `${c.lat},${c.lng}`
    )
    .join("|");

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;

};
const percorsiNormalizzati = Object.values(

  clienti.reduce((acc, cliente) => {

    const zona =
      cliente.zona || "Senza Zona";

    if (!acc[zona]) {

      acc[zona] = {
        nome: zona,
        mapsUrl: null,
        clienti: []
      };

    }

    const testo =
      `${cliente.nome} ${cliente.indirizzo}`.toLowerCase();

    const clienteKey =
      `${cliente.nome}-${cliente.indirizzo}`;

    if (
      soloDaVisitare &&
      visitati[clienteKey]
    ) {
      return acc;
    }

    if (
      testo.includes(search.toLowerCase())
    ) {

      acc[zona].clienti.push(cliente);

    }

    return acc;

  }, {})

)
.map((percorso) => ({

  ...percorso,

  clienti: percorso.clienti.sort((a, b) => {

    if (!posizioneLive) return 0;

    const distA = calcolaDistanza(
      posizioneLive.lat,
      posizioneLive.lng,
      a.lat,
      a.lng
    );

    const distB = calcolaDistanza(
      posizioneLive.lat,
      posizioneLive.lng,
      b.lat,
      b.lng
    );

    return distA - distB;

  })

}))

const clientiFiltrati =
  percorsiNormalizzati.flatMap(
    (p) => p.clienti
  );

  const clientiMappa = clientiFiltrati;
  
  function calcolaDistanza(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

let clientePiuVicino = null;

if (posizioneLive) {

  clientePiuVicino =
    clientiMappa
      .filter((cliente) => {

        const clienteKey =
          `${cliente.nome}-${cliente.indirizzo}`;

        return (
          !visitati[clienteKey] &&
          cliente.lat &&
          cliente.lng
        );

      })
      .sort((a, b) => {

        const distA = calcolaDistanza(
          posizioneLive.lat,
          posizioneLive.lng,
          a.lat,
          a.lng
        );

        const distB = calcolaDistanza(
          posizioneLive.lat,
          posizioneLive.lng,
          b.lat,
          b.lng
        );

        return distA - distB;

      })[0];

}

useEffect(() => {

  if (!posizioneLive) return;

  const clienteVicino =
    clientiMappa.find((cliente) => {

      if (!cliente.lat || !cliente.lng)
        return false;

      const distanza =
        calcolaDistanza(
          posizioneLive.lat,
          posizioneLive.lng,
          cliente.lat,
          cliente.lng
        );

      return distanza < 0.05;

    });

  setClienteVicinoCheck(
    clienteVicino || null
  );

}, [posizioneLive, clientiMappa]);
  
if (!utente) {

  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-black mb-2">
          CRM Clienti
        </h1>

        <p className="text-gray-500 mb-6">
          Login agente
        </p>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full bg-gray-100 rounded-2xl px-4 py-4 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full bg-gray-100 rounded-2xl px-4 py-4 outline-none"
          />

          <button
            onClick={login}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold"
          >
            Accedi
          </button>

        </div>

      </div>

    </div>

  );

}



   return (
  <div className="min-h-screen bg-gray-100">

      <div className="bg-black text-white px-4 py-3 rounded-2xl">

      <div className="text-xs opacity-70">
        Connesso come
      </div>

      <div className="font-bold">
        {utente?.email}
      </div>

      <div className="text-xs text-green-400">
        {ruolo}
      </div>

</div>
    <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto p-4">

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

          <div>
        

            <p className="text-gray-500 mt-1">
              Gestione percorsi clienti Gran Sicily
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">

            <input
              type="text"
              placeholder="Cerca cliente o indirizzo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-100 border-0 rounded-2xl px-4 py-3 outline-none w-full md:w-[260px]"
            />

          

            <button
             onClick={async () => {
                await setDoc(
                doc(
                  db,
                  "agenti",
                  agenteId,
                  "dati",
                  "visitati"
                ),
                {}
              );
                setVisitati({});
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold transition"
            >
              Reset Giro
            </button>
            <button
              onClick={logout}
              className="bg-black text-white px-5 py-3 rounded-2xl font-semibold"
            >
              Logout
            </button>

            <label className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border cursor-pointer">

              <input
                type="checkbox"
                checked={soloDaVisitare}
                onChange={() =>
                  setSoloDaVisitare(!soloDaVisitare)
                }
              />

              <span className="text-sm font-medium">
                Solo da visitare
              </span>

            </label>
          </div>

        </div>

      </div>
    </div>
        {/* HEADER */}

      {ruolo === "admin" && (

        <DashboardAdmin
          agentiLive={agentiLive}
        />

      )}

    <div className="max-w-7xl mx-auto px-4 pt-6">

      {clienteVicinoCheck && (

        <div className="mb-6 bg-orange-500 text-white rounded-3xl p-6 shadow-2xl animate-pulse">

          <div className="text-sm uppercase tracking-widest opacity-80">
            Cliente raggiunto
          </div>

          <div className="text-3xl font-black mt-2">
            {clienteVicinoCheck.nome}
          </div>

          <div className="mt-2 text-white/90">
            {clienteVicinoCheck.indirizzo}
          </div>

          <button
            onClick={() => {

              const clienteKey =
                `${clienteVicinoCheck.nome}-${clienteVicinoCheck.indirizzo}`;

              toggleVisitato(clienteKey);

              setClienteVicinoCheck(null);

            }}
            className="mt-5 bg-white text-orange-600 px-6 py-3 rounded-2xl font-bold hover:scale-105 transition"
          >
            ✅ Segna Visitato
          </button>

        </div>

      )}

      {clientePiuVicino && (

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl p-6 mb-6 shadow-xl">

          <div className="text-sm uppercase tracking-widest opacity-80">
            Cliente più vicino
          </div>

          <div className="text-3xl font-black mt-2">
            {clientePiuVicino.nome}
          </div>

          <div className="mt-2 text-white/90">
            {clientePiuVicino.indirizzo}
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clientePiuVicino.indirizzo)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 bg-white text-green-600 px-5 py-3 rounded-2xl font-bold hover:scale-105 transition"
          >
            🚗 Naviga Cliente
          </a>

        </div>

      )}
  <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">

    <div className="p-5 border-b">

      <h2 className="text-2xl font-bold">
        Posizione Live
      </h2>

      <p className="text-gray-500 text-sm mt-1">
        Tracking realtime
      </p>

    </div>

    <div className="h-[400px] w-full">

      {posizioneLive && (

        <MapContainer
          center={[
            posizioneLive.lat,
            posizioneLive.lng
          ]}
          zoom={12}
          scrollWheelZoom={true}

          style={{
            height: "100%",
            width: "100%"
          }}
        >

          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FollowMap posizione={posizioneLive} />

          {/* AGENTE NORMALE */}
{ruolo !== "admin" && posizioneLive && (

  <Marker
    key={agente.id}
    position={[
      agente.posizione.lat,
      agente.posizione.lng
    ]}
    icon={iconaAgente}
  >

    <Popup>
      🚗 Sei qui
    </Popup>

  </Marker>

)}

{/* ADMIN */}
{ruolo === "admin" && (

  <>
  
    {agentiLive.map((agente) => {
      const ultimoAccesso =
        agente.ultimoAccesso?.toDate?.();

      const online =
        ultimoAccesso &&
        Date.now() - ultimoAccesso.getTime()
          < 1000 * 60 * 2;

      if (!online) return null;
      
      if (
        !agente.posizione?.lat ||
        !agente.posizione?.lng
      ) {
        return null;
      }

      return (

        <Marker
          key={agente.id}
          position={[
            agente.posizione.lat,
            agente.posizione.lng
                    ]}
                  >

                    <Popup>

                      <div>

                        <div className="font-bold text-base">
                          🚗 {agente.nome}
                        </div>

                        <div className="text-sm text-gray-500">
                          {agente.email}
                        </div>

                      </div>

                    </Popup>

                  </Marker>

                );

              })}

            </>

          )}
          {clientiMappa.map((cliente, index) => {

            if (!cliente.lat || !cliente.lng)
              return null;

            const clienteKey =
              `${cliente.nome}-${cliente.indirizzo}`;

            const isVisitato =
              visitati[clienteKey];

            return (

              <CircleMarker
                key={index}
                center={[
                  cliente.lat,
                  cliente.lng
                ]}
                radius={8}
                pathOptions={{
                  color: isVisitato
                    ? "#22c55e"
                    : "#111827",
                  fillColor: isVisitato
                    ? "#22c55e"
                    : "#ffffff",
                  fillOpacity: 1,
                  weight: 3
                }}
              >

                <Popup>

                  <div>

                    <div className="font-bold text-base">
                      {cliente.nome}
                    </div>

                    <div className="text-sm text-gray-600">
                      {cliente.indirizzo}
                    </div>

                    {ruolo === "admin" && cliente.agente && (

                      <div className="mt-2 text-xs font-bold text-blue-600">
                        👤 Agente: {cliente.agente}
                      </div>

                    )}

                  </div>

                </Popup>

              </CircleMarker>

            );

          })}
        </MapContainer>

      )}

    </div>

  </div>

</div>
<div className="max-w-7xl mx-auto p-4 md:p-6">

  <div className="grid xl:grid-cols-2 gap-6">

    {percorsiNormalizzati.map((percorso, index) => (

      <div
        key={index}
        className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"
      >

        {/* HEADER */}
        <div className="p-6 border-b bg-gradient-to-r from-black to-gray-800 text-white">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h2 className="text-2xl font-bold">
                {percorso.nome}
              </h2>

              <p className="text-gray-300 text-sm mt-1">
                Percorso giornaliero
              </p>
              <div className="mt-4">

                <div className="flex justify-between text-sm mb-2 text-gray-300">

                  <span>Progresso</span>

                  <span>
                    {
                      percorso.clienti.filter((cliente) =>
                        visitati[
                          `${cliente.nome}-${cliente.indirizzo}`
                        ]
                      ).length
                    }
                    /
                    {percorso.clienti.length}
                  </span>

                </div>

                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-green-400 transition-all duration-500"
                    style={{
                      width: `${
                        (
                          percorso.clienti.filter((cliente) =>
                            visitati[
                              `${cliente.nome}-${cliente.indirizzo}`
                            ]
                          ).length
                          /
                          percorso.clienti.length
                        ) * 100
                      }%`
                    }}
                  />

                </div>

              </div>

            </div>

            <div className="bg-white/10 px-4 py-2 rounded-2xl">

              <div className="text-2xl font-black">
                {percorso.clienti.length}
              </div>

              <div className="text-xs text-gray-300">
                clienti
              </div>

            </div>

          </div>

        </div>

        {/* CLIENTI */}
        <div className="p-4 space-y-4 max-h-[700px] overflow-auto">

          {percorso.clienti.map((cliente, i) => {

            const clienteKey =
              `${cliente.nome}-${cliente.indirizzo}`;

            const isVisitato =
              visitati[clienteKey];

            return (

              <div
                key={`${cliente.nome}-${i}`}
                className={`rounded-3xl border p-5 transition-all ${
                  isVisitato
                    ? "bg-green-50 border-green-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.indirizzo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >

                  <div className="flex items-start gap-3">

                    <div className={`text-2xl ${
                      isVisitato
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}>
                      {isVisitato ? "✅" : "📍"}
                    </div>

                    <div className="flex-1">

                      <div className="font-bold text-gray-900 text-lg">
                        {cliente.nome}
                      </div>

                      <div className="text-gray-500 mt-1 text-sm">
                        {cliente.indirizzo}
                      </div>

                      {ruolo === "admin" && cliente.agente && (

                        <div className="mt-2 text-xs font-bold text-blue-600">
                          👤 {cliente.agente}
                        </div>

                      )}

                    </div>

                  </div>

                </a>

                {/* AZIONI */}
                <div className="flex gap-3 mt-5">

                  <button
                    onClick={() =>
                      toggleVisitato(clienteKey)
                    }
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                      isVisitato
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {isVisitato
                      ? "✅ Visitato"
                      : "⬜ Da visitare"}
                  </button>

                </div>

                {/* NOTE */}
                <textarea
                  placeholder="Aggiungi nota..."
                  value={
                    noteClienti[clienteKey] || ""
                  }
                  onChange={(e) =>
                    aggiornaNota(
                      clienteKey,
                      e.target.value
                    )
                  }
                  className="w-full mt-4 bg-white border border-gray-200 rounded-2xl p-4 text-sm outline-none resize-none"
                  rows={3}
                />

              </div>

            );

          })}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-gray-50">

          <a
            href={generaPercorsoGoogle(percorso.clienti)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-black hover:bg-gray-800 text-white py-4 rounded-2xl font-bold transition"
          >
            Apri Percorso Completo
          </a>

        </div>

      </div>

    ))}

  </div>

</div>

</div>
);
}    
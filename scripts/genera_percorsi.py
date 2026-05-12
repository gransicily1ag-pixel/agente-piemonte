import pandas as pd
import json
from geopy.geocoders import Nominatim
# === CLUSTERING PER MACRO ZONA ===
from sklearn.cluster import KMeans

from math import radians, cos, sin, asin, sqrt
import time

# === CONFIG ===
EXCEL_FILE = "clienti patrono.xlsx"
OUTPUT_JSON = "src/data/clienti.json"

# === LETTURA EXCEL ===
df = pd.read_excel(EXCEL_FILE)

# === GEOLOCALIZZAZIONE ===
geolocator = Nominatim(user_agent="agente_piemonte")

latitudes = []
longitudes = []

print("Geocoding indirizzi...")

for index, row in df.iterrows():
    indirizzo = f"{row['INDIRIZZO']}, {row['CITTA']}, Piemonte, Italia"

    try:
        location = geolocator.geocode(indirizzo)

        if location:
            latitudes.append(location.latitude)
            longitudes.append(location.longitude)

            print(f"OK -> {indirizzo}")

        else:
            latitudes.append(None)
            longitudes.append(None)

            print(f"NON TROVATO -> {indirizzo}")

    except:
        latitudes.append(None)
        longitudes.append(None)

    time.sleep(1)

df["lat"] = latitudes
df["lng"] = longitudes

# === RIMOZIONE ERRORI ===
df = df.dropna(subset=["lat", "lng"])
# === DISTANZA TRA DUE PUNTI ===

def distanza(lat1, lon1, lat2, lon2):

    lon1, lat1, lon2, lat2 = map(
        radians,
        [lon1, lat1, lon2, lat2]
    )

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * asin(sqrt(a))

    r = 6371

    return c * r


# === ORDINE PERCORSO INTELLIGENTE ===

def ordina_percorso(df_cluster):

    if len(df_cluster) <= 2:
        return df_cluster

    non_visitati = df_cluster.copy()

    percorso = []

    corrente = non_visitati.iloc[0]

    percorso.append(corrente)

    non_visitati = non_visitati.drop(corrente.name)

    while len(non_visitati) > 0:

        min_dist = 999999
        prossimo_idx = None

        for idx, row in non_visitati.iterrows():

            dist = distanza(
                corrente["lat"],
                corrente["lng"],
                row["lat"],
                row["lng"]
            )

            if dist < min_dist:

                min_dist = dist
                prossimo_idx = idx

        corrente = non_visitati.loc[prossimo_idx]

        percorso.append(corrente)

        non_visitati = non_visitati.drop(prossimo_idx)

    return pd.DataFrame(percorso)

# === ZONE MANUALI ===

ZONE = {

    "Torino Sud": [
        "TORINO",
        "NICHELINO",
        "VINOVO",
        "GARINO",
        "MONCALIERI",
        "BEINASCO",
        "ORBASSANO",
        "PIOBESI TORINESE",
        "VILLASTELLONE"
    ],

    "Torino Nord": [
        "SETTIMO TORINESE",
        "CIRIE'",
        "VENARIA REALE",
        "DRUENTO",
        "ROBASSOMERO",
        "BORGARO",
        "MAPPANO"
    ],

    "Torino Ovest": [
        "RIVOLI",
        "COLLEGNO",
        "GRUGLIASCO",
        "RIVALTA",
        "PIANEZZA"
    ],

    "Torino Est": [
        "CHIERI",
        "PINO TORINESE",
        "SANTENA",
        "SAN MAURO TORINESE",
        "CASTIGLIONE TORINESE"
    ],

    "Cuneo Area": [
        "BRA",
        "CHERASCO",
        "RORETO DI CHERASCO",
        "SAVIGLIANO",
        "SALUZZO",
        "MARENE",
        "CERESOLE D ALBA"
    ],

    "Pinerolo Area": [
        "PINEROLO",
        "VIGONE",
        "CASALGRASSO"
    ],

    "Valsusa": [
        "BUSSOLENO",
        "CHIUSA DI SAN MICHELE"
    ],

    "Canavese": [
        "RIVAROLO CANAVESE",
        "CHIAVERANO",
        "VICO CANAVESE"
    ]
}


def assegna_macro_zona(row):

    citta = str(row["CITTA"]).upper()

    for zona, comuni in ZONE.items():

        if citta in comuni:
            return zona

    return "Extra"


df["macro_zona"] = df.apply(
    assegna_macro_zona,
    axis=1
)

# === CLUSTERING DINAMICO ===

MAX_CLIENTI_PER_PERCORSO = 10

percorsi = []

for zona in df["macro_zona"].unique():

    gruppo_zona = df[
        df["macro_zona"] == zona
    ].copy()

    num_cluster = max(
        1,
        len(gruppo_zona) // MAX_CLIENTI_PER_PERCORSO + 1
    )

    coords = gruppo_zona[["lat", "lng"]]

    kmeans = KMeans(
        n_clusters=num_cluster,
        random_state=42,
        n_init="auto"
    )

    gruppo_zona["cluster"] = kmeans.fit_predict(coords)

    for cluster_id in sorted(
        gruppo_zona["cluster"].unique()
    ):

        gruppo = gruppo_zona[
            gruppo_zona["cluster"] == cluster_id
        ]

        gruppo = ordina_percorso(gruppo)

        clienti = []

        stops = []

        for _, row in gruppo.iterrows():

            indirizzo = (
                f"{row['INDIRIZZO']}, "
                f"{row['CITTA']}"
            )

            clienti.append({
                "nome": row["CLIENTE"],
                "indirizzo": indirizzo,
                "lat": row["lat"],
                "lng": row["lng"]
            })

            stops.append(
                indirizzo.replace(" ", "+")
            )

        maps_url = (
            "https://www.google.com/maps/dir/"
            + "/".join(stops[:10])
        )

        percorsi.append({
            "nome": f"{zona} - {cluster_id + 1}",
            "mapsUrl": maps_url,
            "clienti": clienti
        })



# === EXPORT JSON ===
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(
        percorsi,
        f,
        ensure_ascii=False,
        indent=2
    )

print("")
print("===================================")
print("JSON GENERATO CORRETTAMENTE")
print(f"Percorsi creati: {len(percorsi)}")
print("===================================")
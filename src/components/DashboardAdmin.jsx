export default function DashboardAdmin({
  agentiLive
}) {

  console.log(
    "AGENTI LIVE DASHBOARD:",
    agentiLive
  );

  return (

    <div className="mb-8">

      <div className="flex items-center justify-between mb-5">

        <div>

          <h2 className="text-3xl font-black">
            Dashboard Admin
          </h2>

          <p className="text-gray-500 mt-1">
            Monitoraggio realtime agenti
          </p>

        </div>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

        {agentiLive.map((agente) => {

          // ONLINE / OFFLINE
          const online =
            agente.posizione?.updatedAt &&
            (
              Date.now() -
              agente.posizione.updatedAt
                .toDate()
                .getTime()
            ) < 120000;

          return (

            <div
              key={agente.id}
              className="bg-white rounded-3xl border shadow-sm p-5"
            >

              {/* HEADER */}
              <div className="flex items-center justify-between">

                <div>

                  <div className="text-2xl font-black">
                    {agente.nome || "Agente"}
                  </div>

                  <div className="text-gray-500 text-sm mt-1">
                    {agente.email}
                  </div>

                </div>

                <div
                  className={`w-4 h-4 rounded-full ${
                    online
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />

              </div>

              {/* INFO */}
              <div className="mt-5 space-y-3">

                {/* RUOLO */}
                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Ruolo
                  </span>

                  <span className="font-bold">
                    {agente.ruolo}
                  </span>

                </div>

                {/* STATO */}
                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Stato
                  </span>

                  <span
                    className={`font-bold ${
                      online
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {online
                      ? "Online"
                      : "Offline"}
                  </span>

                </div>

                {/* CLIENTI */}
                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Clienti
                  </span>

                  <span className="font-bold">
                    {agente.clientiTotali || 0}
                  </span>

                </div>

                {/* ULTIMO ACCESSO */}
                <div>

                  <div className="text-gray-500 text-sm">
                    Ultimo accesso
                  </div>

                  <div className="font-semibold mt-1">
                    {agente.ultimoAccesso
                      ?.toDate?.()
                      .toLocaleString() || "—"}
                  </div>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}
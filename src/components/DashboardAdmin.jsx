export default function DashboardAdmin({
  agentiLive
}) {

  console.log(
    "AGENTI LIVE DASHBOARD:",
    agentiLive
  );

  return (

    <div className="mb-6">

      <div className="mb-4">

        <h2 className="text-2xl font-black">
          Dashboard Admin
        </h2>

        <p className="text-gray-500 text-sm">
          Monitoraggio realtime agenti
        </p>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

        {agentiLive.map((agente) => {

          const ultimoAccesso =
            agente.ultimoAccesso?.toDate?.();

          const online =
            ultimoAccesso &&
            Date.now() - ultimoAccesso.getTime()
              < 1000 * 60 * 2;

          return (

            <details
              key={agente.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            >

              <summary className="list-none cursor-pointer p-4 flex items-center justify-between">

                <div>

                  <div className="font-black text-lg">
                    {agente.nome}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {agente.email}
                  </div>

                </div>

                <div
                  className={`w-3 h-3 rounded-full ${
                    online
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />

              </summary>

              <div className="px-4 pb-4 border-t bg-gray-50 text-sm">

                <div className="flex justify-between mt-3">

                  <span className="text-gray-500">
                    Ruolo
                  </span>

                  <span className="font-bold">
                    {agente.ruolo}
                  </span>

                </div>

                <div className="flex justify-between mt-2">

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
                    {online ? "Online" : "Offline"}
                  </span>

                </div>

                <div className="flex justify-between mt-2">

                  <span className="text-gray-500">
                    Clienti
                  </span>

                  <span className="font-bold">
                    {agente.clientiTotali || 0}
                  </span>

                </div>

                <div className="mt-3">

                  <div className="text-gray-500 text-xs">
                    Ultimo accesso
                  </div>

                  <div className="font-semibold">
                    {
                      agente.ultimoAccesso
                        ?.toDate?.()
                        ?.toLocaleString()
                    }
                  </div>

                </div>

              </div>

            </details>

          );

        })}

      </div>

    </div>

  );

}
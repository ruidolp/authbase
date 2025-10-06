"use client"

interface StatsCardsProps {
  totalVideos: number
  lastUpdate: Date
}

export function StatsCards({ totalVideos, lastUpdate }: StatsCardsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Videos */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total Videos</p>
          <p className="text-3xl font-semibold text-gray-900">{totalVideos}</p>
        </div>

        {/* Estado */}
        <div className="text-center border-x border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Estado</p>
          <p className="text-lg font-medium text-gray-900">Sincronizado</p>
        </div>

        {/* Última actualización */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Última actualización</p>
          <p className="text-lg font-medium text-gray-900">
            {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}

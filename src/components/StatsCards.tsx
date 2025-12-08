"use client"

interface StatsCardsProps {
  totalVideos: number
  lastUpdate: Date
}

export function StatsCards({ totalVideos, lastUpdate }: StatsCardsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
        {/* Total Videos */}
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500 mb-1">Total Videos</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900">{totalVideos}</p>
        </div>

        {/* Estado */}
        <div className="text-center sm:border-x border-gray-200">
          <p className="text-xs md:text-sm text-gray-500 mb-1">Estado</p>
          <p className="text-base md:text-lg font-medium text-gray-900">Sincronizado</p>
        </div>

        {/* Última actualización */}
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500 mb-1">Última actualización</p>
          <p className="text-base md:text-lg font-medium text-gray-900">
            {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}

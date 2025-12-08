"use client"

interface StatsCardsProps {
  totalVideos: number
}

export function StatsCards({ totalVideos }: StatsCardsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
      <div className="grid grid-cols-1 gap-4">
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500 mb-1">Total Videos</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900">{totalVideos}</p>
        </div>
      </div>
    </div>
  )
}

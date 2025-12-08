"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "@/components/StatsCards"
import { VideoForm } from "@/components/VideoForm"
import { VideoCard } from "@/components/VideoCard"

interface Video {
  id: number
  video_id: string
  nombre: string
  url: string
  created_at: string
}

export default function EditorPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  async function loadVideos() {
    try {
      setLoading(true)
      const response = await fetch("/api/videos")
      
      if (!response.ok) {
        throw new Error("Error al cargar videos")
      }
      
      const data = await response.json()
      setVideos(data.videos || data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const headerEl = document.getElementById("page-header")
    if (headerEl) {
      headerEl.innerHTML = '<h1 class="text-lg md:text-xl font-semibold">Editor</h1>'
    }

    loadVideos()

    return () => {
      if (headerEl) {
        headerEl.innerHTML = ""
      }
    }
  }, [])

  return (
    <div>
      <p className="text-sm md:text-base text-gray-600 mb-4">Gestiona tu colección de videos seguros</p>

      <StatsCards totalVideos={videos.length} />

      <VideoForm onVideoAdded={loadVideos} />

      <div className="surface-card overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/30 bg-white/15 backdrop-blur">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Colección de videos</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs md:text-sm text-gray-600">Videos:</span>
              <span className="text-sm md:text-base font-semibold text-gray-900">{videos.length}</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="video-grid">
              <div className="loading-skeleton"></div>
              <div className="loading-skeleton"></div>
              <div className="loading-skeleton"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <p className="text-lg font-medium">No hay videos</p>
              <p className="text-sm">Agrega tu primer video usando el formulario de arriba</p>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onVideoDeleted={loadVideos}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

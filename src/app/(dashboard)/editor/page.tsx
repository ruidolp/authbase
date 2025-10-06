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
  const [lastUpdate, setLastUpdate] = useState(new Date())

  async function loadVideos() {
    try {
      setLoading(true)
      const response = await fetch("/api/videos")
      
      if (!response.ok) {
        throw new Error("Error al cargar videos")
      }
      
      const data = await response.json()
      setVideos(data.videos || data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Editor</h1>
        <p className="text-gray-600">Gestiona tu colección de videos seguros</p>
      </div>

      <StatsCards totalVideos={videos.length} lastUpdate={lastUpdate} />

      <VideoForm onVideoAdded={loadVideos} />

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Colección de videos</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Videos:</span>
              <span className="font-semibold text-gray-900">{videos.length}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
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
"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Trash2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Video {
  id: number
  video_id: string
  nombre: string
  url: string
}

interface VideoCardProps {
  video: Video
  onVideoDeleted: () => void
}

export function VideoCard({ video, onVideoDeleted }: VideoCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${video.nombre}"?`)) {
      return
    }

    setDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar el video")
      }

      onVideoDeleted()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error desconocido")
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="video-card border border-gray-200 rounded-lg overflow-hidden w-full">
      <div className="video-thumbnail relative aspect-video bg-gray-100 w-full">
        <Image
          src={`https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}
          alt={video.nombre}
          fill
          priority={false}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-10 h-10 text-white" fill="white" />
        </div>
      </div>

      <div className="p-3 md:p-4">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 line-clamp-2">
          {video.nombre}
        </h3>
        <p className="text-xs text-gray-500 font-mono truncate mb-3 md:mb-4">
          {video.url}
        </p>

        {error && (
          <div className="mb-2 md:mb-3 text-xs md:text-sm text-red-600 bg-red-50 border border-red-200 px-2 md:px-3 py-1.5 md:py-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 hover:bg-gray-50 text-xs md:text-sm"
            onClick={() => window.open(video.url, "_blank")}
          >
            <ExternalLink className="w-3 md:w-4 h-3 md:h-4 mr-1" />
            Ver
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 hover:bg-gray-50 hover:text-red-600 text-xs md:text-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-3 md:w-4 h-3 md:h-4 mr-1" />
            {deleting ? "..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
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

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${video.nombre}"?`)) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar")
      }

      onVideoDeleted()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="video-card border border-gray-200">
      <div className="video-thumbnail">
        <img
          src={`https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}
          alt={video.nombre}
          onError={(e) => {
            e.currentTarget.src = `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`
          }}
        />
        <div className="play-overlay">
          <Play className="w-6 h-6 text-white" fill="white" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {video.nombre}
        </h3>
        <p className="text-xs text-gray-500 font-mono truncate mb-4">
          {video.url}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 hover:bg-gray-50"
            onClick={() => window.open(video.url, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 hover:bg-gray-50 hover:text-red-600"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {deleting ? "..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

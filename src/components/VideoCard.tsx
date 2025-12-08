"use client"

import { useState } from "react"
import Image from "next/image"
import { Trash2, Play } from "lucide-react"
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
    <div className="video-card rounded-xl overflow-hidden w-full backdrop-blur-sm">
      <div className="video-thumbnail relative w-full h-36 md:h-40 bg-gray-100">
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

        <Button
          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm md:text-base py-3 md:py-3.5"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? "..." : "Eliminar"}
        </Button>
      </div>
    </div>
  )
}

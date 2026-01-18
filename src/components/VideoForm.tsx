"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface VideoFormProps {
  onVideoAdded: () => void
}

function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : null
}

function extractGoogleDriveId(url: string): string | null {
  // Soporta URLs como:
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[\?&]id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

function detectVideoType(url: string): { type: 'youtube' | 'drive' | null, videoId: string | null } {
  // Intentar YouTube primero
  const youtubeId = extractYouTubeVideoId(url)
  if (youtubeId) {
    return { type: 'youtube', videoId: youtubeId }
  }

  // Intentar Google Drive
  const driveId = extractGoogleDriveId(url)
  if (driveId) {
    return { type: 'drive', videoId: driveId }
  }

  return { type: null, videoId: null }
}

export function VideoForm({ onVideoAdded }: VideoFormProps) {
  const [nombre, setNombre] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [detectedType, setDetectedType] = useState<'youtube' | 'drive' | null>(null)

  // Detectar tipo de video cuando cambia la URL
  function handleUrlChange(newUrl: string) {
    setUrl(newUrl)
    const { type } = detectVideoType(newUrl.trim())
    setDetectedType(type)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!nombre.trim()) {
      setError("Por favor ingresa un nombre para el video")
      return
    }

    if (!url.trim()) {
      setError("Por favor ingresa una URL")
      return
    }

    const { type, videoId } = detectVideoType(url.trim())

    if (!type || !videoId) {
      setError("URL no válida. Por favor ingresa una URL de YouTube o Google Drive")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          url: url.trim(),
          videoType: type,
          videoId: videoId
        }),
      })

      const data: { error?: string; id?: number } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar el video")
      }

      setNombre("")
      setUrl("")
      onVideoAdded()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error desconocido")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="surface-card p-4 md:p-6 mb-6 md:mb-8">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Agregar nuevo video</h2>

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            Nombre del video
          </label>
          <Input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Canción de los animales de la granja"
            className="w-full text-sm md:text-base"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            URL del video (YouTube o Google Drive)
          </label>
          <Input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... o https://drive.google.com/file/d/..."
            className="w-full font-mono text-xs md:text-sm"
            disabled={loading}
          />
        </div>

        {/* Advertencia para videos de Google Drive */}
        {detectedType === 'drive' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 md:px-4 py-2 md:py-3 rounded text-xs md:text-sm">
            <p className="font-medium mb-1">Video de Google Drive detectado</p>
            <p className="text-xs">
              <strong>Importante:</strong> El video debe estar compartido como &quot;Cualquier persona con el enlace&quot; para que se pueda ver.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-xs md:text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm md:text-base py-3 md:py-4"
        >
          {loading ? "Guardando..." : "Guardar Video"}
        </Button>
      </form>

      <p className="text-gray-500 text-xs mt-2 md:mt-3">
        Formatos soportados: YouTube (youtube.com, youtu.be) y Google Drive
      </p>
    </div>
  )
}

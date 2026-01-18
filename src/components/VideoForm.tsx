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

function isGitHubReleaseUrl(url: string): boolean {
  // Soporta URLs como:
  // https://github.com/usuario/repo/releases/download/v1.0/video.mp4
  return /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/releases\/download\//.test(url)
}

function detectVideoType(url: string): { type: 'youtube' | 'github' | null, videoId: string | null } {
  // Intentar YouTube primero
  const youtubeId = extractYouTubeVideoId(url)
  if (youtubeId) {
    return { type: 'youtube', videoId: youtubeId }
  }

  // Intentar GitHub Releases (la URL completa es el videoId)
  if (isGitHubReleaseUrl(url)) {
    return { type: 'github', videoId: url }
  }

  return { type: null, videoId: null }
}

export function VideoForm({ onVideoAdded }: VideoFormProps) {
  const [nombre, setNombre] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [detectedType, setDetectedType] = useState<'youtube' | 'github' | null>(null)

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
      setError("URL no válida. Por favor ingresa una URL de YouTube o GitHub Releases")
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
            URL del video (YouTube o GitHub Releases)
          </label>
          <Input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... o https://github.com/.../releases/..."
            className="w-full font-mono text-xs md:text-sm"
            disabled={loading}
          />
        </div>

        {/* Info para videos de GitHub */}
        {detectedType === 'github' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-3 md:px-4 py-2 md:py-3 rounded text-xs md:text-sm">
            <p className="font-medium">Video de GitHub detectado</p>
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
        Formatos soportados: YouTube (youtube.com, youtu.be) y GitHub Releases
      </p>
    </div>
  )
}

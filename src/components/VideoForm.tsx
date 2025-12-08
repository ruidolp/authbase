"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface VideoFormProps {
  onVideoAdded: () => void
}

export function VideoForm({ onVideoAdded }: VideoFormProps) {
  const [nombre, setNombre] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

    setLoading(true)

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), url: url.trim() }),
      })

      const data: { error?: string } = await response.json()

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
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
            URL de YouTube
          </label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full font-mono text-xs md:text-sm"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-xs md:text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm md:text-base"
        >
          {loading ? "Guardando..." : "Guardar Video"}
        </Button>
      </form>

      <p className="text-gray-500 text-xs mt-2 md:mt-3">
        Formatos soportados: youtube.com/watch?v=ID, youtu.be/ID
      </p>
    </div>
  )
}

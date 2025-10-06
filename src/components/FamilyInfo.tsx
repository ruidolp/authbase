"use client"

import { Copy, ExternalLink, Check, Edit2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

interface FamilyInfoProps {
  familyName: string
  familySlug: string
}

export function FamilyInfo({ familyName, familySlug }: FamilyInfoProps) {
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState(familyName)
  const [slug, setSlug] = useState(familySlug)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [url, setUrl] = useState("")

  useEffect(() => {
    setUrl(`${window.location.origin}/watch/${editing ? slug : familySlug}`)
  }, [editing, slug, familySlug])

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/watch/${familySlug}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar")
      }

      setSuccess("Información actualizada correctamente")
      setEditing(false)
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setName(familyName)
    setSlug(familySlug)
    setEditing(false)
    setError("")
    setSuccess("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-500 mb-1">Nombre Familia</label>
        {editing ? (
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        ) : (
          <p className="font-medium">{familyName}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm text-gray-500 mb-2">URL Pública</label>
        {editing ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">myftv.com/watch/</span>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                disabled={loading}
                pattern="[a-z0-9-]+"
                minLength={3}
                maxLength={50}
                className="font-mono flex-1"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Solo letras, números y guiones. Límite: 2 cambios por día.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs font-mono truncate">
              {url || 'Cargando...'}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyUrl}
              title="Copiar URL"
              disabled={!url}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(`/watch/${familySlug}`, '_blank')}
              title="Visitar"
              disabled={!url}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      {editing ? (
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gray-900 hover:bg-gray-800"
          >
            <Check className="w-4 h-4 mr-2" />
            {loading ? "Guardando..." : "Guardar"}
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setEditing(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      )}
    </form>
  )
}

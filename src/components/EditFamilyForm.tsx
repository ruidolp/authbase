"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, X, Check } from "lucide-react"

interface EditFamilyFormProps {
  familyName: string
  familySlug: string
}

export function EditFamilyForm({ familyName, familySlug }: EditFamilyFormProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(familyName)
  const [slug, setSlug] = useState(familySlug)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

      setSuccess("Familia actualizada correctamente")
      setEditing(false)
      
      if (data.changesRemaining !== undefined) {
        setTimeout(() => {
          setSuccess(`Cambios restantes hoy: ${data.changesRemaining}`)
        }, 2000)
      }

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
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

  if (!editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">Nombre</p>
          <p className="font-medium">{familyName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">URL Personalizada</p>
          <p className="font-mono text-sm">{familySlug}</p>
        </div>
        <Button
          onClick={() => setEditing(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de familia
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL Personalizada
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">myftv.com/watch/</span>
          <Input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            disabled={loading}
            pattern="[a-z0-9-]+"
            minLength={3}
            maxLength={50}
            className="font-mono"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Solo letras, números y guiones. Límite: 2 cambios por día.
        </p>
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
    </form>
  )
}

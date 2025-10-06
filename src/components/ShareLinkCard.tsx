"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareLinkCardProps {
  slug: string
}

export function ShareLinkCard({ slug }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState("")

  useEffect(() => {
    // Solo construir URL en el cliente
    setUrl(`${window.location.origin}/watch/${slug}`)
  }, [slug])

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying:', err)
    }
  }

  if (!url) return null // Mientras carga

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Link para compartir</h2>
      <p className="text-sm text-gray-600 mb-4">
        Comparte este enlace para que tus hijos puedan ver los videos sin necesidad de iniciar sesión
      </p>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm"
        />
        <Button
          onClick={copyToClipboard}
          className="bg-gray-900 hover:bg-gray-800"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

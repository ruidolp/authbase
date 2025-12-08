"use client"

import { useState } from "react"
import { signIn, signOut } from "next-auth/react"
import type { Session } from "next-auth"

interface InviteClientProps {
  invitation: {
    id: string
    familyName: string
    inviterName: string
    invitedEmail: string
    token: string
  }
  session: Session | null
}

type AcceptInvitationResponse =
  | { ok: true }
  | { error: string }

export function InviteClient({ invitation, session }: InviteClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAccept() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invitation.token }),
      })

      const data: AcceptInvitationResponse = await response.json()

      if (!response.ok) {
        const message = "error" in data && data.error ? data.error : "Error al aceptar invitación"
        setError(message)
        setLoading(false)
        return
      }

      // Cerrar sesión para regenerar la sesión con los nuevos claims/permisos
      await signOut({ redirect: false })

      // Pequeña espera para asegurar invalidación
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Redirigir a login con callback a dashboard
      window.location.href = "/login?callbackUrl=/dashboard"
    } catch {
      setError("Error de conexión")
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="surface-card p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Invitación a Familia</h1>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              <strong>{invitation.inviterName}</strong> te ha invitado a unirte a:
            </p>
            <p className="text-xl font-semibold text-gray-900 mb-4">
              {invitation.familyName}
            </p>
            <p className="text-sm text-gray-500">
              Invitación para: {invitation.invitedEmail}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => signIn("google", { callbackUrl: `/invite/${invitation.token}` })}
              className="w-full px-4 py-3 border border-pink-200 rounded-lg hover:bg-white/60 flex items-center justify-center gap-3 bg-white/50 backdrop-blur"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>

            <button
              onClick={() => signIn("facebook", { callbackUrl: `/invite/${invitation.token}` })}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continuar con Facebook
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Necesitas iniciar sesión para aceptar la invitación
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="surface-card p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Invitación a Familia</h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            <strong>{invitation.inviterName}</strong> te ha invitado a unirte a:
          </p>
          <p className="text-xl font-semibold text-gray-900 mb-4">
            {invitation.familyName}
          </p>
          <p className="text-sm text-gray-500">
            Tu cuenta: {session.user?.email ?? "—"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            Al aceptar, deberás volver a iniciar sesión para completar el proceso.
          </p>
        </div>

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Aceptando..." : "Aceptar Invitación"}
        </button>
      </div>
    </div>
  )
}

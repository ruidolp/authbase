"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, UserPlus, Copy, Check } from "lucide-react"
import Image from "next/image"

interface Member {
  id: string
  name: string | null
  email: string | null
  role: string | null
  image: string | null
  createdAt: Date
}

interface Invitation {
  id: string
  invitedEmail: string
  token: string
  status: string
  createdAt: Date
}

interface Family {
  id: string
  name: string
  slug: string
  users: Member[]
}

interface FamilyClientProps {
  currentUser: {
    id: string
    role: string
  }
  family: Family
  members: Member[]
  invitations: Invitation[]
}

export function FamilyClient({ currentUser, members, invitations }: FamilyClientProps) {
  const router = useRouter()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteToken, setInviteToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const isOwner = currentUser.role === 'owner'
  const canInvite = isOwner && members.length < 2

  const pendingInvitations = invitations.filter(i => i.status === 'pending')
  const acceptedInvitations = invitations.filter(i => i.status === 'accepted')

  async function handleInvite() {
    if (!inviteEmail) {
      setError("Ingresa un email")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al crear invitación")
        setLoading(false)
        return
      }

      setInviteToken(data.token)
      setShowInviteModal(false)
      setShowSuccessModal(true)
      setInviteEmail("")
      router.refresh()
    } catch {
      console.error('Error removiendo miembro')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("¿Seguro que quieres remover este miembro?")) return

    try {
      const response = await fetch('/api/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/invite/${inviteToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendWhatsApp() {
    const link = `${window.location.origin}/invite/${inviteToken}`
    const message = encodeURIComponent(`¡Hola! Te invito a unirte a nuestra familia en MyFTV. Usa este link: ${link}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Familia</h1>
          <p className="text-sm md:text-base text-gray-600">Gestiona los miembros de tu familia</p>
        </div>

        {/* Miembros Actuales */}
        <div className="surface-card p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Miembros ({members.length}/2)</h2>
            {canInvite && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm md:text-base w-full sm:w-auto justify-center"
              >
                <UserPlus className="w-4 h-4" />
                Invitar miembro
              </button>
            )}
          </div>

          <div className="space-y-3 md:space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 border border-white/30 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name || ''}
                      width={40}
                      height={40}
                      className="rounded-full w-10 h-10 md:w-12 md:h-12"
                      unoptimized
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/60 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm md:text-base text-gray-600 font-semibold">
                        {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base font-medium truncate">
                      {member.name || 'Sin nombre'}
                      {member.id === currentUser.id && (
                        <span className="ml-2 text-xs md:text-sm text-gray-500">(Tú)</span>
                      )}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{member.email}</p>
                    <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                  </div>
                </div>

                {isOwner && member.id !== currentUser.id && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg w-full sm:w-auto justify-center flex sm:justify-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invitaciones Pendientes */}
        {pendingInvitations.length > 0 && (
          <div className="surface-card p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Invitaciones Pendientes</h2>
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 border border-yellow-200/60 bg-white/15 rounded-lg backdrop-blur">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base font-medium truncate">{inv.invitedEmail}</p>
                    <p className="text-xs md:text-sm text-gray-500">
                      Enviada {new Date(inv.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/invite/${inv.token}`
                      navigator.clipboard.writeText(link)
                    }}
                    className="px-3 py-1.5 text-xs md:text-sm border border-pink-200 rounded hover:bg-white/60 w-full sm:w-auto whitespace-nowrap bg-white/40"
                  >
                    Copiar link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invitaciones Aceptadas */}
        {acceptedInvitations.length > 0 && (
          <div className="surface-card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Invitaciones Aceptadas</h2>
            <div className="space-y-3">
              {acceptedInvitations.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 border border-green-200/70 bg-white/12 rounded-lg backdrop-blur">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base font-medium truncate">{inv.invitedEmail}</p>
                    <p className="text-xs md:text-sm text-gray-500">
                      Aceptada {new Date(inv.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <span className="text-green-600 text-xs md:text-sm font-medium whitespace-nowrap">✓ Aceptada</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Invitar */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="surface-card p-4 md:p-6 max-w-md w-full">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Invitar Miembro</h3>
            
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="w-full px-3 md:px-4 py-2 border border-pink-200 rounded-lg mb-4 text-sm md:text-base bg-white/70 backdrop-blur"
            />

            {error && (
              <p className="text-red-600 text-xs md:text-sm mb-4">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setError("")
                  setInviteEmail("")
                }}
                className="flex-1 px-3 md:px-4 py-2 border border-pink-200 rounded-lg hover:bg-white/70 text-sm md:text-base bg-white/50 backdrop-blur"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={loading}
                className="flex-1 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm md:text-base"
              >
                {loading ? "Creando..." : "Crear Invitación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="surface-card p-4 md:p-6 max-w-md w-full">
            <h3 className="text-lg md:text-xl font-semibold mb-4">✅ Invitación Creada</h3>

            <p className="text-sm md:text-base text-gray-600 mb-4">
              Comparte este link con la persona que quieres invitar:
            </p>

            <div className="bg-white/60 p-2 md:p-3 rounded-lg mb-4 break-all text-xs md:text-sm border border-pink-100">
              {`${window.location.origin}/invite/${inviteToken}`}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={copyInviteLink}
                className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-pink-200 rounded-lg hover:bg-white/70 text-sm md:text-base bg-white/50 backdrop-blur"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "¡Copiado!" : "Copiar Link"}
              </button>
              <button
                onClick={sendWhatsApp}
                className="flex-1 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base"
              >
                Enviar por WhatsApp
              </button>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false)
                setInviteToken("")
              }}
              className="w-full px-3 md:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm md:text-base"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

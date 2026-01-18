"use client"

import { useEffect, useRef, useState } from "react"
import { videoCache, downloadVideo, validateVideoAccess } from "@/lib/videoCache"

interface LocalVideoPlayerProps {
  videoId: string // ID del video en Drive
  familyId: string // ID de la familia
  onEnded?: () => void
  onPlay?: () => void
  onPause?: () => void
}

export function LocalVideoPlayer({
  videoId,
  familyId,
  onEnded,
  onPlay,
  onPause
}: LocalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null

    async function loadVideo() {
      try {
        setLoading(true)
        setError(null)
        setDownloadProgress(0)

        console.log('[LocalVideoPlayer] Loading video:', videoId)

        // Paso 1: Validar que el usuario tenga acceso al video
        console.log('[LocalVideoPlayer] Validating access...')
        const hasAccess = await validateVideoAccess(videoId, familyId)

        if (!hasAccess) {
          setError('No tienes permiso para ver este video')
          setLoading(false)
          return
        }

        console.log('[LocalVideoPlayer] Access granted')

        // Paso 2: Verificar si el video ya está en cache
        const cachedBlob = await videoCache.getVideo(videoId)

        if (cachedBlob) {
          // Video encontrado en cache - reproducir inmediatamente
          console.log('[LocalVideoPlayer] Video found in cache, playing immediately')
          objectUrl = URL.createObjectURL(cachedBlob)

          if (videoRef.current) {
            videoRef.current.src = objectUrl
            videoRef.current.load()
          }

          setLoading(false)
        } else {
          // Video no está en cache - descargar
          console.log('[LocalVideoPlayer] Video not in cache, downloading...')
          setIsDownloading(true)

          const blob = await downloadVideo(videoId, (progress) => {
            setDownloadProgress(progress)
          })

          // Guardar en cache para futuras reproducciones
          await videoCache.saveVideo(videoId, blob)

          // Reproducir el video descargado
          objectUrl = URL.createObjectURL(blob)

          if (videoRef.current) {
            videoRef.current.src = objectUrl
            videoRef.current.load()
          }

          setIsDownloading(false)
          setLoading(false)
        }
      } catch (error) {
        console.error('[LocalVideoPlayer] Error loading video:', error)
        setError('Error al cargar el video. Inténtalo de nuevo.')
        setLoading(false)
        setIsDownloading(false)
      }
    }

    loadVideo()

    // Cleanup: liberar el object URL cuando el componente se desmonte
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [videoId, familyId])

  const handleLoadStart = () => {
    console.log('[LocalVideoPlayer] Load started')
    setLoading(true)
  }

  const handleCanPlay = () => {
    console.log('[LocalVideoPlayer] Can play - video is ready')
    setLoading(false)
  }

  const handleLoadedMetadata = () => {
    console.log('[LocalVideoPlayer] Metadata loaded')
  }

  const handleLoadedData = () => {
    console.log('[LocalVideoPlayer] Data loaded')
  }

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget
    const error = video.error

    let errorMessage = 'Error desconocido al cargar el video'

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Carga del video abortada'
          break
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Error de red al cargar el video'
          break
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Error al decodificar el video'
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato de video no soportado'
          break
      }

      console.error('[LocalVideoPlayer] Error:', {
        code: error.code,
        message: error.message,
        errorMessage
      })
    }

    setError(errorMessage)
    setLoading(false)
  }

  const handleWaiting = () => {
    console.log('[LocalVideoPlayer] Waiting for data...')
  }

  const handlePlaying = () => {
    console.log('[LocalVideoPlayer] Playing')
    setLoading(false)
  }

  const handleStalled = () => {
    console.warn('[LocalVideoPlayer] Stalled - network slow or unavailable')
  }

  const handleSuspend = () => {
    console.log('[LocalVideoPlayer] Suspend - loading suspended')
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <p className="mb-2">{error}</p>
          <p className="text-sm text-gray-400">
            Asegúrate de que el video esté compartido correctamente en Google Drive
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {(loading || isDownloading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white z-10">
          <div className="text-center px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            {isDownloading ? (
              <>
                <p className="mb-2">Descargando video...</p>
                <div className="w-64 max-w-full mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-2 text-gray-300">{downloadProgress.toFixed(0)}%</p>
              </>
            ) : (
              <p>Cargando video...</p>
            )}
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
        preload="metadata"
        onEnded={onEnded}
        onPlay={onPlay}
        onPause={onPause}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onStalled={handleStalled}
        onSuspend={handleSuspend}
        style={{
          backgroundColor: '#000',
          objectFit: 'contain'
        }}
      >
        Tu navegador no soporta la reproducción de video.
      </video>
    </div>
  )
}

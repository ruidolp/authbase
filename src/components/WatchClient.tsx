"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Search, User, Maximize, Minimize } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

declare global {
  interface Window {
    YT?: {
      Player: {
        new (elementId: string, config: unknown): {
          destroy?: () => void
          loadVideoById?: (videoId: string) => void
        }
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }

  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>
    mozRequestFullScreen?: () => Promise<void>
    msRequestFullscreen?: () => Promise<void>
  }

  interface Document {
    webkitFullscreenElement?: Element
    mozFullScreenElement?: Element
    msFullscreenElement?: Element
    webkitExitFullscreen?: () => Promise<void>
    mozCancelFullScreen?: () => Promise<void>
    msExitFullscreen?: () => Promise<void>
  }
}

interface Video {
  id: number
  video_id: string
  nombre: string
  url: string
}

interface WatchClientProps {
  familyId: string
  familyName: string
  initialVideos: Video[]
}

export function WatchClient({ familyId, initialVideos }: WatchClientProps) {
  const { data: session } = useSession()
  const [videos] = useState<Video[]>(initialVideos)
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(10)

  const playerRef = useRef<{
    destroy?: () => void
    loadVideoById?: (videoId: string) => void
  } | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedSecondsRef = useRef(0)
  const isTrackingRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setDisplayedVideos(shuffleArray([...videos]))
  }, [videos])

  // Detectar iOS
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(ios)
  }, [])

  useEffect(() => {
    if (displayedVideos.length === 0) return

    function onPlayerStateChange(event: { data: number }) {
      if (displayedVideos.length === 0) return
      const video = displayedVideos[currentIndex]

      if (event.data === 1) {
        if (!isTrackingRef.current) {
          startWatchSession(video)
        } else {
          resumeTracking()
        }
      } else if (event.data === 2) {
        pauseTracking()
      } else if (event.data === 0) {
        endWatchSession(true)
        setTimeout(() => playNextVideo(), 1000)
      }
    }

    function initPlayer() {
      if (!window.YT || !window.YT.Player) {
        console.log('YT.Player no disponible aún')
        return
      }

      if (displayedVideos.length === 0) {
        console.log('No hay videos para reproducir')
        return
      }

      console.log('Inicializando player con video:', displayedVideos[0].video_id)
      
      try {
        playerRef.current = new window.YT.Player("player", {
          height: "100%",
          width: "100%",
          videoId: displayedVideos[0].video_id,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            fs: 0, // Deshabilitar botón de fullscreen de YouTube
            enablejsapi: 1,
            disablekb: 1, // Deshabilitar controles de teclado
            iv_load_policy: 3, // Ocultar anotaciones
            playsinline: 1, // Reproducir inline en iOS
          },
          events: {
            onReady: () => {
              console.log('Player listo')
            },
            onStateChange: onPlayerStateChange,
            onError: (event: { data: number }) => {
              console.error('Error en player:', event.data)
            }
          },
        })
      } catch (error) {
        console.error("Error initializing player:", error)
      }
    }

    if (window.YT && window.YT.Player) {
      console.log('YT ya está cargado, inicializando player')
      initPlayer()
    } else {
      console.log('Cargando script de YouTube API')
      
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      
      if (!existingScript) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API lista')
        initPlayer()
      }
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedVideos])

  function shuffleArray(array: Video[]) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  async function startWatchSession(video: Video) {
    try {
      const response = await fetch("/api/watch-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          videoId: video.id,
          videoName: video.nombre,
          familyId: familyId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        sessionIdRef.current = data.sessionId
        startTimeRef.current = Date.now()
        accumulatedSecondsRef.current = 0
        isTrackingRef.current = true
      }
    } catch (error) {
      console.error("Error starting session:", error)
    }
  }

  function pauseTracking() {
    if (isTrackingRef.current && startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      accumulatedSecondsRef.current += elapsed
      startTimeRef.current = null
    }
  }

  function resumeTracking() {
    if (isTrackingRef.current && !startTimeRef.current) {
      startTimeRef.current = Date.now()
    }
  }

  async function endWatchSession(completed: boolean) {
    if (!isTrackingRef.current || !sessionIdRef.current) return

    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      accumulatedSecondsRef.current += elapsed
    }

    try {
      await fetch("/api/watch-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          sessionId: sessionIdRef.current,
          seconds: accumulatedSecondsRef.current,
          completed,
        }),
      })

      sessionIdRef.current = null
      startTimeRef.current = null
      accumulatedSecondsRef.current = 0
      isTrackingRef.current = false
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  function playNextVideo() {
    if (displayedVideos.length === 0) return
    const nextIndex = (currentIndex + 1) % displayedVideos.length
    setCurrentIndex(nextIndex)
    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(displayedVideos[nextIndex].video_id)
    }
    scrollToTop()
  }

  function playVideo(index: number) {
    if (isTrackingRef.current) {
      endWatchSession(false)
    }
    
    setCurrentIndex(index)
    scrollToTop()
    
    if (playerRef.current?.loadVideoById) {
      console.log('Cargando video:', displayedVideos[index].video_id)
      playerRef.current.loadVideoById(displayedVideos[index].video_id)
    } else {
      console.error('Player no disponible para cargar video')
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const query = searchQuery.toLowerCase().trim()

    if (!query) {
      setDisplayedVideos(shuffleArray([...videos]))
    } else {
      const filtered = videos.filter((v) =>
        v.nombre.toLowerCase().includes(query)
      )
      setDisplayedVideos(filtered)
    }

    setCurrentIndex(0)
    setVisibleCount(10)
  }

  function loadMore() {
    setVisibleCount((prev) => prev + 10)
  }

  // Manejar fullscreen custom
  async function toggleFullscreen() {
    if (!videoContainerRef.current) return

    try {
      if (!isFullscreen) {
        if (isIOS) {
          // iOS: Usar pseudo-fullscreen con CSS
          const isLandscape = window.innerWidth > window.innerHeight
          videoContainerRef.current.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')
          videoContainerRef.current.classList.add('pseudo-fullscreen')
          setIsFullscreen(true)
          document.body.style.overflow = 'hidden'
        } else {
          // Android/Desktop: Fullscreen API nativa
          if (videoContainerRef.current.requestFullscreen) {
            await videoContainerRef.current.requestFullscreen()
          } else if (videoContainerRef.current.webkitRequestFullscreen) {
            await videoContainerRef.current.webkitRequestFullscreen()
          } else if (videoContainerRef.current.mozRequestFullScreen) {
            await videoContainerRef.current.mozRequestFullScreen()
          } else if (videoContainerRef.current.msRequestFullscreen) {
            await videoContainerRef.current.msRequestFullscreen()
          }
        }
      } else {
        if (isIOS) {
          // iOS: Salir de pseudo-fullscreen
          videoContainerRef.current.classList.remove('pseudo-fullscreen')
          videoContainerRef.current.removeAttribute('data-orientation')
          setIsFullscreen(false)
          document.body.style.overflow = ''
        } else {
          // Android/Desktop: Salir de fullscreen nativo
          if (document.exitFullscreen) {
            await document.exitFullscreen()
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen()
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen()
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen()
          }
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  // Detectar cambios de fullscreen (solo para Android/Desktop, no iOS)
  useEffect(() => {
    if (isIOS) return // iOS usa pseudo-fullscreen, no necesita estos listeners

    function handleFullscreenChange() {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)

      // Mostrar controles al entrar/salir de fullscreen
      if (isCurrentlyFullscreen) {
        setShowControls(true)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [isIOS])

  // Detectar cambios de orientación en iOS durante pseudo-fullscreen
  useEffect(() => {
    if (!isIOS) return

    const handleOrientationChange = () => {
      if (isFullscreen && videoContainerRef.current) {
        // Actualizar orientación cuando el usuario rota el dispositivo
        const isLandscape = window.innerWidth > window.innerHeight
        videoContainerRef.current.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')
      }
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [isIOS, isFullscreen])

  // Auto-hide de controles en fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      return
    }

    // Función para mostrar controles y resetear timer
    const showControlsTemporarily = () => {
      setShowControls(true)

      // Limpiar timeout anterior
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      // Ocultar después de 3 segundos
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    // Mostrar controles al entrar en fullscreen
    showControlsTemporarily()

    // Event listeners para mostrar controles
    const handleInteraction = () => {
      showControlsTemporarily()
    }

    const container = videoContainerRef.current
    if (container) {
      container.addEventListener('mousemove', handleInteraction)
      container.addEventListener('touchstart', handleInteraction)
      container.addEventListener('click', handleInteraction)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (container) {
        container.removeEventListener('mousemove', handleInteraction)
        container.removeEventListener('touchstart', handleInteraction)
        container.removeEventListener('click', handleInteraction)
      }
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTrackingRef.current && sessionIdRef.current) {
        let finalSeconds = accumulatedSecondsRef.current
        if (startTimeRef.current) {
          finalSeconds += Math.floor((Date.now() - startTimeRef.current) / 1000)
        }

        try {
          const data = JSON.stringify({
            action: "end",
            sessionId: sessionIdRef.current,
            seconds: finalSeconds,
            completed: false,
          })

          const blob = new Blob([data], { type: "application/json" })
          navigator.sendBeacon("/api/watch-session", blob)
        } catch (error) {
          console.error("Error en sendBeacon:", error)
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const currentVideo = displayedVideos[currentIndex]

  if (displayedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">No hay videos disponibles</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-full">
          <h1 className="text-xl font-bold text-gray-900">MyFTV</h1>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar videos..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:border-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </form>

          <div>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full">
                  <User className="w-6 h-6 text-gray-700" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/editor">Editar Playlist</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="p-2 opacity-50 cursor-default">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-full">
        <div ref={videoContainerRef} className="w-full">
          <div className="bg-black overflow-hidden mb-4">
            <div className="relative w-full" style={{ paddingBottom: "45%" }}>
              <div
                id="player"
                className="absolute top-0 left-0 w-full h-full"
              ></div>
              {/* Overlay para bloquear el título en la parte superior */}
              <div
                className="youtube-blocker-overlay youtube-blocker-top"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
              {/* Overlay para bloquear la barra inferior de YouTube */}
              <div
                className="youtube-blocker-overlay youtube-blocker-bottom"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
              {/* Overlay adicional para la esquina inferior derecha donde suele estar el logo */}
              <div
                className="youtube-blocker-overlay youtube-blocker-corner"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
              {/* Botón de fullscreen custom */}
              <button
                onClick={toggleFullscreen}
                className={`fullscreen-button ${showControls ? 'visible' : 'hidden'}`}
                aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? (
                  <Minimize className="w-6 h-6" />
                ) : (
                  <Maximize className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {currentVideo && (
            <div className="px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {currentVideo.nombre}
              </h1>
            </div>
          )}
        </div>

        <div className="flex px-6 pb-6">
          <div className="flex-1"></div>

          <div className="w-96 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Más Videos</h2>
              <p className="text-sm text-gray-600">{displayedVideos.length} videos</p>
            </div>

            <div
              className="p-4 space-y-3 overflow-y-auto"
              style={{ maxHeight: "600px" }}
            >
              {displayedVideos.slice(0, visibleCount).map((video, index) => (
                <div
                  key={video.id}
                  onClick={() => playVideo(index)}
                  className={`flex space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === currentIndex
                      ? "bg-white border-l-4 border-gray-900"
                      : "hover:bg-white"
                  }`}
                >
                  <div className="relative w-40 h-24 flex-shrink-0">
                    <Image
                      src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                      alt={video.nombre}
                      fill
                      className="object-cover rounded"
                      sizes="160px"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-medium line-clamp-2 ${
                        index === currentIndex
                          ? "text-gray-900 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {video.nombre}
                    </h3>
                  </div>
                </div>
              ))}

              {visibleCount < displayedVideos.length && (
                <button
                  onClick={loadMore}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cargar más videos...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
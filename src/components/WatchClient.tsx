"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Search, Settings, Maximize, Minimize, Home, Film, Users, LogOut, Play } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { LocalVideoPlayer } from "@/components/LocalVideoPlayer"

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
  videoType: string // "youtube" o "drive"
}

interface WatchClientProps {
  familyId: string
  familyName: string
  initialVideos: Video[]
  userRole?: string | null
  familySlug?: string | null
}

const DEFAULT_THEME_COLOR = "#fff7ed"

export function WatchClient({ familyId, initialVideos, userRole, familySlug }: WatchClientProps) {
  const { data: session } = useSession()
  const [videos] = useState<Video[]>(initialVideos)
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(10)
  const [menuOpen, setMenuOpen] = useState(false)

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
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastVideoRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDisplayedVideos(shuffleArray([...videos]))
  }, [videos])

  // Detectar iOS
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(ios)

    console.log('Device detection:', { ios })
  }, [])

  // Inicializar YouTube Player solo para videos de YouTube
  useEffect(() => {
    if (displayedVideos.length === 0) return

    const currentVideo = displayedVideos[currentIndex]
    if (!currentVideo || currentVideo.videoType !== 'youtube') return

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

      console.log('Inicializando player con video:', displayedVideos[currentIndex].video_id)

      try {
        playerRef.current = new window.YT.Player("player", {
          height: "100%",
          width: "100%",
          videoId: displayedVideos[currentIndex].video_id,
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
  }, [displayedVideos, currentIndex])

  // Cargar nuevo video cuando cambia currentIndex (solo para YouTube)
  useEffect(() => {
    if (displayedVideos.length === 0) return

    const currentVideo = displayedVideos[currentIndex]
    if (!currentVideo || currentVideo.videoType !== 'youtube') return

    if (!playerRef.current?.loadVideoById) return

    console.log('Cargando nuevo video de YouTube:', currentVideo.video_id)
    playerRef.current.loadVideoById(currentVideo.video_id)
  }, [currentIndex, displayedVideos])

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
    scrollToTop()
  }

  function playVideo(index: number) {
    if (isTrackingRef.current) {
      endWatchSession(false)
    }

    setCurrentIndex(index)
    scrollToTop()

    const video = displayedVideos[index]
    if (video.videoType === 'youtube' && playerRef.current?.loadVideoById) {
      console.log('Cargando video:', video.video_id)
      playerRef.current.loadVideoById(video.video_id)
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

  // Función para mostrar controles temporalmente
  function handleShowControls() {
    if (!isFullscreen) return // Solo en fullscreen

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

  // Manejar fullscreen custom
  async function toggleFullscreen() {
    if (!videoContainerRef.current) return

    // Mostrar controles temporalmente al hacer toggle
    setShowControls(true)

    try {
      if (!isFullscreen) {
        // iOS: SIEMPRE usar pseudo-fullscreen (no tiene botones de navegación persistentes)
        // Android: SIEMPRE usar API nativa (única forma de ocultar botones del sistema)
        // Desktop: usar API nativa
        if (isIOS) {
          console.log('iOS: Usando pseudo-fullscreen')
          const isLandscape = window.innerWidth > window.innerHeight
          videoContainerRef.current.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')
          videoContainerRef.current.classList.add('pseudo-fullscreen')

          setIsFullscreen(true)
          document.body.style.overflow = 'hidden'
        } else {
          // Android y Desktop: usar API nativa para ocultar botones/barra del sistema
          console.log('Android/Desktop: Usando fullscreen nativo')
          const fullscreenOptions = { navigationUI: "hide" as const }

          if (videoContainerRef.current.requestFullscreen) {
            await videoContainerRef.current.requestFullscreen(fullscreenOptions)
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
          console.log('iOS: Saliendo de pseudo-fullscreen')
          videoContainerRef.current.classList.remove('pseudo-fullscreen')
          videoContainerRef.current.removeAttribute('data-orientation')

          setIsFullscreen(false)
          document.body.style.overflow = ''
        } else {
          // Android/Desktop: Salir de fullscreen nativo
          console.log('Android/Desktop: Saliendo de fullscreen nativo')
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

  // Detectar cambios de fullscreen (para Android y Desktop que usan API nativa)
  useEffect(() => {
    // Solo para dispositivos que usan fullscreen nativo (no iOS)
    if (isIOS) return

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

  // Pintar la zona segura en negro cuando estamos en fullscreen (especial PWA)
  useEffect(() => {
    const html = document.documentElement
    if (isFullscreen) {
      html.classList.add('fullscreen-active')
      document.body.classList.add('fullscreen-active')
    } else {
      html.classList.remove('fullscreen-active')
      document.body.classList.remove('fullscreen-active')
    }

    return () => {
      html.classList.remove('fullscreen-active')
      document.body.classList.remove('fullscreen-active')
    }
  }, [isFullscreen])

  // Ajustar meta theme-color para PWA cuando estamos en fullscreen
  useEffect(() => {
    const themeColor = isFullscreen ? "#000000" : DEFAULT_THEME_COLOR

    // Actualizar o crear el meta tag principal
    let meta = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null

    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "theme-color"
      document.head.appendChild(meta)
    }

    meta.setAttribute("content", themeColor)

    // Forzar actualización del tema en Android y todo el documento
    if (isFullscreen) {
      // Forzar color negro en todo el documento
      document.documentElement.style.setProperty('background-color', '#000000', 'important')
      document.documentElement.style.setProperty('background', '#000000', 'important')
      document.body.style.setProperty('background-color', '#000000', 'important')
      document.body.style.setProperty('background', '#000000', 'important')

      // Agregar clase al html para forzar estilos adicionales
      document.documentElement.setAttribute('data-fullscreen', 'true')

      // Crear o actualizar meta tags adicionales para Android
      let androidStatusBar = document.querySelector('meta[name="mobile-web-app-status-bar-style"]') as HTMLMetaElement | null
      if (!androidStatusBar) {
        androidStatusBar = document.createElement("meta")
        androidStatusBar.name = "mobile-web-app-status-bar-style"
        document.head.appendChild(androidStatusBar)
      }
      androidStatusBar.setAttribute("content", "black-translucent")

      // Meta tag adicional para iOS
      const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null
      if (appleStatusBar) {
        appleStatusBar.setAttribute("content", "black-translucent")
      }
    } else {
      // Restaurar colores normales
      document.documentElement.style.removeProperty('background-color')
      document.documentElement.style.removeProperty('background')
      document.body.style.removeProperty('background-color')
      document.body.style.removeProperty('background')
      document.documentElement.removeAttribute('data-fullscreen')

      // Restaurar meta tags
      const androidStatusBar = document.querySelector('meta[name="mobile-web-app-status-bar-style"]') as HTMLMetaElement | null
      if (androidStatusBar) {
        androidStatusBar.setAttribute("content", "default")
      }

      const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null
      if (appleStatusBar) {
        appleStatusBar.setAttribute("content", "black-translucent")
      }
    }

    return () => {
      const currentMeta = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null
      if (currentMeta) {
        currentMeta.setAttribute("content", DEFAULT_THEME_COLOR)
      }
      document.documentElement.style.removeProperty('background-color')
      document.documentElement.style.removeProperty('background')
      document.body.style.removeProperty('background-color')
      document.body.style.removeProperty('background')
      document.documentElement.removeAttribute('data-fullscreen')
    }
  }, [isFullscreen])

  // Detectar cambios de orientación durante pseudo-fullscreen (solo iOS)
  useEffect(() => {
    // Solo para iOS que usa pseudo-fullscreen
    if (!isIOS) return

    const updateOrientation = () => {
      if (isFullscreen && videoContainerRef.current) {
        const isLandscape = window.innerWidth > window.innerHeight
        videoContainerRef.current.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')
        console.log('Orientación actualizada:', isLandscape ? 'landscape' : 'portrait')
      }
    }

    // Ejecutar inmediatamente si ya estamos en fullscreen
    if (isFullscreen) {
      updateOrientation()
    }

    window.addEventListener('orientationchange', updateOrientation)
    window.addEventListener('resize', updateOrientation)

    return () => {
      window.removeEventListener('orientationchange', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
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

    // Agregar listeners a todo el documento cuando está en fullscreen
    document.addEventListener('mousemove', handleInteraction, { passive: true })
    document.addEventListener('touchstart', handleInteraction, { passive: true })
    document.addEventListener('touchmove', handleInteraction, { passive: true })
    document.addEventListener('click', handleInteraction)

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      document.removeEventListener('mousemove', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('touchmove', handleInteraction)
      document.removeEventListener('click', handleInteraction)
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

  // Infinite scroll automático
  useEffect(() => {
    if (!lastVideoRef.current) return

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }

    const callback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && visibleCount < displayedVideos.length) {
        setVisibleCount(prev => prev + 10)
      }
    }

    observerRef.current = new IntersectionObserver(callback, options)

    if (lastVideoRef.current) {
      observerRef.current.observe(lastVideoRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [visibleCount, displayedVideos.length])

  const currentVideo = displayedVideos[currentIndex]

  if (displayedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">No hay videos disponibles</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center w-full gap-1 sm:gap-2 md:gap-4 max-w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/icon_camisol.png"
              alt="Camisol TV"
              width={240}
              height={120}
              className="h-28 sm:h-32 md:h-36 w-auto object-contain drop-shadow-[0_6px_18px_rgba(255,47,140,0.28)] -my-6 sm:-my-8"
              priority
            />
          </div>

          <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-2xl">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 min-w-0 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-l-lg focus:border-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 flex-shrink-0"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex-shrink-0">
              {session ? (
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                    </button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Menú</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-2 mt-6">
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      <Link
                        href="/editor"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Film className="w-5 h-5" />
                        <span className="font-medium">Editor</span>
                      </Link>
                      {familySlug && (
                        <Link
                          href={`/watch/${familySlug}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          <span className="font-medium">Ver videos</span>
                        </Link>
                      )}
                      {userRole === 'owner' && (
                        <Link
                          href="/family"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Users className="w-5 h-5" />
                          <span className="font-medium">Familia</span>
                        </Link>
                      )}
                      <div className="border-t border-gray-200 my-2" />
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          signOut({ callbackUrl: '/login' })
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Cerrar sesión</span>
                      </button>
                    </nav>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="p-1.5 sm:p-2 opacity-50 cursor-default">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="w-full">
        <div ref={videoContainerRef} className="w-full">
          <div className="bg-black overflow-hidden mb-1 w-full">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              {currentVideo?.videoType === 'drive' ? (
                // Reproductor de video nativo para Google Drive con caché
                <div className="absolute top-0 left-0 w-full h-full">
                  <LocalVideoPlayer
                    videoId={currentVideo.video_id}
                    familyId={familyId}
                    onEnded={() => {
                      endWatchSession(true)
                      setTimeout(() => playNextVideo(), 1000)
                    }}
                    onPlay={() => {
                      if (!isTrackingRef.current) {
                        startWatchSession(currentVideo)
                      } else {
                        resumeTracking()
                      }
                    }}
                    onPause={() => {
                      pauseTracking()
                    }}
                  />
                </div>
              ) : (
                // Reproductor de YouTube
                <>
                  <div
                    id="player"
                    className="absolute top-0 left-0 w-full h-full"
                  ></div>
                  {/* Overlay para bloquear el título en la parte superior */}
                  <div
                    className="youtube-blocker-overlay youtube-blocker-top"
                    onClick={(e) => { e.stopPropagation(); handleShowControls(); }}
                    onTouchStart={(e) => { e.stopPropagation(); handleShowControls(); }}
                  />
                  {/* Overlay para bloquear la barra inferior de YouTube */}
                  <div
                    className="youtube-blocker-overlay youtube-blocker-bottom"
                    onClick={(e) => { e.stopPropagation(); handleShowControls(); }}
                    onTouchStart={(e) => { e.stopPropagation(); handleShowControls(); }}
                  />
                  {/* Overlay adicional para la esquina inferior derecha donde suele estar el logo */}
                  <div
                    className="youtube-blocker-overlay youtube-blocker-corner"
                    onClick={(e) => { e.stopPropagation(); handleShowControls(); }}
                    onTouchStart={(e) => { e.stopPropagation(); handleShowControls(); }}
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
                </>
              )}
            </div>
          </div>

          {currentVideo && (
            <div className="px-2 sm:px-4 py-0">
              <h1 className="text-sm sm:text-base md:text-lg font-medium text-gray-900">
                {currentVideo.nombre}
              </h1>
            </div>
          )}
        </div>

        <div className="w-full mt-2">
          <div className="w-full bg-gray-50 border-t border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-2 sm:px-4 py-2 border-b border-gray-200">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                Mis videos <span className="text-xs sm:text-sm text-gray-600 font-normal">({displayedVideos.length})</span>
              </h2>
            </div>

            <div
              className="px-2 sm:px-4 py-2 space-y-1.5 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 400px)", minHeight: "300px" }}
            >
              {displayedVideos.slice(0, visibleCount).map((video, index) => {
                const isLastVideo = index === visibleCount - 1 && visibleCount < displayedVideos.length
                return (
                  <div
                    key={video.id}
                    ref={isLastVideo ? lastVideoRef : null}
                    onClick={() => playVideo(index)}
                    className={`flex gap-2 p-1.5 sm:p-2 rounded-lg cursor-pointer transition-colors ${
                      index === currentIndex
                        ? "bg-white border-l-4 border-gray-900"
                        : "hover:bg-white"
                    }`}
                  >
                    <div className="relative w-24 sm:w-28 h-14 sm:h-16 flex-shrink-0">
                      {video.videoType === 'youtube' ? (
                        <Image
                          src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                          alt={video.nombre}
                          fill
                          className="object-cover rounded"
                          sizes="(max-width: 640px) 96px, 112px"
                          unoptimized
                        />
                      ) : (
                        <Image
                          src={`https://drive.google.com/thumbnail?id=${video.video_id}&sz=w200`}
                          alt={video.nombre}
                          fill
                          className="object-cover rounded"
                          sizes="(max-width: 640px) 96px, 112px"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-xs sm:text-sm font-medium line-clamp-2 ${
                          index === currentIndex
                            ? "text-gray-900 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {video.nombre}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

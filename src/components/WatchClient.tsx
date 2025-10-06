"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Search, User } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Declaración global correcta de YouTube API
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: {
        height: string
        width: string
        videoId: string
        playerVars?: Record<string, unknown>
        events?: {
          onStateChange?: (event: { data: number; target: unknown }) => void
        }
      }) => {
        destroy?: () => void
        loadVideoById?: (videoId: string) => void
      }
    }
    onYouTubeIframeAPIReady: () => void
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

  const playerRef = useRef<ReturnType<typeof window.YT.Player> | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedSecondsRef = useRef(0)
  const isTrackingRef = useRef(false)

  useEffect(() => {
    setDisplayedVideos(shuffleArray([...videos]))
  }, [videos])

  useEffect(() => {
    if (displayedVideos.length === 0) return

    function initPlayer() {
      if (displayedVideos.length === 0 || !window.YT) return

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
            fs: 1,
            enablejsapi: 1,
          },
          events: {
            onStateChange: onPlayerStateChange,
          },
        })
      } catch (error) {
        console.error("Error initializing player:", error)
      }
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      initPlayer()
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy()
      }
    }
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
    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(displayedVideos[index].video_id)
    }
    scrollToTop()
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
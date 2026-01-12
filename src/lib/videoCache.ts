// Servicio para cachear videos de Drive en IndexedDB

const DB_NAME = 'video-cache-db'
const DB_VERSION = 1
const STORE_NAME = 'videos'

interface CachedVideo {
  videoId: string
  blob: Blob
  timestamp: number
  size: number
}

class VideoCacheService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('[VideoCache] Error opening database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[VideoCache] Database opened successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Crear object store si no existe
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'videoId' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          console.log('[VideoCache] Object store created')
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  async hasVideo(videoId: string): Promise<boolean> {
    try {
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(videoId)

        request.onsuccess = () => {
          resolve(!!request.result)
        }

        request.onerror = () => {
          console.error('[VideoCache] Error checking video:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[VideoCache] Error in hasVideo:', error)
      return false
    }
  }

  async getVideo(videoId: string): Promise<Blob | null> {
    try {
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(videoId)

        request.onsuccess = () => {
          const result = request.result as CachedVideo | undefined
          if (result) {
            console.log(`[VideoCache] Video found in cache: ${videoId}, size: ${result.size} bytes`)
            resolve(result.blob)
          } else {
            console.log(`[VideoCache] Video not found in cache: ${videoId}`)
            resolve(null)
          }
        }

        request.onerror = () => {
          console.error('[VideoCache] Error getting video:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[VideoCache] Error in getVideo:', error)
      return null
    }
  }

  async saveVideo(videoId: string, blob: Blob): Promise<void> {
    try {
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        const cachedVideo: CachedVideo = {
          videoId,
          blob,
          timestamp: Date.now(),
          size: blob.size
        }

        const request = store.put(cachedVideo)

        request.onsuccess = () => {
          console.log(`[VideoCache] Video saved: ${videoId}, size: ${blob.size} bytes`)
          resolve()
        }

        request.onerror = () => {
          console.error('[VideoCache] Error saving video:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[VideoCache] Error in saveVideo:', error)
      throw error
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(videoId)

        request.onsuccess = () => {
          console.log(`[VideoCache] Video deleted: ${videoId}`)
          resolve()
        }

        request.onerror = () => {
          console.error('[VideoCache] Error deleting video:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[VideoCache] Error in deleteVideo:', error)
      throw error
    }
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          console.log('[VideoCache] All videos cleared')
          resolve()
        }

        request.onerror = () => {
          console.error('[VideoCache] Error clearing videos:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[VideoCache] Error in clearAll:', error)
      throw error
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          const videos = request.result as CachedVideo[]
          const totalSize = videos.reduce((sum, video) => sum + video.size, 0)
          console.log(`[VideoCache] Total cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
          resolve(totalSize)
        }

        request.onerror = () => {
          console.error('[VideoCache] Error getting cache size:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[VideoCache] Error in getCacheSize:', error)
      return 0
    }
  }

  async getAllVideoIds(): Promise<string[]> {
    try {
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAllKeys()

        request.onsuccess = () => {
          resolve(request.result as string[])
        }

        request.onerror = () => {
          console.error('[VideoCache] Error getting video IDs:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[VideoCache] Error in getAllVideoIds:', error)
      return []
    }
  }
}

// Singleton instance
export const videoCache = new VideoCacheService()

// Función helper para descargar un video desde el proxy con progreso
export async function downloadVideo(
  videoId: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  console.log(`[VideoCache] Starting download for video: ${videoId}`)

  const response = await fetch(`/api/drive-proxy?id=${videoId}`)

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`)
  }

  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : 0

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    chunks.push(value)
    received += value.length

    if (total > 0 && onProgress) {
      const progress = (received / total) * 100
      onProgress(progress)
      console.log(`[VideoCache] Download progress: ${progress.toFixed(1)}%`)
    }
  }

  console.log(`[VideoCache] Download complete: ${videoId}, ${received} bytes`)

  // Combinar todos los chunks en un solo Blob
  const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' })
  return blob
}

// Función para validar permisos antes de reproducir
export async function validateVideoAccess(videoId: string, familyId: string): Promise<boolean> {
  try {
    console.log(`[VideoCache] Validating access for video: ${videoId}`)

    const response = await fetch('/api/validate-video-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, familyId }),
    })

    const data = await response.json()

    if (data.hasAccess) {
      console.log(`[VideoCache] Access granted for video: ${videoId}`)
      return true
    } else {
      console.warn(`[VideoCache] Access denied for video: ${videoId}`)
      return false
    }
  } catch (error) {
    console.error('[VideoCache] Error validating access:', error)
    // En caso de error de red, denegar acceso por seguridad
    return false
  }
}

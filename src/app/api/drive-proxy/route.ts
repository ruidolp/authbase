import { NextRequest, NextResponse } from "next/server"

// Este endpoint hace proxy de los videos de Google Drive
// para permitir su reproducción en un elemento <video> con soporte de range requests

// Manejar preflight CORS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get('id')

    if (!fileId) {
      console.error('[drive-proxy] File ID is missing')
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Obtener el header Range si existe
    const rangeHeader = request.headers.get('range')
    console.log(`[drive-proxy] Request for file ${fileId}, range: ${rangeHeader || 'none'}`)

    // Usar la URL directa de Google Drive que funciona para archivos compartidos públicamente
    // Esta URL soporta range requests y no requiere autenticación si el archivo está compartido
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

    // Preparar headers para la petición a Google Drive
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    // Si hay un range request, pasarlo a Google Drive
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader
    }

    // Hacer la petición a Google Drive
    const response = await fetch(driveUrl, {
      headers: fetchHeaders,
      redirect: 'follow' // Seguir redirecciones automáticamente
    })

    if (!response.ok && response.status !== 206) {
      console.error(`[drive-proxy] Error fetching from Drive: ${response.status}`)
      return NextResponse.json(
        { error: "Failed to fetch video from Google Drive" },
        { status: response.status }
      )
    }

    // Verificar que no es una página HTML
    const contentType = response.headers.get('content-type')
    console.log(`[drive-proxy] Content-Type: ${contentType}`)

    if (contentType?.includes('text/html')) {
      console.error('[drive-proxy] Received HTML instead of video - file may not be shared correctly')
      return NextResponse.json(
        { error: "El video debe estar compartido como 'Cualquier persona con el enlace'" },
        { status: 403 }
      )
    }

    // Obtener el cuerpo como stream
    const videoStream = response.body
    if (!videoStream) {
      console.error('[drive-proxy] No video stream available')
      return NextResponse.json({ error: "No video stream available" }, { status: 500 })
    }

    // Preparar headers de respuesta
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    }

    // Copiar headers importantes de la respuesta de Drive
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
      console.log(`[drive-proxy] Content-Length: ${contentLength}`)
    }

    const contentRange = response.headers.get('content-range')
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
      console.log(`[drive-proxy] Content-Range: ${contentRange}`)
    }

    // Si es un range request, devolver 206 Partial Content
    const status = response.status === 206 ? 206 : 200
    console.log(`[drive-proxy] Returning ${status} with content-type: ${contentType}`)

    // Retornar el stream del video con los headers apropiados
    return new NextResponse(videoStream, {
      status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[drive-proxy] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

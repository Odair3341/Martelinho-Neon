import { createRoot } from 'react-dom/client'
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import App from './App.tsx'
import './index.css'

// No app nativo (Android/iOS) o conteúdo é servido de https://localhost,
// então fetch('/api/...') não alcançaria o backend da Vercel. Aqui essas
// chamadas são redirecionadas para VITE_API_BASE_URL usando CapacitorHttp,
// que não está sujeito a CORS.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

if (Capacitor.isNativePlatform() && API_BASE_URL) {
  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    if (url.startsWith('/api/')) {
      try {
        const method = (init?.method ?? 'GET').toUpperCase()

        const headers: Record<string, string> = {}
        const initHeaders = init?.headers
        if (initHeaders) {
          if (initHeaders instanceof Headers) {
            initHeaders.forEach((value, key) => {
              headers[key] = value
            })
          } else if (Array.isArray(initHeaders)) {
            initHeaders.forEach(([key, value]) => {
              headers[key] = value
            })
          } else {
            Object.assign(headers, initHeaders)
          }
        }

        const res = await CapacitorHttp.request({
          url: `${API_BASE_URL}${url}`,
          method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          headers,
          data: init?.body != null ? init.body : undefined,
          responseType: 'text',
          connectTimeout: 30000,
          readTimeout: 60000,
        })

        const responseHeaders = new Headers()
        Object.entries(res.headers ?? {}).forEach(([key, value]) => {
          responseHeaders.append(key, value)
        })

        // No Capacitor 7, res.data pode vir como objeto (já parseado) ou string.
        // O Response exige string — serializa objetos para JSON válido.
        const body =
          typeof res.data === 'string'
            ? res.data
            : JSON.stringify(res.data ?? '')

        return new Response(body, {
          status: res.status,
          headers: responseHeaders,
        })
      } catch (err) {
        console.error('[capacitor-http] Falha ao chamar API', url, err)
        throw err
      }
    }

    return nativeFetch(input, init)
  }
}

createRoot(document.getElementById("root")!).render(<App />)

export type UrlEmbedType = "youtube" | "audio" | "generic"

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a|flac|aac)(\?|#|$)/i
const URL_RE = /^https?:\/\/[^\s]+$/i

export function detectUrlType(url: string): UrlEmbedType {
  if (YOUTUBE_RE.test(url)) return "youtube"
  if (AUDIO_EXT_RE.test(url)) return "audio"
  return "generic"
}

export function isValidUrl(text: string): boolean {
  return URL_RE.test(text.trim())
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

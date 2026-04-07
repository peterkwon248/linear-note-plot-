/**
 * Global embed URL request — bridges non-React code (insertable-blocks, SlashCommand)
 * to the UrlInputDialog React component.
 *
 * Pattern: dispatch CustomEvent → React listener opens dialog → callback with result
 */

type EmbedUrlCallback = (url: string | null) => void

const EVENT_NAME = "plot:request-embed-url"

/** Call from non-React code. The React listener will open UrlInputDialog. */
export function requestEmbedUrl(callback: EmbedUrlCallback): void {
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, { detail: { callback } })
  )
}

/** Subscribe in a React component to handle the request. */
export function onEmbedUrlRequest(handler: (callback: EmbedUrlCallback) => void): () => void {
  const listener = (e: Event) => {
    const cb = (e as CustomEvent<{ callback: EmbedUrlCallback }>).detail.callback
    handler(cb)
  }
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}

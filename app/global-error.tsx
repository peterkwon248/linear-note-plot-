'use client'

import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ margin: 0, backgroundColor: '#0a0a0b', color: '#e8e8ed', fontFamily: 'sans-serif' }}>
        <div
          style={{
            display: 'flex',
            minHeight: '100dvh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              height: '2.5rem',
              width: '2.5rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              backgroundColor: 'rgba(229, 72, 77, 0.1)',
            }}
          >
            <AlertTriangle style={{ height: '1.25rem', width: '1.25rem', color: '#e5484d' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#e8e8ed' }}>
              Something went wrong
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b6b76' }}>
              A critical error occurred. Please try again.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error?.message && (
            <pre
              style={{
                maxWidth: '32rem',
                overflow: 'auto',
                borderRadius: '0.375rem',
                border: '1px solid #2a2a2e',
                backgroundColor: '#1c1c1f',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                color: '#6b6b76',
                margin: 0,
              }}
            >
              {error.message}
            </pre>
          )}

          <button
            onClick={reset}
            style={{
              borderRadius: '0.375rem',
              border: '1px solid #2a2a2e',
              backgroundColor: '#1c1c1f',
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#e8e8ed',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

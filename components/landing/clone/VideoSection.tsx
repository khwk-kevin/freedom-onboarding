'use client'

import { useRef, useState, useEffect } from 'react'

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
  </svg>
)
const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" fill="currentColor" />
  </svg>
)
const VolumeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M14 20.7251V18.6751C15.5 18.2418 16.7083 17.4084 17.625 16.1751C18.5417 14.9418 19 13.5418 19 11.9751C19 10.4084 18.5417 9.00843 17.625 7.7751C16.7083 6.54176 15.5 5.70843 14 5.2751V3.2251C16.0667 3.69176 17.75 4.73776 19.05 6.3631C20.35 7.98843 21 9.8591 21 11.9751C21 14.0911 20.35 15.9621 19.05 17.5881C17.75 19.2141 16.0667 20.2598 14 20.7251ZM3 15.0001V9.0001H7L12 4.0001V20.0001L7 15.0001H3ZM14 16.0001V7.9501C14.7833 8.31676 15.396 8.86676 15.838 9.6001C16.28 10.3334 16.5007 11.1334 16.5 12.0001C16.5 12.8501 16.279 13.6378 15.837 14.3631C15.395 15.0884 14.7827 15.6341 14 16.0001Z" fill="currentColor" />
  </svg>
)
const MuteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M19.8 22.6L16.775 19.5751C16.3584 19.8417 15.9167 20.0711 15.45 20.2631C14.9834 20.4551 14.5 20.609 14 20.725V18.675C14.2334 18.5917 14.4627 18.5084 14.688 18.425C14.9134 18.3417 15.1257 18.2417 15.325 18.125L12 14.8V20L7.00002 15H3.00002V9.00005H6.20002L1.40002 4.20005L2.80002 2.80005L21.2 21.2001L19.8 22.6ZM19.6 16.8L18.15 15.35C18.4334 14.8334 18.646 14.2917 18.788 13.725C18.93 13.1584 19.0007 12.575 19 11.975C19 10.4084 18.5417 9.00838 17.625 7.77505C16.7084 6.54172 15.5 5.70838 14 5.27505V3.22505C16.0667 3.69172 17.75 4.73772 19.05 6.36305C20.35 7.98838 21 9.85905 21 11.975C21 12.8584 20.879 13.7084 20.637 14.525C20.395 15.3417 20.0494 16.1 19.6 16.8ZM16.25 13.45L14 11.2V7.95005C14.7834 8.31672 15.396 8.86672 15.838 9.60005C16.28 10.3334 16.5007 11.1334 16.5 12C16.5 12.25 16.4794 12.496 16.438 12.738C16.3967 12.98 16.334 13.2174 16.25 13.45ZM12 9.20005L9.40002 6.60005L12 4.00005V9.20005Z" fill="currentColor" />
  </svg>
)
const FullscreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 21V13H5V17.6L17.6 5H13V3H21V11H19V6.4L6.4 19H11V21H3Z" fill="currentColor" />
  </svg>
)
const ExitFullscreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3.4 22L2 20.6L8.6 14H4V12H12V20H10V15.4L3.4 22ZM12 12V4H14V8.6L20.6 2L22 3.4L15.4 10H20V12H12Z" fill="currentColor" />
  </svg>
)

const btnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 10,
  background: 'rgba(0,0,0,0.35)',
  color: '#fff',
  cursor: 'pointer',
}

export default function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState<'muted' | 'unmuted'>('muted')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const update = () => {
      setPlaying(!video.paused)
      setMuted(video.muted ? 'muted' : 'unmuted')
    }
    update()
    video.addEventListener('play', update)
    video.addEventListener('pause', update)
    video.addEventListener('volumechange', update)
    return () => {
      video.removeEventListener('play', update)
      video.removeEventListener('pause', update)
      video.removeEventListener('volumechange', update)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleFullscreen = async () => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video) return
    if ((video as any).webkitDisplayingFullscreen) {
      ;(video as any).webkitExitFullscreen?.()
      return
    }
    if ((video as any).webkitEnterFullscreen) {
      try { ;(video as any).webkitEnterFullscreen(); return } catch {}
    }
    if (container) {
      if (document.fullscreenElement) { await document.exitFullscreen(); return }
      try {
        await container.requestFullscreen()
        if (isMobile && (screen.orientation as any)?.lock) {
          try { await (screen.orientation as any).lock('landscape') } catch {}
        }
      } catch {}
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100vw', aspectRatio: '1440 / 649' }}
    >
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        preload="metadata"
        poster="/images/video-poster.jpg"
        width="1920"
        height="1080"
        style={{ width: '100%', height: '100%', display: 'block', background: '#000', objectFit: 'cover' }}
      >
        <source src="https://public.freedom.world/landing_page/freedom-world-explainer-en.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Bottom fade gradient */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 190,
        background: 'linear-gradient(0deg, #020210 0%, rgba(2, 2, 16, 0) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Controls */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 57,
        width: 'min(1080px, calc(100% - 48px))',
        transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, pointerEvents: 'auto', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause() }}
            aria-label={playing ? 'Pause' : 'Play'}
            style={btnStyle}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted }}
            aria-label={muted === 'muted' ? 'Unmute' : 'Mute'}
            style={btnStyle}
          >
            {muted === 'muted' ? <MuteIcon /> : <VolumeIcon />}
          </button>
        </div>
        <button type="button" onClick={handleFullscreen} aria-label="Fullscreen" style={btnStyle}>
          {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      </div>
    </div>
  )
}

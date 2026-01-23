'use client'

import { useState, useEffect, useRef } from 'react'

const TRACKS = [
  '/assets/audio/0neo-px.mp3',
  '/assets/audio/DJDave-Airglow(Visualizer).mp3',
  '/assets/audio/NoMana,SUPERDARK-HoldMe.mp3',
  '/assets/audio/crystalsettings.mp3',
]

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  // Start with first track (fixed for SSR), randomize on client mount
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Randomize track on client mount only (avoids hydration mismatch)
  useEffect(() => {
    setIsClient(true)
    setCurrentTrackIndex(Math.floor(Math.random() * TRACKS.length))
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Try to auto-play on mount
    const audio = audioRef.current
    if (audio) {
      audio.volume = 0.3 // Set to 30% volume

      // Try to play immediately
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasStarted(true)
          })
          .catch(() => {
            // Auto-play was prevented, wait for user interaction
            // Add click listener to start music on first interaction
            const startMusic = () => {
              audio.play()
              setHasStarted(true)
              document.removeEventListener('click', startMusic)
            }

            document.addEventListener('click', startMusic)
          })
      }
    }
  }, [isClient])

  const handleTrackEnd = () => {
    // Move to next track
    const nextIndex = (currentTrackIndex + 1) % TRACKS.length
    setCurrentTrackIndex(nextIndex)
  }

  // Don't render audio until client-side to avoid hydration mismatch
  if (!isClient) {
    return null
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACKS[currentTrackIndex]}
        onEnded={handleTrackEnd}
        loop={false}
      />

      {/* Hidden UI - music plays in background */}
      {!hasStarted && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '2px solid #fff',
          color: '#fff',
          fontSize: '12px',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          🎵 click anywhere to start music
        </div>
      )}
    </>
  )
}

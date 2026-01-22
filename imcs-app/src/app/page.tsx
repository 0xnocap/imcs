'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@/hooks/useWallet'

export default function SplashScreen() {
  const router = useRouter()
  const { address, isConnected, connect } = useWallet()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showButtons, setShowButtons] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  const irisLeftRef = useRef<HTMLImageElement>(null)
  const irisRightRef = useRef<HTMLImageElement>(null)
  const eyesWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })

      // Eye tracking
      if (!eyesWrapperRef.current || !irisLeftRef.current || !irisRightRef.current) return

      const wrapperRect = eyesWrapperRef.current.getBoundingClientRect()
      const centerX = wrapperRect.left + wrapperRect.width / 2
      const centerY = wrapperRect.top + wrapperRect.height / 2

      const MAX_MOVEMENT = 8
      const SENSITIVITY = 30

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const distance = Math.min(
        MAX_MOVEMENT,
        Math.hypot(e.clientX - centerX, e.clientY - centerY) / SENSITIVITY
      )
      const moveX = Math.cos(angle) * distance
      const moveY = Math.sin(angle) * distance

      irisLeftRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      irisRightRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Handle navigation after wallet connects
  useEffect(() => {
    if (isConnected && pendingRoute) {
      router.push(pendingRoute)
      setPendingRoute(null)
    }
  }, [isConnected, pendingRoute, router])

  const handleEnter = () => {
    setShowButtons(true)
  }

  const handleProoveSavant = () => {
    if (isConnected) {
      router.push('/site/tasks')
    } else {
      setPendingRoute('/site/tasks')
      connect()
    }
  }

  const handleCheckWallet = () => {
    if (isConnected) {
      router.push('/site/profile')
    } else {
      setPendingRoute('/site/profile')
      connect()
    }
  }

  const handleJustLook = () => {
    router.push('/site')
  }

  return (
    <div id="splash">
      {/* Flashlight effect */}
      <div
        id="flashlight"
        style={{
          left: mousePos.x - 150 + 'px',
          top: mousePos.y - 150 + 'px',
        }}
      />

      {/* Eyes */}
      <div className="eyes-wrapper" ref={eyesWrapperRef}>
        {/* Base layer - establishes size */}
        <img
          className="eye-layer-base eye-white-left"
          src="/assets/eyes/eye-white-left.png"
          alt=""
        />

        {/* Layer 1: Other eye white */}
        <img
          className="eye-layer eye-white-right"
          src="/assets/eyes/eye-white-right.png"
          alt=""
        />

        {/* Layer 2: Eye irises (move with cursor) */}
        <img
          ref={irisLeftRef}
          className="eye-layer eye-iris-left"
          src="/assets/eyes/eye-iris-left.png"
          alt=""
        />
        <img
          ref={irisRightRef}
          className="eye-layer eye-iris-right"
          src="/assets/eyes/eye-iris-right.png"
          alt=""
        />

        {/* Layer 3: Skin layer */}
        <img
          className="eye-layer eye-skin"
          src="/assets/eyes/top-skin-inder-outliine.png"
          alt=""
        />

        {/* Layer 4: Face outline (top) */}
        <img
          className="eye-layer eye-outline"
          src="/assets/eyes/top-face-outline.png"
          alt=""
        />

        {/* Vignette overlay */}
        <div className="skin-vignette" />
      </div>

      {/* Initial enter button */}
      {!showButtons && (
        <button id="enter-btn" onClick={handleEnter}>
          walcum tu savant wurld
        </button>
      )}

      {/* Entry choice buttons */}
      {showButtons && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center',
          zIndex: 10,
          padding: '0 20px',
          width: '100%',
          maxWidth: '400px',
        }}>
          <button
            onClick={handleProoveSavant}
            style={{
              fontFamily: 'Comic Neue, cursive',
              fontSize: 'clamp(20px, 5vw, 28px)',
              padding: '15px 40px',
              background: '#00ff00',
              border: '4px solid #fff',
              cursor: 'pointer',
              transform: 'rotate(-2deg)',
              boxShadow: '0 0 20px rgba(0,255,0,0.8), 5px 5px 0 #fff',
              transition: 'all 0.1s',
              width: '100%',
              animation: 'pulse 2s infinite',
            }}
          >
            proove savant
          </button>

          <button
            onClick={handleCheckWallet}
            style={{
              fontFamily: 'Comic Neue, cursive',
              fontSize: 'clamp(18px, 4vw, 24px)',
              padding: '12px 30px',
              background: '#ff00ff',
              border: '4px solid #fff',
              cursor: 'pointer',
              transform: 'rotate(1deg)',
              boxShadow: '0 0 15px rgba(255,0,255,0.8), 4px 4px 0 #fff',
              transition: 'all 0.1s',
              color: '#fff',
              textShadow: '2px 2px 0 #000',
              width: '100%',
            }}
          >
            chek wallut
          </button>

          <button
            onClick={handleJustLook}
            style={{
              fontFamily: 'Comic Neue, cursive',
              fontSize: 'clamp(14px, 3vw, 18px)',
              padding: '8px 20px',
              background: 'transparent',
              border: '2px solid #fff',
              cursor: 'pointer',
              color: '#fff',
              opacity: 0.7,
              transition: 'all 0.1s',
            }}
          >
            just lookin around
          </button>
        </div>
      )}
    </div>
  )
}

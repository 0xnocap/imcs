'use client'

import { useEffect, useRef, useState } from 'react'

const SAVANTS = [
  '/assets/character/savant-dopey.png',
  '/assets/character/savant-mask.png',
  '/assets/character/savant-pepe.png',
  '/assets/character/savant-smoke.png',
]

const SIZES = [120, 150, 180, 200]
const EDGES = ['bottom', 'top', 'left', 'right'] as const

type Edge = typeof EDGES[number]

type ActiveSavant = {
  id: number
  character: string
  edge: Edge
  size: number
  position: number
  duration: number
}

export default function PopupSavants() {
  const [activeSavant, setActiveSavant] = useState<ActiveSavant | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idRef = useRef(0)

  const showSavant = () => {
    const character = SAVANTS[Math.floor(Math.random() * SAVANTS.length)]
    const edge = EDGES[Math.floor(Math.random() * EDGES.length)]
    const size = SIZES[Math.floor(Math.random() * SIZES.length)]
    const position = 10 + Math.random() * 80
    const duration = 1500 + Math.random() * 2000 // total animation time

    idRef.current += 1

    setActiveSavant({
      id: idRef.current,
      character,
      edge,
      size,
      position,
      duration,
    })

    // Clear after animation completes
    setTimeout(() => {
      setActiveSavant(null)
    }, duration)
  }

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 2500 + Math.random() * 2000
      timeoutRef.current = setTimeout(() => {
        showSavant()
        scheduleNext()
      }, delay)
    }

    // First popup
    timeoutRef.current = setTimeout(() => {
      showSavant()
      scheduleNext()
    }, 1000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!activeSavant) return null

  const { edge, size, position, duration, character, id } = activeSavant

  // Unique animation name for this instance
  const animName = `savant-${edge}-${id}`

  // Generate keyframes based on edge
  // The animation slides in, pauses, then slides back out
  // Using a wrapper div for position/rotation and inner animation for the slide

  let keyframes = ''
  let containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none',
  }
  let imgStyle: React.CSSProperties = {
    width: size,
    height: 'auto',
    display: 'block',
  }

  // Calculate timing: 15% enter, 70% stay, 15% exit
  const enterEnd = 15
  const exitStart = 85

  switch (edge) {
    case 'bottom':
      containerStyle = {
        ...containerStyle,
        bottom: 0,
        left: `${position}%`,
        transform: 'translateX(-50%)',
      }
      keyframes = `
        @keyframes ${animName} {
          0% { transform: translateY(100%); }
          ${enterEnd}% { transform: translateY(5%); }
          ${exitStart}% { transform: translateY(5%); }
          100% { transform: translateY(100%); }
        }
      `
      imgStyle = {
        ...imgStyle,
        animation: `${animName} ${duration}ms ease-in-out forwards`,
      }
      break

    case 'top':
      containerStyle = {
        ...containerStyle,
        top: 0,
        left: `${position}%`,
        transform: 'translateX(-50%) rotate(180deg)',
      }
      keyframes = `
        @keyframes ${animName} {
          0% { transform: translateY(100%); }
          ${enterEnd}% { transform: translateY(5%); }
          ${exitStart}% { transform: translateY(5%); }
          100% { transform: translateY(100%); }
        }
      `
      imgStyle = {
        ...imgStyle,
        animation: `${animName} ${duration}ms ease-in-out forwards`,
      }
      break

    case 'left':
      containerStyle = {
        ...containerStyle,
        left: 0,
        top: `${position}%`,
        transform: 'translateY(-50%) rotate(90deg)',
        transformOrigin: 'top left',
      }
      keyframes = `
        @keyframes ${animName} {
          0% { transform: translateX(-100%); }
          ${enterEnd}% { transform: translateX(-5%); }
          ${exitStart}% { transform: translateX(-5%); }
          100% { transform: translateX(-100%); }
        }
      `
      imgStyle = {
        ...imgStyle,
        animation: `${animName} ${duration}ms ease-in-out forwards`,
      }
      break

    case 'right':
      containerStyle = {
        ...containerStyle,
        right: 0,
        top: `${position}%`,
        transform: 'translateY(-50%) rotate(-90deg)',
        transformOrigin: 'top right',
      }
      keyframes = `
        @keyframes ${animName} {
          0% { transform: translateX(100%); }
          ${enterEnd}% { transform: translateX(5%); }
          ${exitStart}% { transform: translateX(5%); }
          100% { transform: translateX(100%); }
        }
      `
      imgStyle = {
        ...imgStyle,
        animation: `${animName} ${duration}ms ease-in-out forwards`,
      }
      break
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div style={containerStyle}>
        <img
          key={id}
          src={character}
          alt="savant"
          style={imgStyle}
        />
      </div>
    </>
  )
}

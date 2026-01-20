'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SAVANTS = [
  '/assets/character/savant-dopey.png',
  '/assets/character/savant-mask.png',
  '/assets/character/savant-pepe.png',
  '/assets/character/savant-smoke.png',
]

type Edge = 'top' | 'left' | 'right'

type PopupSavant = {
  id: number
  image: string
  edge: Edge
  position: number // percentage along the edge (0-100)
}

export default function PopupSavants() {
  const [savants, setSavants] = useState<PopupSavant[]>([])
  const [nextId, setNextId] = useState(0)

  useEffect(() => {
    const spawnSavant = () => {
      const edges: Edge[] = ['top', 'left', 'right']
      const edge = edges[Math.floor(Math.random() * edges.length)]
      const image = SAVANTS[Math.floor(Math.random() * SAVANTS.length)]
      const position = Math.random() * 100

      const newSavant: PopupSavant = {
        id: nextId,
        image,
        edge,
        position,
      }

      setSavants(prev => [...prev, newSavant])
      setNextId(prev => prev + 1)

      // Remove savant after animation completes
      setTimeout(() => {
        setSavants(prev => prev.filter(s => s.id !== newSavant.id))
      }, 3000)
    }

    // Spawn a savant every 5-15 seconds
    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 10000
      setTimeout(() => {
        spawnSavant()
        scheduleNext()
      }, delay)
    }

    scheduleNext()

    // Clean up on unmount
    return () => setSavants([])
  }, [nextId])

  const getStyle = (savant: PopupSavant) => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      width: '150px',
      height: 'auto',
      pointerEvents: 'none',
      zIndex: 9999,
    }

    switch (savant.edge) {
      case 'top':
        return {
          ...baseStyle,
          top: '-5px', // Hide bottom 5px
          left: `${savant.position}%`,
          transform: 'translateX(-50%) rotate(180deg)', // Rotate so bottom faces edge
        }
      case 'left':
        return {
          ...baseStyle,
          left: '-5px', // Hide bottom 5px
          top: `${savant.position}%`,
          transform: 'translateY(-50%) rotate(90deg)', // Rotate so bottom faces edge
        }
      case 'right':
        return {
          ...baseStyle,
          right: '-5px', // Hide bottom 5px
          top: `${savant.position}%`,
          transform: 'translateY(-50%) rotate(-90deg)', // Rotate so bottom faces edge
        }
      default:
        return baseStyle
    }
  }

  const getAnimationVariants = (edge: Edge) => {
    switch (edge) {
      case 'top':
        return {
          initial: { y: 0 },
          animate: { y: 100 },
          exit: { y: 0 },
        }
      case 'left':
        return {
          initial: { x: 0 },
          animate: { x: 100 },
          exit: { x: 0 },
        }
      case 'right':
        return {
          initial: { x: 0 },
          animate: { x: -100 },
          exit: { x: 0 },
        }
      default:
        return {
          initial: {},
          animate: {},
          exit: {},
        }
    }
  }

  return (
    <AnimatePresence>
      {savants.map(savant => {
        const variants = getAnimationVariants(savant.edge)
        return (
          <motion.img
            key={savant.id}
            src={savant.image}
            alt="savant"
            style={getStyle(savant)}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </AnimatePresence>
  )
}

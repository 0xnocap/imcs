'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'

type Bubble = {
  id: number
  x: number
  y: number
  size: number
  speed: number
  color: string
}

const COLORS = ['#ff6b9d', '#ffd700', '#00ff00', '#00bfff', '#ff00ff', '#ffff00']
const GAME_DURATION = 30

export default function BubblePopGame() {
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const bubbleIdRef = useRef(0)
  const lastSpawnRef = useRef(0)

  // Spawn new bubble
  const spawnBubble = useCallback(() => {
    if (!containerRef.current) return null

    const width = containerRef.current.clientWidth
    const size = 40 + Math.random() * 40
    const x = Math.random() * (width - size)

    return {
      id: bubbleIdRef.current++,
      x,
      y: window.innerHeight,
      size,
      speed: 2 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const gameLoop = (timestamp: number) => {
      // Spawn bubbles every ~500ms
      if (timestamp - lastSpawnRef.current > 500 - (score * 2)) {
        const newBubble = spawnBubble()
        if (newBubble) {
          setBubbles(prev => [...prev, newBubble])
        }
        lastSpawnRef.current = timestamp
      }

      // Move bubbles up
      setBubbles(prev =>
        prev
          .map(b => ({ ...b, y: b.y - b.speed }))
          .filter(b => b.y > -100)
      )

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, spawnBubble, score])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished')
          setShowSharePrompt(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setBubbles([])
    bubbleIdRef.current = 0
    lastSpawnRef.current = 0
  }

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id))
    setScore(prev => prev + 1)
  }

  const handleShare = () => {
    const shareText = `popped ${score} bubbles in 30 sec 🫧 imcs.world #IMCS`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  const saveScore = async () => {
    if (!address) return

    try {
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          task_type: 'bubble',
          score: score,
        }),
      })
    } catch (e) {
      console.error('Failed to save score:', e)
    }
  }

  useEffect(() => {
    if (gameState === 'finished' && address) {
      saveScore()
    }
  }, [gameState, address])

  // Ready screen
  if (gameState === 'ready') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #87CEEB 0%, #00bfff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <h1 style={{
          fontSize: 'clamp(36px, 10vw, 64px)',
          color: '#fff',
          textShadow: '4px 4px 0 #000',
          marginBottom: '20px',
        }}>
          🫧 bubble pop 🫧
        </h1>

        <p style={{
          fontSize: 'clamp(18px, 5vw, 24px)',
          color: '#000',
          marginBottom: '30px',
          textAlign: 'center',
          padding: '0 20px',
        }}>
          pop as many bubbles as u can in 30 seconds!
        </p>

        <button
          onClick={startGame}
          style={{
            fontFamily: 'Comic Neue, cursive',
            fontSize: 'clamp(24px, 6vw, 36px)',
            padding: '20px 50px',
            background: '#00ff00',
            border: '5px solid #000',
            cursor: 'pointer',
            boxShadow: '8px 8px 0 #000',
            transform: 'rotate(-2deg)',
            animation: 'pulse 2s infinite',
          }}
        >
          START!
        </button>

        <button
          onClick={() => router.push('/site/tasks')}
          style={{
            fontFamily: 'Comic Neue, cursive',
            fontSize: '18px',
            padding: '10px 20px',
            background: 'transparent',
            border: '2px solid #000',
            cursor: 'pointer',
            marginTop: '20px',
          }}
        >
          bak 2 tasks
        </button>
      </div>
    )
  }

  // Game screen
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #87CEEB 0%, #00bfff 100%)',
        overflow: 'hidden',
        cursor: 'crosshair',
        zIndex: 9999,
      }}
    >
      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '30px',
        zIndex: 100,
      }}>
        <div style={{
          background: '#fff',
          padding: '15px 30px',
          border: '4px solid #000',
          boxShadow: '4px 4px 0 #000',
        }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }}>⏱️ {timeLeft}</span>
        </div>
        <div style={{
          background: '#ffff00',
          padding: '15px 30px',
          border: '4px solid #000',
          boxShadow: '4px 4px 0 #000',
        }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }}>🫧 {score}</span>
        </div>
      </div>

      {/* Bubbles */}
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          onClick={() => popBubble(bubble.id)}
          style={{
            position: 'absolute',
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, white, ${bubble.color})`,
            border: '3px solid rgba(255,255,255,0.5)',
            cursor: 'pointer',
            boxShadow: `0 0 20px ${bubble.color}`,
            transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        />
      ))}

      {/* Finished overlay */}
      {gameState === 'finished' && showSharePrompt && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }}>
          <h2 style={{
            fontSize: 'clamp(36px, 10vw, 64px)',
            color: '#fff',
            textShadow: '4px 4px 0 #ff00ff',
            marginBottom: '10px',
          }}>
            time&apos;s up!
          </h2>

          <div style={{
            fontSize: 'clamp(48px, 15vw, 96px)',
            color: '#ffff00',
            textShadow: '4px 4px 0 #000',
            marginBottom: '20px',
          }}>
            {score}
          </div>

          <p style={{
            fontSize: '24px',
            color: '#fff',
            marginBottom: '30px',
          }}>
            bubbles popped = {score} points!
          </p>

          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '0 20px',
          }}>
            <button
              onClick={handleShare}
              style={{
                fontFamily: 'Comic Neue, cursive',
                fontSize: '24px',
                padding: '15px 30px',
                background: '#1DA1F2',
                border: '4px solid #fff',
                cursor: 'pointer',
                color: '#fff',
                boxShadow: '4px 4px 0 #fff',
              }}
            >
              share on X 🐦
            </button>

            <button
              onClick={startGame}
              style={{
                fontFamily: 'Comic Neue, cursive',
                fontSize: '24px',
                padding: '15px 30px',
                background: '#00ff00',
                border: '4px solid #000',
                cursor: 'pointer',
                boxShadow: '4px 4px 0 #000',
              }}
            >
              play again
            </button>

            <button
              onClick={() => router.push('/site/tasks')}
              style={{
                fontFamily: 'Comic Neue, cursive',
                fontSize: '24px',
                padding: '15px 30px',
                background: '#ff6b9d',
                border: '4px solid #000',
                cursor: 'pointer',
                boxShadow: '4px 4px 0 #000',
              }}
            >
              bak 2 tasks
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

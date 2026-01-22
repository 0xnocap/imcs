'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#ff6b9d', '#ff00ff',
  '#ffd700', '#ffff00', '#00ff00', '#00bfff', '#0000ff',
  '#8b4513', '#ff8c00', '#808080', '#c0c0c0',
]

const BRUSH_SIZES = [4, 8, 16]

export default function DrawSavantGame() {
  const router = useRouter()
  const { address } = useWallet()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#ff00ff')
  const [brushSize, setBrushSize] = useState(8)
  const [isEraser, setIsEraser] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [baseImageLoaded, setBaseImageLoaded] = useState(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Load base image
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = Math.min(window.innerWidth - 40, 600)
    const height = Math.min(window.innerHeight - 250, 500)
    canvas.width = width
    canvas.height = height

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Load and draw base image (savant outline)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Calculate centered position
      const scale = Math.min(
        (canvas.width * 0.7) / img.width,
        (canvas.height * 0.8) / img.height
      )
      const imgWidth = img.width * scale
      const imgHeight = img.height * scale
      const x = (canvas.width - imgWidth) / 2
      const y = (canvas.height - imgHeight) / 2 + 20

      // Draw with reduced opacity as outline
      ctx.globalAlpha = 0.2
      ctx.drawImage(img, x, y, imgWidth, imgHeight)
      ctx.globalAlpha = 1.0
      setBaseImageLoaded(true)
    }
    img.src = '/assets/character/savant-dopey.png'
  }, [])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const pos = getPos(e)
    lastPosRef.current = pos
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    const lastPos = lastPosRef.current

    if (lastPos) {
      ctx.beginPath()
      ctx.moveTo(lastPos.x, lastPos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = isEraser ? '#ffffff' : color
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      setHasDrawn(true)
    }

    lastPosRef.current = pos
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    lastPosRef.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Redraw base image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = Math.min(
        (canvas.width * 0.7) / img.width,
        (canvas.height * 0.8) / img.height
      )
      const imgWidth = img.width * scale
      const imgHeight = img.height * scale
      const x = (canvas.width - imgWidth) / 2
      const y = (canvas.height - imgHeight) / 2 + 20

      ctx.globalAlpha = 0.2
      ctx.drawImage(img, x, y, imgWidth, imgHeight)
      ctx.globalAlpha = 1.0
    }
    img.src = '/assets/character/savant-dopey.png'

    setHasDrawn(false)
  }

  const saveImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'my-savant-masterpiece.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleComplete = async () => {
    if (!hasDrawn) {
      alert('draw sumthing first dummie!')
      return
    }

    // Save score
    if (address) {
      try {
        await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            task_type: 'paint',
            score: 200,
          }),
        })
      } catch (e) {
        console.error('Failed to save score:', e)
      }
    }

    setShowSharePrompt(true)
  }

  const handleShare = () => {
    const shareText = `created my savant masterpiece 🎨 imcs.world #IMCS`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px',
      overflow: 'auto',
      zIndex: 9999,
    }}>
      {/* Title bar (MS Paint style) */}
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: 'linear-gradient(90deg, #000080, #1084d0)',
        padding: '5px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{ color: '#fff', fontWeight: 'bold' }}>
          🎨 savant.exe - Paint
        </span>
        <button
          onClick={() => router.push('/site/tasks')}
          style={{
            background: '#c0c0c0',
            border: '2px outset #fff',
            padding: '2px 8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          X
        </button>
      </div>

      {/* Toolbar */}
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: '#c0c0c0',
        border: '2px inset #808080',
        padding: '8px',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        {/* Color palette */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '3px',
          maxWidth: '150px',
        }}>
          {COLORS.map(c => (
            <div
              key={c}
              onClick={() => { setColor(c); setIsEraser(false) }}
              style={{
                width: '20px',
                height: '20px',
                background: c,
                border: color === c && !isEraser ? '2px solid #ff00ff' : '1px solid #000',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {/* Brush sizes */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {BRUSH_SIZES.map(size => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              style={{
                width: '30px',
                height: '30px',
                background: brushSize === size ? '#000080' : '#c0c0c0',
                color: brushSize === size ? '#fff' : '#000',
                border: '2px outset #fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{
                width: size,
                height: size,
                background: brushSize === size ? '#fff' : '#000',
                borderRadius: '50%',
              }} />
            </button>
          ))}
        </div>

        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          style={{
            padding: '5px 10px',
            background: isEraser ? '#ff6b9d' : '#c0c0c0',
            border: '2px outset #fff',
            cursor: 'pointer',
            fontFamily: 'Comic Neue, cursive',
          }}
        >
          🧽 eraser
        </button>

        {/* Clear */}
        <button
          onClick={clearCanvas}
          style={{
            padding: '5px 10px',
            background: '#c0c0c0',
            border: '2px outset #fff',
            cursor: 'pointer',
            fontFamily: 'Comic Neue, cursive',
          }}
        >
          🗑️ clear
        </button>
      </div>

      {/* Canvas */}
      <div style={{
        border: '3px inset #808080',
        background: '#fff',
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            cursor: isEraser ? 'cell' : 'crosshair',
            display: 'block',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Current color indicator */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span>current:</span>
        <div style={{
          width: '30px',
          height: '30px',
          background: isEraser ? '#ffffff' : color,
          border: '2px solid #000',
        }} />
        <span>{isEraser ? 'eraser' : color}</span>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '15px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button
          onClick={saveImage}
          style={{
            fontFamily: 'Comic Neue, cursive',
            fontSize: '18px',
            padding: '12px 24px',
            background: '#ffff00',
            border: '3px solid #000',
            cursor: 'pointer',
            boxShadow: '3px 3px 0 #000',
          }}
        >
          💾 save image
        </button>

        <button
          onClick={handleComplete}
          style={{
            fontFamily: 'Comic Neue, cursive',
            fontSize: '18px',
            padding: '12px 24px',
            background: '#00ff00',
            border: '3px solid #000',
            cursor: 'pointer',
            boxShadow: '3px 3px 0 #000',
          }}
        >
          ✅ complete (+200 pts)
        </button>
      </div>

      {/* Share prompt modal */}
      {showSharePrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff6b9d, #ffd700)',
            padding: '30px',
            border: '5px solid #000',
            boxShadow: '10px 10px 0 #000',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            <h2 style={{
              fontSize: '32px',
              marginBottom: '15px',
              color: '#fff',
              textShadow: '3px 3px 0 #000',
            }}>
              🎉 masterpiece complete!
            </h2>

            <p style={{
              fontSize: '24px',
              marginBottom: '20px',
            }}>
              +200 points earned!
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <button
                onClick={handleShare}
                style={{
                  fontFamily: 'Comic Neue, cursive',
                  fontSize: '20px',
                  padding: '15px 30px',
                  background: '#1DA1F2',
                  border: '3px solid #000',
                  cursor: 'pointer',
                  color: '#fff',
                  boxShadow: '4px 4px 0 #000',
                }}
              >
                share on X 🐦
              </button>

              <button
                onClick={saveImage}
                style={{
                  fontFamily: 'Comic Neue, cursive',
                  fontSize: '20px',
                  padding: '15px 30px',
                  background: '#ffff00',
                  border: '3px solid #000',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0 #000',
                }}
              >
                download image 💾
              </button>

              <button
                onClick={() => router.push('/site/tasks')}
                style={{
                  fontFamily: 'Comic Neue, cursive',
                  fontSize: '20px',
                  padding: '15px 30px',
                  background: '#00ff00',
                  border: '3px solid #000',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0 #000',
                }}
              >
                bak 2 tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

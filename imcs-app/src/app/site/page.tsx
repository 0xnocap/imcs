'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'

export default function HomePage() {
  const router = useRouter()
  const { address, isConnected, connect } = useWallet()
  const [showModal, setShowModal] = useState(false)
  const [checking, setChecking] = useState(false)
  const [pendingAction, setPendingAction] = useState<'check' | 'prove' | null>(null)

  const emojis = [
    { emoji: '⭐', top: '10%', left: '15%', delay: '0s' },
    { emoji: '✨', top: '25%', right: '20%', delay: '0.5s' },
    { emoji: '💫', top: '50%', left: '8%', delay: '1s' },
    { emoji: '🌟', top: '15%', right: '10%', delay: '1.5s' },
    { emoji: '⭐', bottom: '25%', left: '25%', delay: '2s' },
    { emoji: '✨', bottom: '35%', right: '15%', delay: '2.5s' },
    { emoji: '💫', top: '40%', right: '30%', delay: '3s' },
    { emoji: '🌟', bottom: '15%', left: '10%', delay: '3.5s' },
  ]

  // Show modal on first visit
  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem('seenWelcomeModal')
    if (!hasSeenModal) {
      setTimeout(() => setShowModal(true), 500)
    }
  }, [])

  // Handle wallet connection result
  useEffect(() => {
    if (isConnected && address && pendingAction) {
      checkProfileAndRedirect()
    }
  }, [isConnected, address, pendingAction])

  const checkProfileAndRedirect = async () => {
    if (!address) return
    setChecking(true)

    try {
      const response = await fetch(`/api/profile/${address}`)

      if (response.ok) {
        // User has profile - go to appropriate page
        if (pendingAction === 'check') {
          router.push('/site/profile')
        } else {
          router.push('/site/tasks')
        }
      } else {
        // No profile - must register first
        router.push('/site/submit')
      }
    } catch (e) {
      router.push('/site/submit')
    }

    setPendingAction(null)
    setChecking(false)
  }

  const handleCheckWallet = () => {
    sessionStorage.setItem('seenWelcomeModal', 'true')
    if (isConnected && address) {
      setPendingAction('check')
      checkProfileAndRedirect()
    } else {
      setPendingAction('check')
      connect()
    }
  }

  const handleProveSavant = () => {
    sessionStorage.setItem('seenWelcomeModal', 'true')
    if (isConnected && address) {
      setPendingAction('prove')
      checkProfileAndRedirect()
    } else {
      setPendingAction('prove')
      connect()
    }
  }

  const closeModal = () => {
    sessionStorage.setItem('seenWelcomeModal', 'true')
    setShowModal(false)
  }

  return (
    <div className="page active" id="home" style={{ position: 'relative', minHeight: '70vh' }}>
      {/* Center "imaginate" text - Impact/meme style */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        textAlign: 'center',
        padding: '0 10px',
        width: '100%'
      }}>
        <h1 style={{
          fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
          fontSize: 'clamp(40px, 12vw, 140px)',
          color: '#ffff00',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          WebkitTextStroke: '3px #000',
          textShadow: '4px 4px 0 #000',
          margin: 0,
          lineHeight: 1,
          fontWeight: 700
        }}>
          imaginate
        </h1>
      </div>

      {emojis.map((item, i) => (
        <div
          key={i}
          className="floating-emoji"
          style={{
            top: item.top,
            bottom: item.bottom,
            left: item.left,
            right: item.right,
            animationDelay: item.delay
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Welcome Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff6b9d, #ffd700)',
            border: '5px solid #000',
            padding: '30px',
            boxShadow: '10px 10px 0 #000',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            transform: 'rotate(-1deg)',
          }}>
            <h2 style={{
              fontSize: 'clamp(24px, 7vw, 36px)',
              color: '#fff',
              textShadow: '3px 3px 0 #000',
              marginBottom: '20px',
            }}>
              welcum savant! 🧙‍♂️
            </h2>

            <p style={{
              fontSize: '18px',
              marginBottom: '25px',
              color: '#000',
            }}>
              connect ur wallut 2 get started
            </p>

            {checking ? (
              <div style={{ fontSize: '24px', padding: '20px' }}>
                checking... ⏳
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <button
                  onClick={handleProveSavant}
                  style={{
                    fontFamily: 'Comic Neue, cursive',
                    fontSize: 'clamp(18px, 5vw, 24px)',
                    padding: '15px 30px',
                    background: '#00ff00',
                    border: '4px solid #000',
                    cursor: 'pointer',
                    boxShadow: '5px 5px 0 #000',
                    transition: 'all 0.1s',
                  }}
                >
                  proov im savant ✨
                </button>

                <button
                  onClick={handleCheckWallet}
                  style={{
                    fontFamily: 'Comic Neue, cursive',
                    fontSize: 'clamp(16px, 4vw, 20px)',
                    padding: '12px 24px',
                    background: '#ff00ff',
                    border: '4px solid #000',
                    cursor: 'pointer',
                    boxShadow: '5px 5px 0 #000',
                    color: '#fff',
                    textShadow: '2px 2px 0 #000',
                  }}
                >
                  chek my wallut 👀
                </button>

                <button
                  onClick={closeModal}
                  style={{
                    fontFamily: 'Comic Neue, cursive',
                    fontSize: '16px',
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '2px solid #000',
                    cursor: 'pointer',
                    marginTop: '5px',
                  }}
                >
                  just lookin around
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

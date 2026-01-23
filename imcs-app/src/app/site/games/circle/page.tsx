'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import CircleDrawing from '@/components/gates/CircleDrawing'
import SharePrompt from '@/components/SharePrompt'

const MAX_ATTEMPTS = 5

export default function CircleGamePage() {
  const router = useRouter()
  const { address } = useWallet()
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [maxReached, setMaxReached] = useState(false)
  const [pointsAdded, setPointsAdded] = useState(0)

  // Fetch current attempt count on mount
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!address) return
      try {
        const res = await fetch(`/api/tasks/${address}`)
        if (res.ok) {
          const data = await res.json()
          const circleTask = data.tasks?.find((t: any) => t.task_type === 'circle')
          if (circleTask) {
            const count = circleTask.completion_count || 1
            setAttemptsLeft(MAX_ATTEMPTS - count)
            if (count >= MAX_ATTEMPTS) {
              setMaxReached(true)
            }
          } else {
            setAttemptsLeft(MAX_ATTEMPTS)
          }
        }
      } catch (e) {
        console.error('Failed to fetch attempts:', e)
      }
    }
    fetchAttempts()
  }, [address])

  const handleSubmit = async (earnedScore: number, earnedAccuracy: number) => {
    setScore(earnedScore)
    setAccuracy(earnedAccuracy)

    // Save to task completions
    if (address) {
      try {
        const response = await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            task_type: 'circle',
            score: earnedScore,
          }),
        })
        const result = await response.json()

        if (result.max_reached) {
          setMaxReached(true)
          setPointsAdded(0)
        } else if (result.success) {
          setAttemptsLeft(result.attempts_left ?? null)
          setPointsAdded(result.added || earnedScore)
        }
      } catch (e) {
        console.error('Failed to save score:', e)
      }
    }

    setShowResult(true)
  }

  const handleGiveUp = () => {
    router.push('/site/games/typing')
  }

  const handlePlayAgain = () => {
    setShowResult(false)
    setScore(0)
    setAccuracy(0)
    setPointsAdded(0)
  }

  if (showResult) {
    const getScoreLabel = () => {
      if (maxReached) return 'max attempts reached (no more points)'
      if (pointsAdded > 0) {
        return attemptsLeft !== null && attemptsLeft > 0
          ? `+${pointsAdded} points! ${attemptsLeft} attempts left`
          : `+${pointsAdded} points! no more attempts left`
      }
      return 'try again 4 points'
    }

    return (
      <SharePrompt
        title={score > 0 ? '🎯 nice circle!' : '😅 not quite...'}
        score={`${accuracy}%`}
        scoreLabel={getScoreLabel()}
        shareText={`just drew a ${accuracy}% perfect circle 🎯 imcs.world #IMCS`}
        onPlayAgain={handlePlayAgain}
        showPlayAgain={!maxReached || attemptsLeft === null || attemptsLeft > 0}
      />
    )
  }

  return (
    <CircleDrawing
      onSubmit={handleSubmit}
      onGiveUp={handleGiveUp}
      attemptsInfo={attemptsLeft !== null ? `${attemptsLeft}/${MAX_ATTEMPTS} attempts left` : undefined}
    />
  )
}

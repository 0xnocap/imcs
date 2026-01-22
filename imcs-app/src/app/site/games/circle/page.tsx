'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import CircleDrawing from '@/components/gates/CircleDrawing'
import SharePrompt from '@/components/SharePrompt'

export default function CircleGamePage() {
  const router = useRouter()
  const { address } = useWallet()
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [accuracy, setAccuracy] = useState(0)

  const handleSubmit = async (earnedScore: number, earnedAccuracy: number) => {
    setScore(earnedScore)
    setAccuracy(earnedAccuracy)

    // Save to task completions
    if (address) {
      try {
        await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            task_type: 'circle',
            score: earnedScore,
          }),
        })
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
  }

  if (showResult) {
    return (
      <SharePrompt
        title={score > 0 ? '🎯 nice circle!' : '😅 not quite...'}
        score={`${accuracy}%`}
        scoreLabel={score > 0 ? `+${score} points earned!` : 'try again 4 points'}
        shareText={`just drew a ${accuracy}% perfect circle 🎯 imcs.world #IMCS`}
        onPlayAgain={handlePlayAgain}
        showPlayAgain={true}
      />
    )
  }

  return (
    <CircleDrawing
      onSubmit={handleSubmit}
      onGiveUp={handleGiveUp}
    />
  )
}

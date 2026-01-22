'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import TypingTest from '@/components/gates/TypingTest'
import SharePrompt from '@/components/SharePrompt'

export default function TypingGamePage() {
  const router = useRouter()
  const { address } = useWallet()
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [wpm, setWpm] = useState(0)

  const handleSuccess = async (earnedScore: number, earnedWpm: number) => {
    setScore(earnedScore)
    setWpm(earnedWpm)

    // Save to task completions
    if (address) {
      try {
        await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            task_type: 'typing',
            score: earnedScore,
          }),
        })
      } catch (e) {
        console.error('Failed to save score:', e)
      }
    }

    setShowResult(true)
  }

  const handlePlayAgain = () => {
    setShowResult(false)
    setScore(0)
    setWpm(0)
  }

  if (showResult) {
    return (
      <SharePrompt
        title="⌨️ typing complete!"
        score={`${wpm} WPM`}
        scoreLabel={`+${score} points earned!`}
        shareText={`typed ${wpm} WPM like a true savant ⌨️ imcs.world #IMCS`}
        onPlayAgain={handlePlayAgain}
        showPlayAgain={true}
      />
    )
  }

  return <TypingTest onSuccess={handleSuccess} />
}

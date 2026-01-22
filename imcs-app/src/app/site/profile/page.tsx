'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import ConnectWallet from '@/components/ConnectWallet'

type ProfileData = {
  wallet_address: string
  name: string
  info: string
  submission_score: number
  submitted_at: string
  referrer_code?: string
  voting_karma: number
  whitelist_status: string
  whitelist_method?: string
  referrals_made: number
  rank?: number
}

type TaskCompletion = {
  task_type: string
  score: number
  completed_at: string
}

export default function ProfilePage() {
  const { address, isConnected, truncatedAddress } = useWallet()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [completedTasks, setCompletedTasks] = useState<TaskCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rank, setRank] = useState<number | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      fetchProfile()
      fetchCompletedTasks()
    } else {
      setLoading(false)
    }
  }, [isConnected, address])

  const fetchProfile = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/profile/${address}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setError(null)

        // Fetch rank from leaderboard
        const lbResponse = await fetch('/api/leaderboard/submissions?limit=1000')
        if (lbResponse.ok) {
          const lbData = await lbResponse.json()
          const userRank = lbData.findIndex(
            (s: any) => s.wallet_address.toLowerCase() === address.toLowerCase()
          ) + 1
          setRank(userRank > 0 ? userRank : null)
        }
      } else {
        setError('ur wallet not savant yet. submit form first, nerd')
        setProfile(null)
      }
    } catch (e) {
      setError('error loading profile')
    }
    setLoading(false)
  }

  const fetchCompletedTasks = async () => {
    if (!address) return
    try {
      const response = await fetch(`/api/tasks/${address}`)
      if (response.ok) {
        const data = await response.json()
        setCompletedTasks(data.tasks || [])
      }
    } catch (e) {
      // Tasks API may not exist yet
    }
  }

  const totalPoints = (profile?.submission_score || 0) + (profile?.voting_karma || 0)

  const referralCode = address ? address.slice(2, 10).toUpperCase() : ''

  const handleShare = () => {
    const shareText = `im a savant with ${totalPoints} points! can u beat me? 🧙‍♂️✨ imcs.world #IMCS`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(`imcs.world?ref=${referralCode}`)
    alert('copied 2 clipboard!')
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="page active">
        <div className="form-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 className="form-title">my savant profil</h2>
          <p style={{ fontSize: '24px', marginBottom: '30px' }}>
            connect ur wallut 2 c ur stats
          </p>
          <ConnectWallet label="connect wallut" />
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="page active">
        <div className="form-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 className="form-title">loading...</h2>
          <div style={{ fontSize: '48px' }}>⏳</div>
        </div>
      </div>
    )
  }

  // Error state - not on list
  if (error || !profile) {
    return (
      <div className="page active">
        <div className="form-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 className="form-title">u dont exist yet</h2>
          <p style={{ fontSize: '20px', marginBottom: '20px' }}>
            {truncatedAddress}
          </p>
          <p style={{ fontSize: '24px', marginBottom: '30px' }}>
            ur wallet not savant yet, dummie
          </p>
          <button
            onClick={() => window.location.href = '/site/tasks'}
            className="submit-btn"
          >
            proove im savant
          </button>
        </div>
      </div>
    )
  }

  const isWhitelisted = profile.whitelist_status === 'approved'

  return (
    <div className="page active">
      {/* Profile card */}
      <div
        className={`profile-card ${isWhitelisted ? 'whitelisted' : ''}`}
        style={{
          maxWidth: '700px',
          margin: '30px auto',
          padding: '30px',
        }}
      >
        <h2 className="form-title" style={{ marginBottom: '10px' }}>
          {profile.name}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#000',
          marginBottom: '20px',
          fontFamily: 'monospace',
        }}>
          {truncatedAddress}
        </p>

        {/* Total points */}
        <div className="profile-score">
          {totalPoints}
        </div>
        <p style={{ fontSize: '20px', marginBottom: '20px' }}>
          total points
        </p>

        {/* Rank */}
        {rank && (
          <p style={{
            fontSize: '24px',
            color: '#fff',
            textShadow: '2px 2px 0 #000',
            marginBottom: '20px',
          }}>
            rank #{rank}
          </p>
        )}

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px',
          marginBottom: '25px',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            padding: '15px',
            border: '3px solid #000',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {profile.submission_score}
            </div>
            <div style={{ fontSize: '14px' }}>submission score</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            padding: '15px',
            border: '3px solid #000',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {profile.voting_karma}
            </div>
            <div style={{ fontSize: '14px' }}>voting karma</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            padding: '15px',
            border: '3px solid #000',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {profile.referrals_made}
            </div>
            <div style={{ fontSize: '14px' }}>referrals</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            padding: '15px',
            border: '3px solid #000',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {isWhitelisted ? '✅' : '❌'}
            </div>
            <div style={{ fontSize: '14px' }}>whitelist</div>
          </div>
        </div>

        {/* Whitelist status */}
        <div className="profile-status" style={{ marginBottom: '20px' }}>
          {isWhitelisted ? (
            <span style={{ color: '#fff' }}>CONGRAAAATS U AR SAVANT! 🎉</span>
          ) : (
            <span style={{ color: '#ffff00' }}>not savant yet... keep grinding!</span>
          )}
        </div>

        {/* Referral code */}
        <div style={{
          background: '#fff',
          padding: '15px',
          border: '3px solid #000',
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>ur referral code:</p>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '2px',
          }}>
            {referralCode}
          </div>
          <button
            onClick={copyReferralCode}
            style={{
              fontFamily: 'Comic Neue, cursive',
              fontSize: '14px',
              padding: '8px 16px',
              background: '#ffff00',
              border: '2px solid #000',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            copy link
          </button>
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '15px',
            border: '3px solid #000',
            marginBottom: '20px',
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px', fontWeight: 'bold' }}>
              completed tasks:
            </p>
            {completedTasks.map((task, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: i < completedTasks.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
              }}>
                <span>✅ {task.task_type}</span>
                <span>+{task.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          className="submit-btn"
          style={{ background: '#1DA1F2', color: '#fff' }}
        >
          share on X 🐦
        </button>
      </div>
    </div>
  )
}

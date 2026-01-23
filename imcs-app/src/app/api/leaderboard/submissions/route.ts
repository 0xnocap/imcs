import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')

    // Query the leaderboard_submissions view (has vote-based scores)
    const { data: leaderboard, error } = await supabase
      .from('leaderboard_submissions')
      .select('*')
      .limit(Math.min(limit, 1000)) // Max 1000 for safety

    if (error) {
      console.error('Leaderboard error:', error)
      return NextResponse.json(
        { error: 'failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Also fetch all task completions to add task points
    const { data: taskCompletions } = await supabase
      .from('task_completions')
      .select('wallet_address, score')

    // Create a map of wallet -> total task points
    const taskPointsMap = new Map<string, number>()
    if (taskCompletions) {
      for (const task of taskCompletions) {
        const wallet = task.wallet_address.toLowerCase()
        const current = taskPointsMap.get(wallet) || 0
        taskPointsMap.set(wallet, current + (task.score || 0))
      }
    }

    // Add task points to each submission's score and calculate total
    const leaderboardWithTasks = (leaderboard || []).map(sub => {
      const taskPoints = taskPointsMap.get(sub.wallet_address.toLowerCase()) || 0
      return {
        ...sub,
        task_points: taskPoints,
        // Total score = vote-based score + task points
        score: (sub.score || 0) + taskPoints
      }
    })

    // Re-sort by total score (descending)
    leaderboardWithTasks.sort((a, b) => b.score - a.score)

    return NextResponse.json(leaderboardWithTasks)
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'sumthin went wrong' },
      { status: 500 }
    )
  }
}

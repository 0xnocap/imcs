import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Get a random submission for voting
 * GET /api/vote/random?exclude=id1,id2,id3
 */
export async function GET(request: NextRequest) {
  try {
    // Get exclude IDs from query params
    const excludeParam = request.nextUrl.searchParams.get('exclude')
    const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : []

    // Get all submissions with their current scores, ordered by score descending
    const { data: submissions, error } = await supabase
      .from('leaderboard_submissions')
      .select('id, wallet_address, name, info, score')
      .order('score', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        { error: 'failed to fetch submissions' },
        { status: 500 }
      )
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json(
        { error: 'no submissions available' },
        { status: 404 }
      )
    }

    // Add rank to each submission based on score order
    const submissionsWithRank = submissions.map((sub, index) => ({
      ...sub,
      rank: index + 1
    }))

    // Filter out excluded IDs
    const availableSubmissions = submissionsWithRank.filter(
      sub => !excludeIds.includes(sub.id)
    )

    if (availableSubmissions.length === 0) {
      return NextResponse.json(
        { error: 'no more submissions to vote on' },
        { status: 404 }
      )
    }

    // Return a random submission from available ones
    const randomIndex = Math.floor(Math.random() * availableSubmissions.length)
    const randomSubmission = availableSubmissions[randomIndex]

    return NextResponse.json(randomSubmission)
  } catch (error) {
    console.error('Random submission error:', error)
    return NextResponse.json(
      { error: 'sumthin went wrong' },
      { status: 500 }
    )
  }
}

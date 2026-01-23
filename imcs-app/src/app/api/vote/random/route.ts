import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Get a random submission for voting
 * GET /api/vote/random?exclude=id1,id2,id3&voter=walletOrIp
 */
export async function GET(request: NextRequest) {
  try {
    // Get exclude IDs from query params
    const excludeParam = request.nextUrl.searchParams.get('exclude')
    const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : []

    // Get voter identifier (wallet or IP) to check what they've already voted on
    const voterParam = request.nextUrl.searchParams.get('voter')
    
    // Also try to get IP from headers as fallback
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const headerIp = forwardedFor?.split(',')[0]?.trim() || realIp

    // Collect all voter identifiers to check (wallet and/or IP)
    const voterIdentifiers: string[] = []
    if (voterParam) voterIdentifiers.push(voterParam.toLowerCase())
    if (headerIp && headerIp !== voterParam?.toLowerCase()) voterIdentifiers.push(headerIp)

    // Get submissions this user has already voted on from the database
    let alreadyVotedIds: string[] = []
    if (voterIdentifiers.length > 0) {
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('submission_id')
        .in('voter_identifier', voterIdentifiers)

      if (existingVotes) {
        alreadyVotedIds = existingVotes.map(v => v.submission_id)
      }
    }

    // Combine frontend excludes with database excludes
    const allExcludeIds = new Set([...excludeIds, ...alreadyVotedIds])

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

    // Filter out excluded IDs (both from frontend and database)
    const availableSubmissions = submissionsWithRank.filter(
      sub => !allExcludeIds.has(sub.id)
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

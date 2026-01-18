import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export type Submission = {
  id: string
  wallet_address: string
  name: string
  info: string
  score: number
  created_at: string
  ip_address?: string
}

export type Vote = {
  id: string
  submission_id: string
  voter_identifier: string
  vote_type: 'upvote' | 'downvote'
  created_at: string
}

export type AccessAttempt = {
  id: string
  ip_address: string
  attempt_type: 'circle' | 'typing'
  success: boolean
  score?: number
  created_at: string
}

export type Whitelist = {
  id: string
  wallet_address: string
  status: 'approved' | 'pending' | 'rejected'
  method?: string
  added_at: string
}

export type UserProfile = {
  wallet_address: string
  name: string
  info: string
  submission_score: number
  voting_karma: number
  whitelist_status: 'approved' | 'pending' | 'rejected' | null
}

// Helper functions
export async function getSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Submission[]
}

export async function getSubmission(id: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Submission
}

export async function getSubmissionByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()

  if (error) return null
  return data as Submission
}

export async function getUserProfile(walletAddress: string): Promise<UserProfile | null> {
  // Get submission
  const submission = await getSubmissionByWallet(walletAddress)
  if (!submission) return null

  // Get whitelist status
  const { data: whitelistData } = await supabase
    .from('whitelist')
    .select('status')
    .eq('wallet_address', walletAddress)
    .single()

  // Get voting karma (count of votes cast)
  const { count: votingKarma } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('voter_identifier', walletAddress)

  return {
    wallet_address: walletAddress,
    name: submission.name,
    info: submission.info,
    submission_score: submission.score,
    voting_karma: votingKarma || 0,
    whitelist_status: whitelistData?.status || null
  }
}

export async function getLeaderboardSubmissions(limit = 100) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Submission[]
}

export async function getLeaderboardVoters(limit = 100) {
  const { data, error } = await supabase
    .from('votes')
    .select('voter_identifier')

  if (error) throw error

  // Group by voter and count
  const voterCounts: Record<string, number> = {}
  data.forEach((vote: any) => {
    voterCounts[vote.voter_identifier] = (voterCounts[vote.voter_identifier] || 0) + 1
  })

  // Convert to array and sort
  const leaderboard = Object.entries(voterCounts)
    .map(([voter, count]) => ({ voter_identifier: voter, karma_score: count }))
    .sort((a, b) => b.karma_score - a.karma_score)
    .slice(0, limit)

  return leaderboard
}

export async function hasVoted(voterIdentifier: string, submissionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('voter_identifier', voterIdentifier)
    .eq('submission_id', submissionId)
    .single()

  return !!data && !error
}

export async function getVotedSubmissionIds(voterIdentifier: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('submission_id')
    .eq('voter_identifier', voterIdentifier)

  if (error) return []
  return data.map((v: any) => v.submission_id)
}

export async function createVote(
  submissionId: string,
  voterIdentifier: string,
  voteType: 'upvote' | 'downvote'
) {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      submission_id: submissionId,
      voter_identifier: voterIdentifier,
      vote_type: voteType
    })
    .select()
    .single()

  if (error) throw error
  return data as Vote
}

export async function createSubmission(
  walletAddress: string,
  name: string,
  info: string,
  ipAddress?: string
) {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      wallet_address: walletAddress,
      name,
      info,
      ip_address: ipAddress
    })
    .select()
    .single()

  if (error) throw error
  return data as Submission
}

export async function recordAccessAttempt(
  ipAddress: string,
  attemptType: 'circle' | 'typing',
  success: boolean,
  score?: number
) {
  const { data, error } = await supabase
    .from('access_attempts')
    .insert({
      ip_address: ipAddress,
      attempt_type: attemptType,
      success,
      score
    })
    .select()
    .single()

  if (error) throw error
  return data as AccessAttempt
}

export async function getAccessAttempts(ipAddress: string, attemptType: 'circle' | 'typing') {
  const { data, error } = await supabase
    .from('access_attempts')
    .select('*')
    .eq('ip_address', ipAddress)
    .eq('attempt_type', attemptType)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as AccessAttempt[]
}

export async function getFailedCircleAttempts(ipAddress: string): Promise<number> {
  const { count, error } = await supabase
    .from('access_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ipAddress)
    .eq('attempt_type', 'circle')
    .eq('success', false)

  if (error) return 0
  return count || 0
}

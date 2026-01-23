import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Tasks that can be repeated up to 5 times for points
const LIMITED_TASKS = ['circle', 'typing', 'bubble']
const MAX_ATTEMPTS = 5

// Tasks that give points only once but can be done more
const ONE_TIME_POINTS_TASKS = ['paint']

// Tasks that can only be completed once
const ONE_TIME_TASKS = ['submit']

// Tasks that accumulate points with no limit (voting milestones)
const ACCUMULATING_TASKS = ['vote']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, task_type, score } = body

    if (!wallet_address || !task_type) {
      return NextResponse.json(
        { error: 'wallet_address and task_type required' },
        { status: 400 }
      )
    }

    const walletLower = wallet_address.toLowerCase()
    const isLimitedTask = LIMITED_TASKS.includes(task_type)
    const isOneTimePoints = ONE_TIME_POINTS_TASKS.includes(task_type)
    const isOneTimeTask = ONE_TIME_TASKS.includes(task_type)
    const isAccumulatingTask = ACCUMULATING_TASKS.includes(task_type)

    // Check if task already completed
    const { data: existing, error: selectError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('wallet_address', walletLower)
      .eq('task_type', task_type)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is expected for new tasks
    }

    if (existing) {
      const currentCount = existing.completion_count || 1

      if (isLimitedTask) {
        // Check if user has reached the limit
        if (currentCount >= MAX_ATTEMPTS) {
          return NextResponse.json({
            success: false,
            message: `u already did dis ${MAX_ATTEMPTS} times, no more points 4 u`,
            score: existing.score,
            completion_count: currentCount,
            max_reached: true,
            updated: false,
          })
        }

        // Add points and increment count
        const newTotalScore = (existing.score || 0) + (score || 0)
        const newCount = currentCount + 1

        const { error: updateError } = await supabase
          .from('task_completions')
          .update({
            score: newTotalScore,
            completion_count: newCount,
            completed_at: new Date().toISOString()
          })
          .eq('wallet_address', walletLower)
          .eq('task_type', task_type)

        if (updateError) {
          console.error('Task update error:', updateError)
          return NextResponse.json(
            { error: 'failed to update task' },
            { status: 500 }
          )
        }

        const attemptsLeft = MAX_ATTEMPTS - newCount
        return NextResponse.json({
          success: true,
          message: attemptsLeft > 0
            ? `+${score} points! ${attemptsLeft} attempts left`
            : `+${score} points! no more attempts left`,
          score: newTotalScore,
          added: score,
          completion_count: newCount,
          attempts_left: attemptsLeft,
          updated: true,
        })
      } else if (isOneTimePoints) {
        // For paint: allow doing it again but no more points
        // Increment count for tracking but don't add points
        const newCount = currentCount + 1

        const { error: updateError } = await supabase
          .from('task_completions')
          .update({
            completion_count: newCount,
            completed_at: new Date().toISOString()
          })
          .eq('wallet_address', walletLower)
          .eq('task_type', task_type)

        if (updateError) {
          console.error('Task update error:', updateError)
        }

        return NextResponse.json({
          success: true,
          message: 'nice art! (u already got ur points tho)',
          score: existing.score,
          added: 0,
          completion_count: newCount,
          updated: false,
        })
      } else if (isAccumulatingTask) {
        // For vote milestones: add points with no limit
        const newTotalScore = (existing.score || 0) + (score || 0)
        const newCount = currentCount + 1

        const { error: updateError } = await supabase
          .from('task_completions')
          .update({
            score: newTotalScore,
            completion_count: newCount,
            completed_at: new Date().toISOString()
          })
          .eq('wallet_address', walletLower)
          .eq('task_type', task_type)

        if (updateError) {
          console.error('Task update error:', updateError)
          return NextResponse.json(
            { error: 'failed to update task' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `+${score} points! keep going!`,
          score: newTotalScore,
          added: score,
          completion_count: newCount,
          updated: true,
        })
      } else {
        // For one-time tasks (submit), don't allow repeating
        return NextResponse.json({
          success: true,
          message: 'task already completed',
          score: existing.score,
          updated: false,
        })
      }
    }

    // Insert new completion
    const { error: insertError } = await supabase
      .from('task_completions')
      .insert({
        wallet_address: walletLower,
        task_type,
        score: score || 0,
        completion_count: 1,
      })

    if (insertError) {
      console.error('Task insert error:', insertError)
      return NextResponse.json(
        { error: 'failed to save task completion' },
        { status: 500 }
      )
    }

    // Note: Task points are stored in task_completions table only
    // The profile page sums them separately from submissions.score (which is vote-based)
    // This avoids conflicts with vote triggers that recalculate submissions.score

    const attemptsLeft = isLimitedTask ? MAX_ATTEMPTS - 1 : 0
    return NextResponse.json({
      success: true,
      message: isLimitedTask
        ? `task completed! ${attemptsLeft} attempts left`
        : 'task completed!',
      score,
      added: score,
      completion_count: 1,
      attempts_left: attemptsLeft,
    })
  } catch (error) {
    console.error('Task complete error:', error)
    return NextResponse.json(
      { error: 'something went wrong' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Check if task already completed (to allow updating high scores)
    const { data: existing } = await supabase
      .from('task_completions')
      .select('*')
      .eq('wallet_address', walletLower)
      .eq('task_type', task_type)
      .single()

    if (existing) {
      // Only update if new score is higher
      if (score > existing.score) {
        const { error: updateError } = await supabase
          .from('task_completions')
          .update({ score, completed_at: new Date().toISOString() })
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
          message: 'new high score!',
          score,
          updated: true,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'task already completed',
        score: existing.score,
        updated: false,
      })
    }

    // Insert new completion
    const { error: insertError } = await supabase
      .from('task_completions')
      .insert({
        wallet_address: walletLower,
        task_type,
        score: score || 0,
      })

    if (insertError) {
      console.error('Task insert error:', insertError)
      return NextResponse.json(
        { error: 'failed to save task completion' },
        { status: 500 }
      )
    }

    // Also add score to user's submission if they have one
    try {
      const { data: profile } = await supabase
        .from('submissions')
        .select('id, score')
        .eq('wallet_address', walletLower)
        .single()

      if (profile) {
        await supabase
          .from('submissions')
          .update({ score: (profile.score || 0) + (score || 0) })
          .eq('id', profile.id)
      }
    } catch (e) {
      // User might not have a submission yet
    }

    return NextResponse.json({
      success: true,
      message: 'task completed!',
      score,
    })
  } catch (error) {
    console.error('Task complete error:', error)
    return NextResponse.json(
      { error: 'something went wrong' },
      { status: 500 }
    )
  }
}

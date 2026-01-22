import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    const wallet = params.wallet.toLowerCase()

    // Query task_completions table
    const { data: tasks, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('wallet_address', wallet)
      .order('completed_at', { ascending: false })

    if (error) {
      // Table might not exist yet - return empty array
      console.error('Task completions query error:', error)
      return NextResponse.json({ tasks: [] })
    }

    return NextResponse.json({ tasks: tasks || [] })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'failed to fetch tasks', tasks: [] },
      { status: 500 }
    )
  }
}

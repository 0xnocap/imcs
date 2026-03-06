import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('whitelist')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    if (error) {
      console.error('WL count error:', error)
      return NextResponse.json({ count: 0 }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
      })
    }

    return NextResponse.json({ count: count || 0 }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    })
  } catch (error) {
    console.error('WL count error:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}

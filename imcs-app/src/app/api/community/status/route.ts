import { NextResponse } from 'next/server'
import { COLLECTIONS } from '@/lib/collections'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: allClaims, error: dbError } = await supabase
      .from('community_claims')
      .select('collection_slug')
      .limit(10000)

    if (dbError) {
      console.error('community_claims query error:', dbError)
    }

    const claimCounts: Record<string, number> = {}
    if (allClaims) {
      for (const row of allClaims) {
        claimCounts[row.collection_slug] = (claimCounts[row.collection_slug] || 0) + 1
      }
    }

    const collections = COLLECTIONS.map(c => {
      const claimed = claimCounts[c.slug] || 0
      return {
        slug: c.slug,
        name: c.name,
        displayName: c.displayName,
        chainId: c.chainId,
        cap: c.cap,
        claimed: c.closed ? c.cap : claimed,
        spotsRemaining: c.closed ? 0 : c.cap - claimed,
        logo: c.logo || null,
      }
    })

    return NextResponse.json(
      { collections },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Community status error:', error)
    return NextResponse.json(
      { error: 'sumthin went wrong' },
      { status: 500 }
    )
  }
}

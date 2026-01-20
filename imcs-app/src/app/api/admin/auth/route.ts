import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    // Password must be set in environment variable - no defaults
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set!')
      return NextResponse.json(
        { error: 'admin not configured' },
        { status: 500 }
      )
    }

    if (password === adminPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'wrong password dummie' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'something went wrong' },
      { status: 500 }
    )
  }
}

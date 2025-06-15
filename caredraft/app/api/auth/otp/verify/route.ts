import { NextResponse } from 'next/server'
import { verifyOtpCode } from '@/lib/auth.utils'

export async function POST(request: Request) {
  try {
    const { identifier, token, type } = await request.json()
    if (!identifier || !token || (type !== 'email' && type !== 'phone')) {
      return NextResponse.json({ success: false, error: { message: 'Invalid request' } }, { status: 400 })
    }
    const result = await verifyOtpCode(identifier, token, type)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error, message: result.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message, session: result.session })
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
} 
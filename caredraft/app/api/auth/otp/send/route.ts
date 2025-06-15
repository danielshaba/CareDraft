import { NextResponse } from 'next/server'
import { sendOtpCode } from '@/lib/auth.utils'

export async function POST(request: Request) {
  try {
    const { identifier, type } = await request.json()
    if (!identifier || (type !== 'email' && type !== 'phone')) {
      return NextResponse.json({ success: false, error: { message: 'Invalid request' } }, { status: 400 })
    }
    const result = await sendOtpCode(identifier, type)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error, message: result.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
} 
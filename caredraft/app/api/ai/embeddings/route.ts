import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    if (text.length > 8000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum length is 8000 characters.' },
        { status: 400 }
      )
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    })

    const embedding = response.data[0].embedding

    return NextResponse.json({
      embedding,
      model: 'text-embedding-ada-002',
      usage: response.usage
    })

  } catch (error) {
    console.error('Error generating embedding:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate embedding: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    )
  }
} 
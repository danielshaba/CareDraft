import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: Implement real database statistics once ai_operations table is deployed
    // For now, return mock data to demonstrate the dashboard functionality
    const stats = getMockStats()
    return NextResponse.json(stats)

  } catch (error) {
    console.error('Failed to fetch AI stats:', error)
    return NextResponse.json(getMockStats())
  }
}

// function calculateStats(operations: any[]): any {
//   if (operations.length === 0) {
//     return getMockStats()
//   }
//   // Real implementation would analyze operations and return actual stats
//   return getMockStats()
// }

function getMockStats(): any {
  return {
    totalRequests: Math.floor(Math.random() * 5000) + 1000,
    totalTokens: Math.floor(Math.random() * 500000) + 100000,
    averageLatency: Math.floor(Math.random() * 1000) + 500,
    errorRate: Math.random() * 0.05,
    costEstimate: Math.random() * 100 + 20,
    popularFeatures: [
      { name: 'Content Expansion', count: Math.floor(Math.random() * 200) + 100 },
      { name: 'Grammar Improvement', count: Math.floor(Math.random() * 150) + 80 },
      { name: 'Text Rephrasing', count: Math.floor(Math.random() * 120) + 60 },
      { name: 'Fact Checking', count: Math.floor(Math.random() * 100) + 50 },
      { name: 'Content Summarization', count: Math.floor(Math.random() * 90) + 40 },
      { name: 'Brainstorming', count: Math.floor(Math.random() * 80) + 30 },
      { name: 'Tone Adjustment', count: Math.floor(Math.random() * 70) + 25 },
      { name: 'Translation', count: Math.floor(Math.random() * 60) + 20 },
      { name: 'Statistics Integration', count: Math.floor(Math.random() * 50) + 15 },
      { name: 'Case Study Generation', count: Math.floor(Math.random() * 40) + 10 }
    ]
  }
} 
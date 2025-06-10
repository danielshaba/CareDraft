import { NextRequest } from 'next/server';
import { withCache, CACHE_STRATEGIES, invalidateCache } from '@/lib/utils/api-cache';

// Mock research session data
const mockSessions = new Map([
  ['session-1', {
    id: 'session-1',
    title: 'Healthcare Innovation Research',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    status: 'active',
    queries: [
      'latest healthcare technology trends',
      'AI in medical diagnosis',
      'telemedicine adoption rates'
    ],
    results: [
      {
        id: 'result-1',
        title: 'AI-Powered Diagnostic Tools',
        source: 'Medical Journal',
        relevance: 0.95,
        summary: 'Recent advances in AI-powered diagnostic tools show 95% accuracy...'
      },
      {
        id: 'result-2',
        title: 'Telemedicine Growth Statistics',
        source: 'Healthcare Analytics',
        relevance: 0.88,
        summary: 'Telemedicine adoption increased by 300% during 2023...'
      }
    ],
    metadata: {
      totalQueries: 3,
      totalResults: 15,
      avgRelevance: 0.87,
      timeSpent: '2h 30m'
    }
  }],
  ['session-2', {
    id: 'session-2',
    title: 'Pharmaceutical Research Trends',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T16:45:00Z',
    status: 'completed',
    queries: [
      'drug development timelines',
      'clinical trial success rates',
      'regulatory approval processes'
    ],
    results: [
      {
        id: 'result-3',
        title: 'Drug Development Timeline Analysis',
        source: 'Pharma Research',
        relevance: 0.92,
        summary: 'Average drug development timeline is 12-15 years...'
      }
    ],
    metadata: {
      totalQueries: 3,
      totalResults: 8,
      avgRelevance: 0.84,
      timeSpent: '4h 15m'
    }
  }]
]);

// GET /api/research/sessions/[id]
export const GET = withCache(
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const session = mockSessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      data: session,
      cached: false, // This will be true when served from cache
      timestamp: new Date().toISOString()
    };
  },
  {
    ...CACHE_STRATEGIES.researchSession,
    tags: ['research_sessions']
  }
);

// PUT /api/research/sessions/[id]
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();
    
    if (!sessionId) {
      return Response.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const session = mockSessions.get(sessionId);
    
    if (!session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const updates = await request.json();
    
    // Update the session
    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    mockSessions.set(sessionId, updatedSession);
    
    // Invalidate related caches
    await invalidateCache([
      'research_sessions',
      `session_${sessionId}`,
      'search_results' // Related search results might be affected
    ]);
    
    return Response.json({
      success: true,
      data: updatedSession,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating research session:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { LRUCache } from 'lru-cache'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export function rateLimit(options: Options = {}) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  })

  return {
    check: (token: string, limit: number): Promise<{ success: boolean }> => {
      return new Promise((resolve) => {
        const tokenCount = (tokenCache.get(token) as number) || 0
        
        if (tokenCount >= limit) {
          resolve({ success: false })
          return
        }

        tokenCache.set(token, tokenCount + 1)
        resolve({ success: true })
      })
    }
  }
} 
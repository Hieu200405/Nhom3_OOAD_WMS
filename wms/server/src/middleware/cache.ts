import NodeCache from 'node-cache';
import type { Request, Response, NextFunction } from 'express';

// Create cache instance with 5 minute default TTL
const cache = new NodeCache({
    stdTTL: 300, // 5 minutes
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false // Better performance
});

/**
 * Cache middleware for GET requests
 * @param duration - Cache duration in seconds
 */
export const cacheMiddleware = (duration: number = 300) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `${req.originalUrl || req.url}`;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        // Store original json function
        const originalJson = res.json.bind(res);

        // Override json function to cache response
        res.json = function (body: any) {
            cache.set(key, body, duration);
            return originalJson(body);
        };

        next();
    };
};

/**
 * Invalidate cache for specific patterns
 */
export const invalidateCache = (pattern: string) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key: string) => key.includes(pattern));
    matchingKeys.forEach((key: string) => cache.del(key));
    return matchingKeys.length;
};

/**
 * Clear all cache
 */
export const clearCache = () => {
    cache.flushAll();
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
    return cache.getStats();
};

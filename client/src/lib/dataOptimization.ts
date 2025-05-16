/**
 * Data optimization utilities for handling large datasets efficiently
 */

/**
 * Virtualized list helper for optimized rendering of large lists
 * This serves as a computation helper for React components that use virtualization
 */
export function getVirtualizedRange<T>(
  items: T[],
  visibleStartIndex: number,
  visibleEndIndex: number,
  buffer: number = 10
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalCount: number;
} {
  const totalCount = items.length;
  const bufferedStartIndex = Math.max(0, visibleStartIndex - buffer);
  const bufferedEndIndex = Math.min(items.length - 1, visibleEndIndex + buffer);
  
  const visibleItems = items.slice(bufferedStartIndex, bufferedEndIndex + 1);
  
  return {
    visibleItems,
    startIndex: bufferedStartIndex,
    endIndex: bufferedEndIndex,
    totalCount
  };
}

/**
 * Optimize large objects by removing unnecessary properties
 * Useful for caching or storing large data objects
 */
export function optimizeObject<T extends object>(
  obj: T,
  includeProperties: (keyof T)[],
  deepClone: boolean = false
): Partial<T> {
  if (!obj) return {};
  
  const result: Partial<T> = {};
  
  for (const key of includeProperties) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone ? structuredClone(obj[key]) : obj[key];
    }
  }
  
  return result;
}

/**
 * Memoization function for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize: number = 100
): T {
  const cache = new Map<string, { result: ReturnType<T>, timestamp: number }>();
  
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Update timestamp (LRU)
      const entry = cache.get(key)!;
      entry.timestamp = Date.now();
      return entry.result;
    }
    
    // If cache is full, remove the oldest entry
    if (cache.size >= maxCacheSize) {
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      
      cache.forEach((entry, k) => {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = k;
        }
      });
      
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    // Calculate and cache the result
    const result = fn(...args);
    cache.set(key, { result, timestamp: Date.now() });
    
    return result;
  }) as T;
  
  return memoized;
}

/**
 * Debounce function to optimize performance for frequent events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func.apply(this, args);
    }
  };
}

/**
 * Chunks API requests to prevent overwhelming the backend
 */
export async function chunkedApiRequest<T, R>(
  items: T[],
  processFn: (chunk: T[]) => Promise<R[]>,
  chunkSize: number = 50
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processFn(chunk);
    results.push(...chunkResults);
  }
  
  return results;
}

export default {
  getVirtualizedRange,
  optimizeObject,
  memoize,
  debounce,
  chunkedApiRequest
};

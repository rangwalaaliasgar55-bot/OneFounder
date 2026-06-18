/**
 * Safe iteration utilities to prevent "TypeError: undefined is not iterable" errors
 */

/**
 * Safely map over an array, returning empty array if input is undefined/null
 */
export function safeMap<T, U>(arr: T[] | undefined | null, fn: (item: T, index: number) => U): U[] {
  if (!arr || !Array.isArray(arr)) return []
  return arr.map(fn)
}

/**
 * Safely filter an array, returning empty array if input is undefined/null
 */
export function safeFilter<T>(arr: T[] | undefined | null, fn: (item: T, index: number) => boolean): T[] {
  if (!arr || !Array.isArray(arr)) return []
  return arr.filter(fn)
}

/**
 * Safely iterate over an array, doing nothing if input is undefined/null
 */
export function safeForEach<T>(arr: T[] | undefined | null, fn: (item: T, index: number) => void): void {
  if (!arr || !Array.isArray(arr)) return
  arr.forEach(fn)
}

/**
 * Safely spread an array, returning empty array if input is undefined/null
 */
export function safeSpread<T>(arr: T[] | undefined | null): T[] {
  if (!arr || !Array.isArray(arr)) return []
  return [...arr]
}

/**
 * Safely get the first element of an array
 */
export function safeFirst<T>(arr: T[] | undefined | null): T | undefined {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return undefined
  return arr[0]
}

/**
 * Safely slice an array
 */
export function safeSlice<T>(arr: T[] | undefined | null, start?: number, end?: number): T[] {
  if (!arr || !Array.isArray(arr)) return []
  return arr.slice(start, end)
}

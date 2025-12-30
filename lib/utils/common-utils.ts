import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toSnakeCase = (s: string): string => {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
}

/*------------------------ UUID Regex ------------------------*/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isValidUUID = (id: unknown): id is string => {
  return typeof id === 'string' && id.length === 36 && UUID_REGEX.test(id)
}

/*---------------------- Sanitize JSON -----------------------*/
const MAX_JSON_DEPTH = 10
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function sanitizeJson(input: unknown, depth = 0): Record<string, unknown> | null {
  if (input === null || input === undefined) return null

  // DoS protection: prevent deeply nested objects
  if (depth > MAX_JSON_DEPTH) {
    throw new Error('Metadata nesting too deep')
  }

  // Ensure it's an object (not array, not primitive)
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Metadata must be a JSON object')
  }

  // Recursively sanitize and remove prototype pollution attacks
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) continue

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeJson(value, depth + 1)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

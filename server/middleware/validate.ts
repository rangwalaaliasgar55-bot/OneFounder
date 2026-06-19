import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

/**
 * Middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured errors on validation failure.
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      }))
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }
    req.body = result.data
    next()
  }
}

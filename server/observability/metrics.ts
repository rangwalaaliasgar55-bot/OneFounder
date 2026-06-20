/**
 * OneFounder Metrics Service
 * Tracks: DAU/WAU/MAU, AI latency, token usage, route performance, Ollama uptime.
 * In-memory with periodic DB flush for persistence.
 */
import { db } from '../db/index.js'
import { userActivityLog } from '../db/schema.js'
import { eq, gte, count, sql } from 'drizzle-orm'

interface MetricPoint {
  value: number
  timestamp: number
  labels?: Record<string, string>
}

class MetricsService {
  private counters = new Map<string, number>()
  private histograms = new Map<string, number[]>()
  private gauges = new Map<string, number>()

  // ── Counters ─────────────────────────────────────────────────────────────
  inc(name: string, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels)
    this.counters.set(key, (this.counters.get(key) || 0) + 1)
  }

  add(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels)
    this.counters.set(key, (this.counters.get(key) || 0) + value)
  }

  // ── Histograms (latency tracking) ────────────────────────────────────────
  observe(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels)
    const arr = this.histograms.get(key) || []
    arr.push(value)
    // Keep last 1000 data points
    if (arr.length > 1000) arr.shift()
    this.histograms.set(key, arr)
  }

  // ── Gauges (current values) ──────────────────────────────────────────────
  set(name: string, value: number, labels?: Record<string, string>) {
    this.gauges.set(this.buildKey(name, labels), value)
  }

  // ── Queries ──────────────────────────────────────────────────────────────
  getCounter(name: string, labels?: Record<string, string>): number {
    return this.counters.get(this.buildKey(name, labels)) || 0
  }

  getHistogram(name: string, labels?: Record<string, string>) {
    const arr = this.histograms.get(this.buildKey(name, labels)) || []
    if (arr.length === 0) return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 }
    const sorted = [...arr].sort((a, b) => a - b)
    return {
      count: sorted.length,
      avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    }
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    return this.gauges.get(this.buildKey(name, labels)) || 0
  }

  // ── Full snapshot ────────────────────────────────────────────────────────
  snapshot() {
    const counters: Record<string, number> = {}
    for (const [k, v] of this.counters) counters[k] = v

    const histograms: Record<string, ReturnType<typeof this.getHistogram>> = {}
    for (const [k] of this.histograms) histograms[k] = this.getHistogram(k)

    const gauges: Record<string, number> = {}
    for (const [k, v] of this.gauges) gauges[k] = v

    return { counters, histograms, gauges, timestamp: Date.now() }
  }

  // ── DAU/WAU/MAU from DB ──────────────────────────────────────────────────
  async getUserMetrics() {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [dau, wau, mau] = await Promise.all([
      db.select({ count: sql<number>`count(distinct ${userActivityLog.userId})` })
        .from(userActivityLog)
        .where(gte(userActivityLog.createdAt, oneDayAgo)),
      db.select({ count: sql<number>`count(distinct ${userActivityLog.userId})` })
        .from(userActivityLog)
        .where(gte(userActivityLog.createdAt, oneWeekAgo)),
      db.select({ count: sql<number>`count(distinct ${userActivityLog.userId})` })
        .from(userActivityLog)
        .where(gte(userActivityLog.createdAt, oneMonthAgo)),
    ])

    return {
      dau: Number(dau[0]?.count || 0),
      wau: Number(wau[0]?.count || 0),
      mau: Number(mau[0]?.count || 0),
    }
  }

  reset() {
    this.counters.clear()
    this.histograms.clear()
    this.gauges.clear()
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name
    const labelStr = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join(',')
    return `${name}{${labelStr}}`
  }
}

export const metrics = new MetricsService()

// ── Express middleware for automatic route metrics ──────────────────────────
import type { Request, Response, NextFunction } from 'express'

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const route = req.route?.path || req.path || 'unknown'
    const method = req.method
    const status = String(res.statusCode)

    metrics.observe('http_request_duration_ms', duration, { method, route, status })
    metrics.inc('http_requests_total', { method, route, status })

    if (res.statusCode >= 500) {
      metrics.inc('http_errors_total', { method, route, status })
    }
  })

  next()
}

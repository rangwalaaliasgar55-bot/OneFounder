import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  const title = String(req.query.title || 'OneFounder').slice(0, 80)
  const description = String(req.query.description || 'The Operating System for Founders').slice(0, 120)
  const module = String(req.query.module || '')

  const moduleColors: Record<string, { bg: string; accent: string; icon: string }> = {
    ideas: { bg: '#1e1b4b', accent: '#6366f1', icon: '💡' },
    research: { bg: '#14532d', accent: '#22c55e', icon: '🔬' },
    plans: { bg: '#1e3a5f', accent: '#3b82f6', icon: '📋' },
    crm: { bg: '#4a1942', accent: '#a855f7', icon: '👥' },
    content: { bg: '#431407', accent: '#f97316', icon: '✍️' },
    seo: { bg: '#052e16', accent: '#10b981', icon: '🔍' },
    finance: { bg: '#1c1917', accent: '#eab308', icon: '💰' },
    chat: { bg: '#0f172a', accent: '#6366f1', icon: '🧠' },
  }

  const theme = moduleColors[module.toLowerCase()] || { bg: '#0f172a', accent: '#6366f1', icon: '🚀' }

  const lines = wrapText(description, 52)
  const line1 = lines[0] || ''
  const line2 = lines[1] || ''
  const line3 = lines[2] || ''

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.bg}"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.accent}88"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <circle cx="900" cy="100" r="300" fill="${theme.accent}" opacity="0.04"/>
  <circle cx="200" cy="500" r="200" fill="${theme.accent}" opacity="0.03"/>

  <rect x="0" y="0" width="8" height="630" fill="url(#accent)"/>

  <rect x="60" y="60" width="180" height="44" rx="10" fill="${theme.accent}20"/>
  <text x="80" y="89" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="22" font-weight="700" fill="${theme.accent}">${theme.icon} OneFounder</text>

  <text x="60" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="64" font-weight="800" fill="#ffffff" filter="url(#glow)">${escapeXml(truncate(title, 32))}</text>

  ${line1 ? `<text x="60" y="310" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="28" fill="#94a3b8">${escapeXml(line1)}</text>` : ''}
  ${line2 ? `<text x="60" y="348" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="28" fill="#94a3b8">${escapeXml(line2)}</text>` : ''}
  ${line3 ? `<text x="60" y="386" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="28" fill="#64748b">${escapeXml(line3)}</text>` : ''}

  <rect x="0" y="570" width="1200" height="60" fill="#ffffff06"/>
  <text x="60" y="605" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="20" fill="#475569">onefoundr.app</text>
  <text x="1140" y="605" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="20" fill="#475569" text-anchor="end">OS for Founders</text>
</svg>`

  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  res.send(svg)
})

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim())
      current = word
      if (lines.length >= 2) { lines.push(current.trim() + '…'); return lines }
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) lines.push(current.trim())
  return lines.slice(0, 3)
}

export default router

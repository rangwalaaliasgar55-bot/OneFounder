/**
 * Export utilities — CSV and JSON download helpers.
 */

export function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `${filename}.json`)
}

export function downloadCsv<T extends Record<string, any>>(rows: T[], filename: string, columns?: (keyof T)[]) {
  if (rows.length === 0) return
  const cols = columns || Object.keys(rows[0]) as (keyof T)[]
  const header = cols.map(c => String(c)).join(',')
  const body = rows.map(row =>
    cols.map(col => {
      const val = row[col]
      if (val == null) return ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  ).join('\n')
  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv' })
  triggerDownload(blob, `${filename}.csv`)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

import { useState, useMemo } from 'react'

interface SearchFilterProps<T> {
  items: T[]
  searchFields: (keyof T)[]
  placeholder?: string
  filters?: { key: keyof T; label: string; options?: string[] }[]
  sortOptions?: { key: string; label: string; fn: (a: T, b: T) => number }[]
  onFiltered: (items: T[]) => void
  className?: string
}

/**
 * Reusable search + filter + sort bar.
 * Pass items and search fields, get filtered results back via onFiltered.
 */
export function SearchFilter<T extends Record<string, any>>({
  items,
  searchFields,
  placeholder = 'Search...',
  filters = [],
  sortOptions = [],
  onFiltered,
  className = '',
}: SearchFilterProps<T>) {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('')

  const filtered = useMemo(() => {
    let result = items

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(item =>
        searchFields.some(field => {
          const val = item[field]
          if (val == null) return false
          return String(val).toLowerCase().includes(q)
        })
      )
    }

    // Dropdown filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (value && value !== 'all') {
        result = result.filter(item => String(item[key]) === value)
      }
    }

    // Sort
    if (sortBy && sortOptions.length > 0) {
      const sortOpt = sortOptions.find(s => s.key === sortBy)
      if (sortOpt) result = [...result].sort(sortOpt.fn)
    }

    return result
  }, [items, query, activeFilters, sortBy, searchFields, sortOptions])

  // Notify parent
  useMemo(() => { onFiltered(filtered) }, [filtered])

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input w-full pl-9 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {filters.map(f => {
        const options = f.options || [...new Set(items.map(i => String(i[f.key] ?? '')))].filter(Boolean).sort()
        return (
          <select
            key={String(f.key)}
            value={activeFilters[String(f.key)] || 'all'}
            onChange={e => setActiveFilters(prev => ({ ...prev, [String(f.key)]: e.target.value }))}
            className="input text-sm min-w-[120px]"
          >
            <option value="all">All {f.label}</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      })}

      {/* Sort dropdown */}
      {sortOptions.length > 0 && (
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="input text-sm min-w-[120px]"
        >
          <option value="">Sort by...</option>
          {sortOptions.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      )}

      {/* Results count */}
      {(query || Object.values(activeFilters).some(v => v && v !== 'all')) && (
        <span className="text-xs text-slate-500">
          {filtered.length} of {items.length}
        </span>
      )}
    </div>
  )
}

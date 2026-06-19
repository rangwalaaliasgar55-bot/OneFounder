/**
 * Page-specific skeleton loaders — match the final layout for instant perceived speed.
 */

export function SkeletonChatPage() {
  return (
    <div className="flex h-full animate-fade-in">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/[0.06] p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-10 rounded-lg" />
        ))}
      </div>
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`skeleton ${i % 2 === 0 ? 'w-48' : 'w-64'} h-16 rounded-2xl`} />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/[0.06]">
          <div className="skeleton h-12 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonListPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-48 rounded mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonKanbanPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-48 rounded mb-2" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton h-8 w-24 rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonTablePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-48 rounded mb-2" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      <div className="space-y-3">
        <div className="skeleton h-12 rounded-xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTabPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-48 rounded mb-2" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  )
}

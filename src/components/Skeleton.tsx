export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-slate-800/50 border border-white/10 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/10" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-white/10 rounded mb-2" />
          <div className="h-3 w-16 bg-white/5 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
      </div>
    </div>
  );
}

export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 ${width} bg-white/10 rounded animate-pulse`} />;
}

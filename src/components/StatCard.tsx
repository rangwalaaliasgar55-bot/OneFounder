import type { ReactNode } from 'react';

type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  tone?: Tone;
  trend?: string;
}

const toneClasses: Record<Tone, string> = {
  cyan: 'from-cyan-500/15 to-blue-600/10 border-cyan-500/20 text-cyan-300',
  emerald: 'from-emerald-500/15 to-teal-600/10 border-emerald-500/20 text-emerald-300',
  amber: 'from-amber-500/15 to-orange-600/10 border-amber-500/20 text-amber-300',
  rose: 'from-rose-500/15 to-pink-600/10 border-rose-500/20 text-rose-300',
  violet: 'from-violet-500/15 to-fuchsia-600/10 border-violet-500/20 text-violet-300',
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'cyan',
  trend,
}: StatCardProps) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${toneClasses[tone]} p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">{icon}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{subtitle}</p>
        {trend ? <span className="text-xs font-medium text-slate-300">{trend}</span> : null}
      </div>
    </div>
  );
}

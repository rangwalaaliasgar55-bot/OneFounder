import { Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { getRoleLabel } from '../lib/workspace';
import type { TeamMember } from '../types';

interface AuthScreenProps {
  members: TeamMember[];
  onSignIn: (memberId: string) => void;
}

export default function AuthScreen({ members, onSignIn }: AuthScreenProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-cyan-950/20">
            <div className="flex items-center gap-3 text-cyan-300">
              <div className="rounded-2xl bg-cyan-500/10 p-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-sm uppercase tracking-[0.28em]">OneFounder access</span>
            </div>
            <h1 className="mt-6 text-4xl font-semibold text-white">Sign in to your AI operating system</h1>
            <p className="mt-4 max-w-xl text-slate-400">
              This workspace now supports role-aware approvals, audit trails, snapshots, guided playbooks,
              and source-backed AI governance. Choose an operator below to enter the environment.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Governed workflows', icon: ShieldCheck },
                { label: 'Approval gates', icon: Lock },
                { label: 'Faster execution', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-sm text-slate-300">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Choose operator</p>
            <div className="mt-6 space-y-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSignIn(member.id)}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-cyan-500/30 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{member.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        {getRoleLabel(member.role)}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">{member.status}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

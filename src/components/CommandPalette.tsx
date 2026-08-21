import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export interface CommandAction {
  id: string;
  title: string;
  description: string;
  group: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  actions: CommandAction[];
  onClose: () => void;
}

export default function CommandPalette({ open, actions, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  const filteredActions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return actions;
    }

    return actions.filter((action) =>
      [action.title, action.description, action.group]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [actions, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/80 p-4 pt-20 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close command palette" />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-cyan-950/30">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Search className="h-5 w-5 text-cyan-300" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, workflows, and actions..."
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Esc
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3">
          {filteredActions.length ? (
            <div className="space-y-2">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    action.onSelect();
                    setQuery('');
                    onClose();
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-cyan-500/30 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{action.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{action.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {action.group}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
              No commands matched your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

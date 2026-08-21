export interface BackendReadiness {
  mode: 'local-only' | 'cloud-ready';
  supabaseConfigured: boolean;
  projectUrlPresent: boolean;
  anonKeyPresent: boolean;
  summary: string;
}

export function getBackendReadiness(): BackendReadiness {
  const projectUrlPresent = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const anonKeyPresent = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const supabaseConfigured = projectUrlPresent && anonKeyPresent;

  return {
    mode: supabaseConfigured ? 'cloud-ready' : 'local-only',
    supabaseConfigured,
    projectUrlPresent,
    anonKeyPresent,
    summary: supabaseConfigured
      ? 'Cloud sync environment variables are configured. The app can be wired to Supabase-backed persistence.'
      : 'Running in local-first mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud-ready configuration.',
  };
}

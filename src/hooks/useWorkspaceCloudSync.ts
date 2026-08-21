import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { createOptionalSupabaseClient } from '../lib/supabase';
import { normalizeWorkspaceData } from '../lib/workspace';
import type { WorkspaceData } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disabled';

interface UseWorkspaceCloudSyncOptions {
  workspace: WorkspaceData;
  setWorkspace: Dispatch<SetStateAction<WorkspaceData>>;
}

const TABLE_NAME = 'workspace_state';
const WORKSPACE_KEY = 'default';

export function useWorkspaceCloudSync({
  workspace,
  setWorkspace,
}: UseWorkspaceCloudSyncOptions) {
  const client = useMemo(() => createOptionalSupabaseClient(), []);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(client ? 'idle' : 'disabled');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const hasPulledRef = useRef(false);
  const skipNextPushRef = useRef(false);

  const pullFromCloud = useCallback(async () => {
    if (!client) {
      setSyncStatus('disabled');
      return;
    }

    try {
      setSyncStatus('syncing');
      const { data, error } = await client
        .from(TABLE_NAME)
        .select('payload, updated_at')
        .eq('workspace_key', WORKSPACE_KEY)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data?.payload) {
        skipNextPushRef.current = true;
        setWorkspace(normalizeWorkspaceData(data.payload));
        setLastSyncedAt(data.updated_at ?? new Date().toISOString());
      }

      setSyncStatus('synced');
      hasPulledRef.current = true;
    } catch {
      setSyncStatus('error');
    }
  }, [client, setWorkspace]);

  const pushToCloud = useCallback(async (payload: WorkspaceData) => {
    if (!client) {
      setSyncStatus('disabled');
      return;
    }

    try {
      setSyncStatus('syncing');
      const { error } = await client.from(TABLE_NAME).upsert(
        {
          workspace_key: WORKSPACE_KEY,
          payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_key' }
      );

      if (error) {
        throw error;
      }

      setLastSyncedAt(new Date().toISOString());
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [client]);

  useEffect(() => {
    if (!client || hasPulledRef.current) {
      return;
    }

    void pullFromCloud();
  }, [client, pullFromCloud]);

  useEffect(() => {
    if (!client || !hasPulledRef.current) {
      return;
    }

    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      void pushToCloud(workspace);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [client, pushToCloud, workspace]);

  return {
    cloudAvailable: Boolean(client),
    syncStatus,
    lastSyncedAt,
    pullFromCloud,
    pushToCloud: () => pushToCloud(workspace),
  };
}

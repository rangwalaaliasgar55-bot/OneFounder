import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { createOptionalSupabaseClient } from '../lib/supabase';
import { normalizeWorkspaceData } from '../lib/workspace';
import type { SyncConflict, WorkspaceData } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disabled';

interface UseWorkspaceCloudSyncOptions {
  workspace: WorkspaceData;
  workspaceKey: string;
  setWorkspace: Dispatch<SetStateAction<WorkspaceData>>;
}

const TABLE_NAME = 'workspace_state';

export function useWorkspaceCloudSync({
  workspace,
  workspaceKey,
  setWorkspace,
}: UseWorkspaceCloudSyncOptions) {
  const client = useMemo(() => createOptionalSupabaseClient(), []);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(client ? 'idle' : 'disabled');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncConflict, setSyncConflict] = useState<SyncConflict | null>(null);
  const hasPulledRef = useRef(false);
  const skipNextPushRef = useRef(false);
  const lastSyncedPayloadRef = useRef<string | null>(null);

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
        .eq('workspace_key', workspaceKey)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data?.payload) {
        const remoteWorkspace = normalizeWorkspaceData(data.payload);
        const remoteSerialized = JSON.stringify(remoteWorkspace);
        const localSerialized = JSON.stringify(workspace);
        const lastSyncedSerialized = lastSyncedPayloadRef.current;
        const localHasUnsyncedChanges =
          hasPulledRef.current &&
          lastSyncedSerialized !== null &&
          localSerialized !== lastSyncedSerialized;
        const remoteDiffersFromLocal = remoteSerialized !== localSerialized;

        if (localHasUnsyncedChanges && remoteDiffersFromLocal) {
          setSyncConflict({
            detectedAt: new Date().toISOString(),
            remoteUpdatedAt: data.updated_at ?? null,
            remoteProfileId: workspaceKey,
            remoteWorkspace,
          });
          setSyncStatus('error');
          return;
        }

        skipNextPushRef.current = true;
        setWorkspace(remoteWorkspace);
        lastSyncedPayloadRef.current = remoteSerialized;
        setLastSyncedAt(data.updated_at ?? new Date().toISOString());
        setSyncConflict(null);
      }

      setSyncStatus('synced');
      hasPulledRef.current = true;
    } catch {
      setSyncStatus('error');
    }
  }, [client, setWorkspace, workspace, workspaceKey]);

  const pushToCloud = useCallback(
    async (payload: WorkspaceData) => {
      if (!client) {
        setSyncStatus('disabled');
        return;
      }

      try {
        setSyncStatus('syncing');
        const { error } = await client.from(TABLE_NAME).upsert(
          {
            workspace_key: workspaceKey,
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'workspace_key' }
        );

        if (error) {
          throw error;
        }

        lastSyncedPayloadRef.current = JSON.stringify(payload);
        setLastSyncedAt(new Date().toISOString());
        setSyncConflict(null);
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    },
    [client, workspaceKey]
  );

  const acceptRemoteConflict = useCallback(() => {
    if (!syncConflict) {
      return;
    }

    skipNextPushRef.current = true;
    setWorkspace(syncConflict.remoteWorkspace);
    lastSyncedPayloadRef.current = JSON.stringify(syncConflict.remoteWorkspace);
    setLastSyncedAt(syncConflict.remoteUpdatedAt ?? new Date().toISOString());
    setSyncConflict(null);
    setSyncStatus('synced');
  }, [setWorkspace, syncConflict]);

  const keepLocalConflictVersion = useCallback(async () => {
    setSyncConflict(null);
    await pushToCloud(workspace);
  }, [pushToCloud, workspace]);

  useEffect(() => {
    hasPulledRef.current = false;
    lastSyncedPayloadRef.current = null;
    setSyncConflict(null);
    setLastSyncedAt(null);
    setSyncStatus(client ? 'idle' : 'disabled');
  }, [client, workspaceKey]);

  useEffect(() => {
    if (!client || hasPulledRef.current) {
      return;
    }

    void pullFromCloud();
  }, [client, pullFromCloud]);

  useEffect(() => {
    if (!client || !hasPulledRef.current || syncConflict) {
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
  }, [client, pushToCloud, syncConflict, workspace]);

  return {
    cloudAvailable: Boolean(client),
    syncStatus,
    lastSyncedAt,
    syncConflict,
    pullFromCloud,
    pushToCloud: () => pushToCloud(workspace),
    acceptRemoteConflict,
    keepLocalConflictVersion,
  };
}

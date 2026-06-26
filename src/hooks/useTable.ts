import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTable<T extends { id: string }>(
  tableName: string,
  initialData: T[],
) {
  const [rows, setRows] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    setLoading(true);
    supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRows(data as T[]);
      })
      .finally(() => setLoading(false));
  }, [tableName]);

  const addRow = useCallback(
    async (row: Omit<T, 'id'>) => {
      const newId = crypto.randomUUID();
      const newRow = { ...row, id: newId } as T;
      setRows((prev) => [newRow, ...prev]);
      if (supabase) {
        await supabase.from(tableName).insert(newRow);
      }
      return newRow;
    },
    [tableName],
  );

  const updateRow = useCallback(
    async (id: string, patch: Partial<T>) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? ({ ...r, ...patch } as T) : r)),
      );
      if (supabase) {
        await supabase.from(tableName).update(patch).eq('id', id);
      }
    },
    [tableName],
  );

  const deleteRow = useCallback(
    async (id: string) => {
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (supabase) {
        await supabase.from(tableName).delete().eq('id', id);
      }
    },
    [tableName],
  );

  return { rows, setRows, loading, addRow, updateRow, deleteRow };
}

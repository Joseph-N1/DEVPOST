/**
 * Snapshot Service
 * Manages file version history (snapshots)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export interface Snapshot {
  id: string;
  file_id: string;
  content: string;
  created_by: string;
  message?: string;
  created_at: string;
}

/**
 * Create a snapshot of a file's current state
 */
export async function createSnapshot(
  fileId: string,
  userId: string,
  content: string,
  message?: string
): Promise<Snapshot | null> {
  const { data, error } = await supabase
    .from('snapshots')
    .insert({
      file_id: fileId,
      content,
      created_by: userId,
      message: message || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Failed to create snapshot:', error);
    return null;
  }

  return data as Snapshot;
}

/**
 * Get snapshots for a file
 */
export async function getSnapshots(
  fileId: string,
  limit: number = 50
): Promise<Snapshot[]> {
  const { data, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get snapshots:', error);
    return [];
  }

  return data as Snapshot[];
}

/**
 * Get a specific snapshot
 */
export async function getSnapshot(snapshotId: string): Promise<Snapshot | null> {
  const { data, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (error) {
    console.error('Failed to get snapshot:', error);
    return null;
  }

  return data as Snapshot;
}

/**
 * Delete old snapshots (keep last N)
 */
export async function pruneSnapshots(
  fileId: string,
  keepCount: number = 100
): Promise<number> {
  // Get all snapshots ordered by creation date
  const { data: snapshots, error: fetchError } = await supabase
    .from('snapshots')
    .select('id')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false });

  if (fetchError || !snapshots) {
    console.error('Failed to fetch snapshots for pruning:', fetchError);
    return 0;
  }

  if (snapshots.length <= keepCount) {
    return 0;
  }

  // Get IDs of snapshots to delete
  const toDelete = snapshots.slice(keepCount).map((s: { id: string }) => s.id);

  const { error: deleteError } = await supabase
    .from('snapshots')
    .delete()
    .in('id', toDelete);

  if (deleteError) {
    console.error('Failed to delete old snapshots:', deleteError);
    return 0;
  }

  return toDelete.length;
}

/**
 * Create auto-snapshot on significant changes
 * (Called periodically or on certain events)
 */
export async function autoSnapshot(
  fileId: string,
  userId: string,
  newContent: string,
  previousContent: string | null
): Promise<Snapshot | null> {
  // Skip if content hasn't changed significantly
  if (previousContent === newContent) {
    return null;
  }

  // Skip if content is very similar (less than 5% change)
  if (previousContent) {
    const changeRatio = Math.abs(newContent.length - previousContent.length) / 
                        Math.max(newContent.length, previousContent.length, 1);
    if (changeRatio < 0.05 && newContent.length < 10000) {
      return null;
    }
  }

  return createSnapshot(fileId, userId, newContent, 'Auto-save');
}

/**
 * Restore file content from a snapshot
 */
export async function restoreSnapshot(
  snapshotId: string,
  userId: string
): Promise<{ success: boolean; fileId?: string; content?: string; error?: string }> {
  // Get the snapshot
  const snapshot = await getSnapshot(snapshotId);
  if (!snapshot) {
    return { success: false, error: 'Snapshot not found' };
  }

  // Create a snapshot of current state before restoring
  const { data: currentFile } = await supabase
    .from('files')
    .select('content')
    .eq('id', snapshot.file_id)
    .single();

  if (currentFile) {
    await createSnapshot(
      snapshot.file_id,
      userId,
      (currentFile as { content: string }).content,
      `Before restore to ${snapshotId.slice(0, 8)}`
    );
  }

  // Update file with snapshot content
  const { error: updateError } = await (supabase
    .from('files') as any)
    .update({ 
      content: snapshot.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', snapshot.file_id);

  if (updateError) {
    return { success: false, error: 'Failed to restore snapshot' };
  }

  return { 
    success: true, 
    fileId: snapshot.file_id, 
    content: snapshot.content 
  };
}

/**
 * Compare two snapshots
 */
export function compareSnapshots(
  snapshot1: Snapshot,
  snapshot2: Snapshot
): { added: number; removed: number; changed: boolean } {
  const lines1 = snapshot1.content.split('\n');
  const lines2 = snapshot2.content.split('\n');

  // Simple line-based comparison
  const set1 = new Set(lines1);
  const set2 = new Set(lines2);

  let added = 0;
  let removed = 0;

  for (const line of lines2) {
    if (!set1.has(line)) added++;
  }

  for (const line of lines1) {
    if (!set2.has(line)) removed++;
  }

  return {
    added,
    removed,
    changed: added > 0 || removed > 0,
  };
}

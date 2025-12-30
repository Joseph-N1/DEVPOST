import { describe, it, expect } from 'vitest';
import { compareSnapshots } from './snapshots';

describe('Snapshots Library', () => {
  describe('compareSnapshots', () => {
    it('should identify identical snapshots', () => {
      const snapshot1 = {
        id: '1',
        file_id: 'file-1',
        content: 'Hello World',
        message: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
      };
      const snapshot2 = { ...snapshot1, id: '2' };

      const diff = compareSnapshots(snapshot1, snapshot2);
      
      expect(diff.added).toBe(0);
      expect(diff.removed).toBe(0);
      expect(diff.changed).toBe(false);
    });

    it('should detect added lines', () => {
      const snapshot1 = {
        id: '1',
        file_id: 'file-1',
        content: 'Line 1',
        message: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
      };
      const snapshot2 = {
        id: '2',
        file_id: 'file-1',
        content: 'Line 1\nLine 2\nLine 3',
        message: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
      };

      const diff = compareSnapshots(snapshot1, snapshot2);
      
      expect(diff.added).toBe(2);
      expect(diff.removed).toBe(0);
      expect(diff.changed).toBe(true);
    });

    it('should detect removed lines', () => {
      const snapshot1 = {
        id: '1',
        file_id: 'file-1',
        content: 'Line 1\nLine 2\nLine 3',
        message: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
      };
      const snapshot2 = {
        id: '2',
        file_id: 'file-1',
        content: 'Line 1',
        message: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
      };

      const diff = compareSnapshots(snapshot1, snapshot2);
      
      expect(diff.added).toBe(0);
      expect(diff.removed).toBe(2);
      expect(diff.changed).toBe(true);
    });

    it('should detect changes when content differs', () => {
      const snapshot1 = {
        id: '1',
        file_id: 'file-1',
        content: 'Hello World',
        message: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
      };
      const snapshot2 = {
        id: '2',
        file_id: 'file-1',
        content: 'Hello Universe',
        message: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
      };

      const diff = compareSnapshots(snapshot1, snapshot2);
      
      // Different line counts as 1 removed and 1 added
      expect(diff.added).toBe(1);
      expect(diff.removed).toBe(1);
      expect(diff.changed).toBe(true);
    });
  });
});

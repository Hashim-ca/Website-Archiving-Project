import { useMemo } from 'react';
import { Snapshot, SnapshotStatus, isCompletedStatus, isFailedStatus, isProcessingStatus } from '@/types';

interface UseSnapshotStatusResult {
  getStatusVariant: (status: SnapshotStatus) => 'default' | 'secondary' | 'destructive' | 'outline';
  getStatusColor: (status: SnapshotStatus) => string;
  getStatusLabel: (status: SnapshotStatus) => string;
  isCompleted: (status: SnapshotStatus) => boolean;
  isFailed: (status: SnapshotStatus) => boolean;
  isProcessing: (status: SnapshotStatus) => boolean;
  canView: (snapshot: Snapshot) => boolean;
  getCompletedCount: (snapshots: Snapshot[]) => number;
  getFailedCount: (snapshots: Snapshot[]) => number;
  getProcessingCount: (snapshots: Snapshot[]) => number;
  getTotalCount: (snapshots: Snapshot[]) => number;
  getStatusSummary: (snapshots: Snapshot[]) => {
    completed: number;
    failed: number;
    processing: number;
    total: number;
  };
}

export const useSnapshotStatus = (): UseSnapshotStatusResult => {
  const getStatusVariant = useMemo(() => (status: SnapshotStatus) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'failed':
        return 'destructive' as const;
      case 'processing':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  }, []);

  const getStatusColor = useMemo(() => (status: SnapshotStatus) => {
    switch (status) {
      case 'completed':
        return '#2B806B'; // Primary green
      case 'failed':
        return '#875B4E'; // Brown for errors
      case 'processing':
        return '#DADA5B'; // Yellow for processing
      default:
        return '#7E8381'; // Muted gray
    }
  }, []);

  const getStatusLabel = useMemo(() => (status: SnapshotStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
      default:
        return 'Unknown';
    }
  }, []);

  const canView = useMemo(() => (snapshot: Snapshot) => {
    return isCompletedStatus(snapshot.status);
  }, []);

  const getCompletedCount = useMemo(() => (snapshots: Snapshot[]) => {
    return snapshots.filter(s => isCompletedStatus(s.status)).length;
  }, []);

  const getFailedCount = useMemo(() => (snapshots: Snapshot[]) => {
    return snapshots.filter(s => isFailedStatus(s.status)).length;
  }, []);

  const getProcessingCount = useMemo(() => (snapshots: Snapshot[]) => {
    return snapshots.filter(s => isProcessingStatus(s.status)).length;
  }, []);

  const getTotalCount = useMemo(() => (snapshots: Snapshot[]) => {
    return snapshots.length;
  }, []);

  const getStatusSummary = useMemo(() => (snapshots: Snapshot[]) => {
    return {
      completed: getCompletedCount(snapshots),
      failed: getFailedCount(snapshots),
      processing: getProcessingCount(snapshots),
      total: getTotalCount(snapshots),
    };
  }, [getCompletedCount, getFailedCount, getProcessingCount, getTotalCount]);

  return {
    getStatusVariant,
    getStatusColor,
    getStatusLabel,
    isCompleted: isCompletedStatus,
    isFailed: isFailedStatus,
    isProcessing: isProcessingStatus,
    canView,
    getCompletedCount,
    getFailedCount,
    getProcessingCount,
    getTotalCount,
    getStatusSummary,
  };
};
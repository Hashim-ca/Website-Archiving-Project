import { useCallback } from 'react';
import { getViewUrl } from '@/lib/api';

interface UseViewContentResult {
  getContentUrl: (snapshotId: string, filePath?: string) => string;
  openContent: (snapshotId: string, filePath?: string) => void;
  downloadContent: (snapshotId: string, filePath?: string) => Promise<void>;
}

export const useViewContent = (): UseViewContentResult => {
  const getContentUrl = useCallback((snapshotId: string, filePath?: string): string => {
    return getViewUrl(snapshotId, filePath);
  }, []);

  const openContent = useCallback((snapshotId: string, filePath?: string): void => {
    const url = getViewUrl(snapshotId, filePath);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const downloadContent = useCallback(async (snapshotId: string, filePath?: string): Promise<void> => {
    try {
      const url = getViewUrl(snapshotId, filePath);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download content: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Extract filename from filePath or use default
      const filename = filePath ? filePath.split('/').pop() || 'download' : 'index.html';
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }, []);

  return {
    getContentUrl,
    openContent,
    downloadContent,
  };
};
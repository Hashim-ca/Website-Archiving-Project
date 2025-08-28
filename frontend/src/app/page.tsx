'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar, ActiveJobs } from '@/components/shared';
import { useArchive, useUrlValidation, useActiveJobs } from '@/hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { extractDomain } = useUrlValidation();
  const archive = useArchive();
  const { addJob } = useActiveJobs();

  const handleSearch = async (url: string) => {
    const domain = extractDomain(url);
    if (!domain) {
      setError('Invalid URL format');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create archive job
      const result = await archive.createArchiveJob(url);
      if (result) {
        // Add job to active jobs tracking
        addJob(result.jobId, url, domain);
        
        // Navigate to domain page to show details
        router.push(`/domain/${encodeURIComponent(domain)}`);
      } else {
        setError(archive.error || 'Failed to create archive job');
      }
    } catch (error) {
      console.error('Archive creation error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: '#EBEBD3' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 
            className="text-5xl font-bold mb-4"
            style={{ color: '#2B806B' }}
          >
            Website Archive
          </h1>
          <p 
            className="text-xl mb-8"
            style={{ color: '#7E8381' }}
          >
            Archive and view snapshots of any website instantly
          </p>
          
          {/* Search Bar - Clean and prominent */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isCreating}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="max-w-2xl mx-auto mb-8 border-2" style={{ backgroundColor: 'white', borderColor: '#875B4E' }}>
            <CardContent className="pt-6">
              <Alert style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                <AlertDescription style={{ color: '#875B4E' }}>
                  <strong>Error:</strong> {error}
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#2B806B',
                    color: '#2B806B'
                  }}
                >
                  Dismiss
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Jobs */}
        <ActiveJobs className="max-w-4xl mx-auto" />
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { EnhancedSearchBar } from '@/components/shared';
import { EnhancedActiveJobs } from '@/components/EnhancedActiveJobs';
import { useEnhancedArchive } from '@/hooks/useEnhancedArchive';
import { useSearchStore } from '@/stores/searchStore';
import { useJobPolling } from '@/hooks/useJobPolling';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Archive, AlertTriangle, CheckCircle } from 'lucide-react';

function HomeContent() {
  const [success, setSuccess] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  const { createArchiveJob, isLoading, error } = useEnhancedArchive();
  const { setCurrentQuery } = useSearchStore();
  
  // Initialize search from URL query parameter
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setCurrentQuery(queryParam);
    }
  }, [searchParams, setCurrentQuery]);
  
  // Start job polling
  useJobPolling();

  const handleSearch = async (url: string) => {
    const result = await createArchiveJob(url);
    if (result) {
      setSuccess(`Archive job created! Track progress below.`);
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: '#EBEBD3' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
              <Archive className="w-10 h-10" style={{ color: '#2B806B' }} />
            </div>
            <h1 
              className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent"
              style={{ color: '#2B806B' }}
            >
              Website Archive
            </h1>
            <p 
              className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed"
              style={{ color: '#7E8381' }}
            >
              Capture and preserve complete website snapshots with all assets, 
              styles, and functionality intact
            </p>
          </div>
          
          {/* Search Bar - Clean and prominent */}
          <div className="max-w-2xl mx-auto">
            <EnhancedSearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              autoFocus={!searchParams.get('q')}
            />
          </div>
          
          {/* Quick stats or features */}
          <div className="flex items-center justify-center space-x-8 mt-8 text-sm" style={{ color: '#7E8381' }}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2B806B' }} />
              <span>Complete HTML capture</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2B806B' }} />
              <span>Asset preservation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2B806B' }} />
              <span>Instant viewing</span>
            </div>
          </div>
        </div>

        {/* Success Display */}
        {success && (
          <Card 
            className="max-w-2xl mx-auto mb-8 border-2 shadow-lg animate-scale-in" 
            style={{ backgroundColor: 'white', borderColor: '#2B806B' }}
          >
            <CardContent className="pt-6">
              <Alert style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: '#2B806B' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" style={{ color: '#2B806B' }}>Archive Started</h3>
                    <AlertDescription className="leading-relaxed" style={{ color: '#2B806B' }}>
                      {success}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setSuccess(null)}
                  className="px-6 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md"
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

        {/* Error Display */}
        {error && (
          <Card 
            className="max-w-2xl mx-auto mb-8 border-2 shadow-lg animate-scale-in" 
            style={{ backgroundColor: 'white', borderColor: '#875B4E' }}
          >
            <CardContent className="pt-6">
              <Alert style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(135, 91, 78, 0.1)' }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: '#875B4E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" style={{ color: '#875B4E' }}>Archive Error</h3>
                    <AlertDescription className="leading-relaxed" style={{ color: '#875B4E' }}>
                      {error}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {/* Error is managed by enhanced archive hook */}}
                  className="px-6 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md"
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

        {/* Enhanced Active Jobs */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <EnhancedActiveJobs className="max-w-4xl mx-auto" maxVisible={8} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}


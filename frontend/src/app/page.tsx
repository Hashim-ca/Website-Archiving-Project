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
      style={{ backgroundColor: '#F8F6F0' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 shadow-sm" style={{ backgroundColor: 'rgba(27, 77, 62, 0.1)' }}>
              <Archive className="w-12 h-12" style={{ color: '#1B4D3E' }} />
            </div>
            <h1 
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
              style={{ color: '#1B4D3E' }}
            >
              Website Archive
            </h1>
            <p 
              className="text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed font-medium px-4"
              style={{ color: '#5A5A5A' }}
            >
              Capture and preserve complete website snapshots with all assets, 
              styles, and functionality intact for long-term accessibility
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
          <div className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-8 gap-y-4 mt-10 text-sm md:text-base font-medium px-4" style={{ color: '#5A5A5A' }}>
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#1B4D3E' }} />
              <span>Complete HTML capture</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#1B4D3E' }} />
              <span>Asset preservation</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#1B4D3E' }} />
              <span>Instant viewing</span>
            </div>
          </div>
        </div>

        {/* Success Display */}
        {success && (
          <Card 
            className="max-w-2xl mx-auto mb-10 border-2 shadow-lg animate-scale-in" 
            style={{ backgroundColor: 'white', borderColor: '#1B4D3E' }}
          >
            <CardContent className="pt-6">
              <Alert style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(27, 77, 62, 0.1)' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: '#1B4D3E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>Archive Started</h3>
                    <AlertDescription className="leading-relaxed" style={{ color: '#1B4D3E' }}>
                      {success}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setSuccess(null)}
                  className="px-6 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#1B4D3E',
                    color: '#1B4D3E'
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
            className="max-w-2xl mx-auto mb-10 border-2 shadow-lg animate-scale-in" 
            style={{ backgroundColor: 'white', borderColor: '#B85450' }}
          >
            <CardContent className="pt-6">
              <Alert style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(184, 84, 80, 0.1)' }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: '#B85450' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" style={{ color: '#B85450' }}>Archive Error</h3>
                    <AlertDescription className="leading-relaxed" style={{ color: '#B85450' }}>
                      {error}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {/* Error is managed by enhanced archive hook */}}
                  className="px-6 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#1B4D3E',
                    color: '#1B4D3E'
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


'use client';

import React, { useState } from 'react';
import { SearchBar, LoadingSpinner, WebsiteResults, RecommendedPages } from '@/components/shared';
import { useArchive, useWebsiteQuery, useSitePageSuggestionsQuery, useUrlValidation } from '@/hooks';
import { GetWebsiteResponse, SitePageSuggestionsResponse } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AppState = 'search' | 'creating' | 'results' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('search');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [websiteData, setWebsiteData] = useState<GetWebsiteResponse | null>(null);
  const [suggestions, setSuggestions] = useState<SitePageSuggestionsResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  
  const { extractDomain } = useUrlValidation();
  const archive = useArchive();
  const websiteQuery = useWebsiteQuery();
  const suggestionsQuery = useSitePageSuggestionsQuery();

  const handleSearch = async (url: string) => {
    const domain = extractDomain(url);
    if (!domain) return;

    setCurrentDomain(domain);
    setState('creating');
    setIsLoadingData(true);

    try {
      // Step 1: Create archive job
      const archiveResult = await archive.createArchiveJob(url);
      if (!archiveResult) {
        setState('error');
        setIsLoadingData(false);
        return;
      }

      // Step 2: Immediately check for existing data (no fake delay)
      const [websiteResult, suggestionsResult] = await Promise.all([
        websiteQuery.queryWebsite(domain),
        suggestionsQuery.querySuggestions(domain)
      ]);

      if (websiteResult) {
        setWebsiteData(websiteResult);
      }

      if (suggestionsResult) {
        setSuggestions(suggestionsResult);
      }

      setState('results');
    } catch (error) {
      console.error('Search error:', error);
      setState('error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleNewSearch = () => {
    setState('search');
    setCurrentDomain('');
    setWebsiteData(null);
    setSuggestions(null);
    setIsLoadingData(false);
    archive.reset();
    websiteQuery.reset();
    suggestionsQuery.reset();
  };

  const handlePageArchive = async (url: string) => {
    console.log('Archived page:', url);
    // Refresh data after archiving a new page
    if (currentDomain) {
      const [websiteResult, suggestionsResult] = await Promise.all([
        websiteQuery.queryWebsite(currentDomain),
        suggestionsQuery.querySuggestions(currentDomain)
      ]);
      
      if (websiteResult) {
        setWebsiteData(websiteResult);
      }
      
      if (suggestionsResult) {
        setSuggestions(suggestionsResult);
      }
    }
  };

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: '#EBEBD3' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-4xl font-bold mb-3"
            style={{ color: '#2B806B' }}
          >
            Website Archive
          </h1>
          <p 
            className="text-lg mb-6"
            style={{ color: '#7E8381' }}
          >
            Archive and view snapshots of any website instantly
          </p>
          
          {/* Search Bar - Always prominent */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              isLoading={state === 'creating' || isLoadingData}
            />
          </div>
        </div>

        {/* Status and Results */}
        <div className="space-y-6">
          {/* Creating Archive Job Status */}
          {state === 'creating' && (
            <Card className="max-w-2xl mx-auto" style={{ backgroundColor: 'white' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-3">
                  <LoadingSpinner size="sm" />
                  <div>
                    <p className="font-medium" style={{ color: '#2B806B' }}>
                      Archive job created successfully!
                    </p>
                    <p className="text-sm" style={{ color: '#7E8381' }}>
                      {isLoadingData ? 'Checking for existing archives...' : 'Ready to check archives'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {state === 'error' && (
            <Card className="max-w-2xl mx-auto border-2" style={{ backgroundColor: 'white', borderColor: '#875B4E' }}>
              <CardContent className="pt-6">
                <Alert style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                  <AlertDescription style={{ color: '#875B4E' }}>
                    <strong>Error:</strong> {archive.error || websiteQuery.error || suggestionsQuery.error || 'An error occurred while processing your request.'}
                  </AlertDescription>
                </Alert>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleNewSearch}
                    className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#2B806B',
                      color: '#2B806B'
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Layout */}
          {state === 'results' && (
            <div className="space-y-6">
              {/* Current Domain Header */}
              {currentDomain && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                    <h2 className="text-xl font-semibold" style={{ color: '#2B806B' }}>
                      Results for: {currentDomain}
                    </h2>
                    <Badge variant="outline" style={{ borderColor: '#2B806B', color: '#2B806B' }}>
                      {websiteData ? `${websiteData.snapshots.length} snapshots` : 'New domain'}
                    </Badge>
                    <button
                      onClick={handleNewSearch}
                      className="ml-4 px-3 py-1 text-xs font-medium rounded border transition-colors"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: '#7E8381',
                        color: '#7E8381'
                      }}
                    >
                      New Search
                    </button>
                  </div>
                </div>
              )}

              {/* Main Results Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Website Archives */}
                <div className="space-y-4">
                  {websiteData ? (
                    <WebsiteResults website={websiteData} />
                  ) : (
                    <Card style={{ backgroundColor: 'white' }}>
                      <CardHeader>
                        <CardTitle className="text-lg" style={{ color: '#2B806B' }}>
                          📂 Domain Archives
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="mb-4">
                            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#EBEBD3' }}>
                              <span className="text-2xl">📁</span>
                            </div>
                          </div>
                          <p className="font-medium mb-2" style={{ color: '#2B806B' }}>
                            No archives yet for {currentDomain}
                          </p>
                          <p className="text-sm" style={{ color: '#7E8381' }}>
                            Your archive job is being processed. Check back in a few moments, or archive specific pages below.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Page Suggestions */}
                <div className="space-y-4">
                  {suggestions ? (
                    <RecommendedPages 
                      suggestions={suggestions}
                      onPageArchive={handlePageArchive}
                    />
                  ) : (
                    <Card style={{ backgroundColor: 'white' }}>
                      <CardHeader>
                        <CardTitle className="text-lg" style={{ color: '#2B806B' }}>
                          🔍 Suggested Pages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="mb-4">
                            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#EBEBD3' }}>
                              <span className="text-2xl">🔍</span>
                            </div>
                          </div>
                          <p className="font-medium mb-2" style={{ color: '#2B806B' }}>
                            No page suggestions found
                          </p>
                          <p className="text-sm" style={{ color: '#7E8381' }}>
                            We couldn&apos;t find additional pages to suggest for {currentDomain}.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


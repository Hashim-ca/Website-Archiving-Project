'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SearchBar, WebsiteResults, RecommendedPages, LoadingSpinner } from '@/components/shared';
import { useWebsiteQuery, useSitePageSuggestionsQuery, useUrlValidation, useArchive, useActiveJobs } from '@/hooks';
import { GetWebsiteResponse, SitePageSuggestionsResponse } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';

export default function DomainPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain as string);
  
  const [websiteData, setWebsiteData] = useState<GetWebsiteResponse | null>(null);
  const [suggestions, setSuggestions] = useState<SitePageSuggestionsResponse | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { extractDomain } = useUrlValidation();
  const websiteQuery = useWebsiteQuery();
  const suggestionsQuery = useSitePageSuggestionsQuery();
  const archive = useArchive();
  const { addJob, activeJobs } = useActiveJobs();

  // Find active job for this domain
  const activeJob = activeJobs.find(job => job.domain === domain);
  
  // Define refresh function
  const handleRefresh = async () => {
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
  };

  // Track when jobs complete to refresh data
  const [lastJobStatus, setLastJobStatus] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeJob?.status) {
      const currentStatus = activeJob.status.status;
      
      // If job just completed (changed from processing to completed), refresh data
      if (lastJobStatus === 'processing' && currentStatus === 'completed') {
        handleRefresh();
      }
      
      setLastJobStatus(currentStatus);
    }
  }, [activeJob?.status?.status]); // Only depend on status changes

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoad(true);
      setError(null);

      try {
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
      } catch (error) {
        console.error('Failed to load domain data:', error);
        setError('Failed to load domain information');
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (domain) {
      loadData();
    }
  }, [domain]); // Only depend on domain, not the hook objects

  const handleNewArchive = async (url: string) => {
    const urlDomain = extractDomain(url);
    if (urlDomain !== domain) {
      // Navigate to the new domain if different
      router.push(`/domain/${encodeURIComponent(urlDomain!)}`);
      return;
    }

    try {
      const result = await archive.createArchiveJob(url);
      if (result) {
        addJob(result.jobId, url, domain);
        // No need to refresh immediately - active jobs will track progress
      } else {
        setError(archive.error || 'Failed to create archive job');
      }
    } catch (error) {
      console.error('Archive creation error:', error);
      setError('Failed to create archive job');
    }
  };

  const handlePageArchive = async (url: string) => {
    await handleNewArchive(url);
  };

  if (isInitialLoad) {
    return (
      <div 
        className="min-h-screen p-6"
        style={{ backgroundColor: '#EBEBD3' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-lg" style={{ color: '#2B806B' }}>
                Loading domain information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: '#EBEBD3' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                style={{ borderColor: '#2B806B', color: '#2B806B' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Search</span>
              </Button>
            </Link>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={websiteQuery.isLoading || suggestionsQuery.isLoading}
              className="flex items-center space-x-2"
              style={{ borderColor: '#2B806B', color: '#2B806B' }}
            >
              <RefreshCw className={`w-4 h-4 ${(websiteQuery.isLoading || suggestionsQuery.isLoading) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Domain Header */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-4 px-8 py-4 rounded-lg" style={{ backgroundColor: 'white' }}>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#2B806B' }}>
                  {domain}
                </h1>
                <div className="flex items-center justify-center space-x-3 mt-2">
                  <Badge variant="outline" style={{ borderColor: '#2B806B', color: '#2B806B' }}>
                    {websiteData ? `${websiteData.snapshots.length} snapshots` : 'No snapshots yet'}
                  </Badge>
                  {activeJob && (
                    <Badge variant="outline" style={{ borderColor: '#DADA5B', color: '#DADA5B' }}>
                      Archive in progress
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Archive Bar */}
          <div className="max-w-2xl mx-auto mt-6">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <SearchBar
                  onSearch={handleNewArchive}
                  isLoading={archive.isLoading}
                  placeholder={`Archive another page from ${domain}...`}
                />
              </div>
            </div>
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Website Archives */}
          <div className="space-y-6">
            {websiteData ? (
              <WebsiteResults website={websiteData} />
            ) : (
              <Card style={{ backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2" style={{ color: '#2B806B' }}>
                    <span>📂</span>
                    <span>Domain Archives</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#EBEBD3' }}>
                        <span className="text-3xl">📁</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#2B806B' }}>
                      No archives yet for {domain}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#7E8381' }}>
                      {activeJob 
                        ? 'Your archive job is being processed. Check back in a few moments.'
                        : 'Start by archiving a page from this domain using the search bar above.'
                      }
                    </p>
                    {activeJob && activeJob.status && (
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#EBEBD3' }}>
                        <p className="text-sm font-medium" style={{ color: '#2B806B' }}>
                          Job Status: {activeJob.status.status}
                        </p>
                        {activeJob.status.status === 'processing' && (
                          <div className="mt-2">
                            <div className="w-full bg-white rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300 animate-pulse"
                                style={{ 
                                  backgroundColor: '#DADA5B',
                                  width: '60%'
                                }}
                              />
                            </div>
                            <p className="text-xs mt-1" style={{ color: '#7E8381' }}>
                              Processing in progress...
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Page Suggestions */}
          <div className="space-y-6">
            {suggestions ? (
              <RecommendedPages 
                suggestions={suggestions}
                onPageArchive={handlePageArchive}
              />
            ) : (
              <Card style={{ backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2" style={{ color: '#2B806B' }}>
                    <span>🔍</span>
                    <span>Suggested Pages</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#EBEBD3' }}>
                        <span className="text-3xl">🔍</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#2B806B' }}>
                      No page suggestions found
                    </h3>
                    <p className="text-sm" style={{ color: '#7E8381' }}>
                      We couldn't find additional pages to suggest for {domain}.
                      Try archiving the main page first to discover more content.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

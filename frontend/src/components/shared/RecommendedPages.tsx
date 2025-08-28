import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SitePageSuggestionsResponse } from '@/types';
import { useEnhancedArchive } from '@/hooks';
import { truncateText } from '@/utils';
import { cn } from '@/lib/utils';

interface RecommendedPagesProps {
  suggestions: SitePageSuggestionsResponse;
  onPageArchive?: (url: string) => void;
  className?: string;
}

export const RecommendedPages: React.FC<RecommendedPagesProps> = ({
  suggestions,
  onPageArchive,
  className
}) => {
  const { createArchiveJob, isLoading: isArchiving } = useEnhancedArchive();

  const handleArchivePage = async (url: string) => {
    const result = await createArchiveJob(url);
    if (result && onPageArchive) {
      onPageArchive(url);
    }
  };

  if (suggestions.suggestions.length === 0) {
    return (
      <Card className={cn('w-full', className)} style={{ backgroundColor: '#eeefd3' }}>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription style={{ color: '#5A5A5A' }}>
              No page suggestions found for {suggestions.domain}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full shadow-lg border-0', className)} style={{ backgroundColor: 'white' }}>
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold mb-3" style={{ color: '#1B4D3E' }}>
          Recommended Pages to Archive
        </CardTitle>
        <p className="text-sm font-medium" style={{ color: '#5A5A5A' }}>
          Found {suggestions.suggestions.length} pages on {suggestions.domain}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {suggestions.suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.url}-${index}`}
              className="flex items-center justify-between p-5 border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: '#eeefd3',
                borderColor: '#5A5A5A'
              }}
            >
              <div className="flex-1 min-w-0">
                <p 
                  className="font-bold truncate text-base"
                  style={{ color: '#1B4D3E' }}
                  title={suggestion.url}
                >
                  {truncateText(suggestion.url, 60)}
                </p>
                <p 
                  className="text-sm mt-2 font-medium"
                  style={{ color: '#5A5A5A' }}
                >
                  Click to archive this page
                </p>
              </div>
              
              <div className="flex gap-3 ml-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(suggestion.url, '_blank', 'noopener,noreferrer')}
                  className="text-sm px-4 py-2 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  style={{
                    borderColor: '#5A5A5A',
                    color: '#5A5A5A'
                  }}
                >
                  Visit
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleArchivePage(suggestion.url)}
                  disabled={isArchiving}
                  className="text-sm px-4 py-2 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  style={{
                    backgroundColor: '#1B4D3E',
                    color: 'white'
                  }}
                >
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {suggestions.suggestions.length > 5 && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#5A5A5A' }}>
            <p className="text-sm text-center font-medium" style={{ color: '#5A5A5A' }}>
              Showing {Math.min(suggestions.suggestions.length, 20)} of {suggestions.suggestions.length} pages
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
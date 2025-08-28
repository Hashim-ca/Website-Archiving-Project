import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SitePageSuggestionsResponse } from '@/types';
import { useArchive } from '@/hooks';
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
  const { createArchiveJob, isLoading: isArchiving } = useArchive();

  const handleArchivePage = async (url: string) => {
    const result = await createArchiveJob(url);
    if (result && onPageArchive) {
      onPageArchive(url);
    }
  };

  if (suggestions.suggestions.length === 0) {
    return (
      <Card className={cn('w-full', className)} style={{ backgroundColor: '#EBEBD3' }}>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription style={{ color: '#7E8381' }}>
              No page suggestions found for {suggestions.domain}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)} style={{ backgroundColor: '#EBEBD3' }}>
      <CardHeader>
        <CardTitle className="text-xl font-bold" style={{ color: '#2B806B' }}>
          Recommended Pages to Archive
        </CardTitle>
        <p className="text-sm" style={{ color: '#7E8381' }}>
          Found {suggestions.suggestions.length} pages on {suggestions.domain}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {suggestions.suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.url}-${index}`}
              className="flex items-center justify-between p-4 border rounded-lg"
              style={{ 
                backgroundColor: 'white',
                borderColor: '#7E8381'
              }}
            >
              <div className="flex-1 min-w-0">
                <p 
                  className="font-medium truncate"
                  style={{ color: '#2B806B' }}
                  title={suggestion.url}
                >
                  {truncateText(suggestion.url, 60)}
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: '#7E8381' }}
                >
                  Click to archive this page
                </p>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(suggestion.url, '_blank', 'noopener,noreferrer')}
                  className="text-xs px-3"
                  style={{
                    borderColor: '#7E8381',
                    color: '#7E8381'
                  }}
                >
                  Visit
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleArchivePage(suggestion.url)}
                  disabled={isArchiving}
                  className="text-xs px-3"
                  style={{
                    backgroundColor: '#2B806B',
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
          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#7E8381' }}>
            <p className="text-xs text-center" style={{ color: '#7E8381' }}>
              Showing {Math.min(suggestions.suggestions.length, 20)} of {suggestions.suggestions.length} pages
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
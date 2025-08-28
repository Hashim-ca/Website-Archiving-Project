import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GetWebsiteResponse, Snapshot } from '@/types';
import { useSnapshotStatus, useViewContent } from '@/hooks';
import { formatRelativeDate } from '@/utils';
import { cn } from '@/lib/utils';

interface WebsiteResultsProps {
  website: GetWebsiteResponse;
  className?: string;
}

export const WebsiteResults: React.FC<WebsiteResultsProps> = ({
  website,
  className
}) => {
  const { getStatusVariant, getStatusLabel, canView, getStatusSummary } = useSnapshotStatus();
  const { openContent } = useViewContent();
  
  // Convert website snapshots to proper Snapshot format for the hook
  const snapshots: Snapshot[] = website.snapshots.map(snapshot => ({
    ...snapshot,
    createdAt: typeof snapshot.createdAt === 'string' ? snapshot.createdAt : snapshot.createdAt.toISOString(),
    updatedAt: typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : snapshot.updatedAt.toISOString(),
  }));
  
  const summary = getStatusSummary(snapshots);
  
  if (website.snapshots.length === 0) {
    return (
      <Card className={cn('w-full', className)} style={{ backgroundColor: '#EBEBD3' }}>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription style={{ color: '#7E8381' }}>
              No snapshots found for {website.domain}. Try creating an archive first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)} style={{ backgroundColor: '#EBEBD3' }}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold" style={{ color: '#2B806B' }}>
              {website.domain}
            </CardTitle>
            <p className="text-sm mt-2" style={{ color: '#7E8381' }}>
              Original URL: {website.originalUrl}
            </p>
            <p className="text-xs mt-1" style={{ color: '#7E8381' }}>
              Created {formatRelativeDate(website.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {summary.completed > 0 && (
              <Badge variant="default" style={{ backgroundColor: '#2B806B', color: 'white' }}>
                {summary.completed} Completed
              </Badge>
            )}
            {summary.processing > 0 && (
              <Badge variant="secondary" style={{ backgroundColor: '#DADA5B', color: '#875B4E' }}>
                {summary.processing} Processing
              </Badge>
            )}
            {summary.failed > 0 && (
              <Badge variant="destructive" style={{ backgroundColor: '#875B4E', color: 'white' }}>
                {summary.failed} Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2B806B' }}>
              Available Snapshots ({summary.total})
            </h3>
            
            <div className="grid gap-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ 
                    backgroundColor: 'white',
                    borderColor: '#7E8381'
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium" style={{ color: '#2B806B' }}>
                        {snapshot.path === '/' ? 'Home Page' : snapshot.path}
                      </span>
                      <Badge variant={getStatusVariant(snapshot.status)}>
                        {getStatusLabel(snapshot.status)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm space-y-1" style={{ color: '#7E8381' }}>
                      <p>Entry point: {snapshot.entrypoint}</p>
                      <p>Created: {formatRelativeDate(snapshot.createdAt)}</p>
                      {snapshot.updatedAt !== snapshot.createdAt && (
                        <p>Updated: {formatRelativeDate(snapshot.updatedAt)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {canView(snapshot) && (
                      <Button
                        onClick={() => openContent(snapshot._id)}
                        className="px-4 py-2"
                        style={{
                          backgroundColor: '#2B806B',
                          color: 'white'
                        }}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
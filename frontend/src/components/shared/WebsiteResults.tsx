import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { GetWebsiteResponse, Snapshot } from '@/types';
import { useSnapshotStatus, useViewContent } from '@/hooks';
import { formatRelativeDate } from '@/utils';
import { cn } from '@/lib/utils';
import { API_CONFIG } from '@/lib/constants';

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
      <Card className={cn('w-full', className)} style={{ backgroundColor: '#eeefd3' }}>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription style={{ color: '#5A5A5A' }}>
              No snapshots found for {website.domain}. Try creating an archive first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full shadow-lg border-0', className)} style={{ backgroundColor: 'white' }}>
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold mb-3" style={{ color: '#1B4D3E' }}>
              {website.domain}
            </CardTitle>
            <p className="text-sm font-medium" style={{ color: '#5A5A5A' }}>
              Original URL: {website.originalUrl}
            </p>
            <p className="text-xs mt-2 font-medium" style={{ color: '#5A5A5A' }}>
              Created {formatRelativeDate(website.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.completed > 0 && (
              <Badge variant="default" className="px-3 py-1 font-semibold" style={{ backgroundColor: '#1B4D3E', color: 'white' }}>
                {summary.completed} Completed
              </Badge>
            )}
            {summary.processing > 0 && (
              <Badge variant="secondary" className="px-3 py-1 font-semibold" style={{ backgroundColor: '#D4B942', color: '#B85450' }}>
                {summary.processing} Processing
              </Badge>
            )}
            {summary.failed > 0 && (
              <Badge variant="destructive" className="px-3 py-1 font-semibold" style={{ backgroundColor: '#B85450', color: 'white' }}>
                {summary.failed} Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#1B4D3E' }}>
              Available Snapshots ({summary.total})
            </h3>
            
            <div className="grid gap-4">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot._id}
                  className="flex items-center justify-between p-5 border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#eeefd3',
                    borderColor: '#5A5A5A'
                  }}
                >
                  <div className="flex items-center gap-5 flex-1">
                    {canView(snapshot) && (
                      <div className="flex-shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="group">
                              <img
                                src={`${API_CONFIG.BASE_URL}/view/${snapshot._id}/thumbnail.png`}
                                alt={`Thumbnail of ${snapshot.path === '/' ? 'Home Page' : snapshot.path}`}
                                className="w-20 h-14 object-cover rounded-lg border cursor-pointer transition-all duration-200 group-hover:opacity-80 group-hover:shadow-lg"
                                style={{ borderColor: '#5A5A5A' }}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                            <div className="relative">
                              <img
                                src={`${API_CONFIG.BASE_URL}/view/${snapshot._id}/thumbnail.png`}
                                alt={`Full size thumbnail of ${snapshot.path === '/' ? 'Home Page' : snapshot.path}`}
                                className="w-full h-auto max-h-[85vh] object-contain rounded"
                                loading="lazy"
                              />
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                                {snapshot.path === '/' ? 'Home Page' : snapshot.path}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-base" style={{ color: '#1B4D3E' }}>
                          {snapshot.path === '/' ? 'Home Page' : snapshot.path}
                        </span>
                        <Badge variant={getStatusVariant(snapshot.status)} className="px-2 py-1 font-semibold">
                          {getStatusLabel(snapshot.status)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1 font-medium" style={{ color: '#5A5A5A' }}>
                        <p>Entry point: {snapshot.entrypoint}</p>
                        <p>Created: {formatRelativeDate(snapshot.createdAt)}</p>
                        {snapshot.updatedAt !== snapshot.createdAt && (
                          <p>Updated: {formatRelativeDate(snapshot.updatedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {canView(snapshot) && (
                      <Button
                        onClick={() => {
                          console.log('Opening content for snapshot:', snapshot._id);
                          const url = `${API_CONFIG.BASE_URL}/view/${snapshot._id}/index.html`;
                          console.log('Generated URL:', url);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="px-6 py-2 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                        style={{
                          backgroundColor: '#1B4D3E',
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
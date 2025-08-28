'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useJobStore } from '@/stores/jobStore';
import { useJobPolling } from '@/hooks/useJobPolling';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  X, 
  Trash2,
  ArrowRight 
} from 'lucide-react';

interface EnhancedActiveJobsProps {
  className?: string;
  maxVisible?: number;
  showDomainFilter?: string;
}

export const EnhancedActiveJobs: React.FC<EnhancedActiveJobsProps> = ({ 
  className,
  maxVisible = 10,
  showDomainFilter
}) => {
  const router = useRouter();
  const { 
    jobs, 
    removeJob, 
    clearCompletedJobs, 
    getJobsByDomain 
  } = useJobStore();
  
  const { isPolling, activeJobsCount } = useJobPolling();

  // Filter jobs based on domain if provided
  const displayJobs = showDomainFilter 
    ? getJobsByDomain(showDomainFilter)
    : jobs;

  const visibleJobs = displayJobs.slice(0, maxVisible);
  const completedJobs = visibleJobs.filter(job => 
    job.status?.status === 'completed'
  );

  const getStatusIcon = (status: string | undefined, hasError: boolean) => {
    if (hasError || status === 'failed') {
      return <AlertTriangle className="w-4 h-4" style={{ color: '#875B4E' }} />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" style={{ color: '#2B806B' }} />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#DADA5B' }} />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4" style={{ color: '#7E8381' }} />;
    }
  };

  const getStatusBadge = (status: string | undefined, hasError: boolean) => {
    if (hasError || status === 'failed') {
      return (
        <Badge 
          variant="outline"
          className="px-2 py-1 text-xs font-medium"
          style={{ 
            borderColor: '#875B4E', 
            color: '#875B4E',
            backgroundColor: 'rgba(135, 91, 78, 0.1)'
          }}
        >
          Failed
        </Badge>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <Badge 
            variant="outline"
            className="px-2 py-1 text-xs font-medium"
            style={{ 
              borderColor: '#2B806B', 
              color: '#2B806B',
              backgroundColor: 'rgba(43, 128, 107, 0.1)'
            }}
          >
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge 
            variant="outline"
            className="px-2 py-1 text-xs font-medium animate-pulse"
            style={{ 
              borderColor: '#DADA5B', 
              color: '#DADA5B',
              backgroundColor: 'rgba(218, 218, 91, 0.1)'
            }}
          >
            Processing
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge 
            variant="outline"
            className="px-2 py-1 text-xs font-medium"
            style={{ 
              borderColor: '#7E8381', 
              color: '#7E8381',
              backgroundColor: 'rgba(126, 131, 129, 0.1)'
            }}
          >
            Pending
          </Badge>
        );
    }
  };

  const handleViewDomain = (domain: string) => {
    router.push(`/domain/${encodeURIComponent(domain)}`);
  };

  const handleViewSnapshot = (job: typeof jobs[0]) => {
    if (job.status?.website?.snapshots?.[0]) {
      const snapshot = job.status.website.snapshots[0];
      const viewUrl = `/view/${snapshot._id}`;
      window.open(viewUrl, '_blank');
    }
  };

  if (visibleJobs.length === 0) {
    return null;
  }

  return (
    <Card className={cn('shadow-lg border-0 animate-fade-in-up', className)} style={{ backgroundColor: 'white' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center space-x-3" style={{ color: '#2B806B' }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
              <Briefcase className="w-5 h-5" />
            </div>
            <span>
              {showDomainFilter ? `Jobs for ${showDomainFilter}` : 'Archive Jobs'}
              {isPolling && activeJobsCount > 0 && (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin inline" style={{ color: '#DADA5B' }} />
              )}
            </span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {completedJobs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompletedJobs}
                className="flex items-center space-x-1"
                style={{ borderColor: '#7E8381', color: '#7E8381' }}
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Completed</span>
              </Button>
            )}
          </div>
        </div>
        
        {isPolling && activeJobsCount > 0 && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#DADA5B' }} />
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#DADA5B', animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#DADA5B', animationDelay: '0.4s' }} />
            </div>
            <p className="text-sm" style={{ color: '#7E8381' }}>
              Monitoring {activeJobsCount} active job{activeJobsCount !== 1 ? 's' : ''}...
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {visibleJobs.map((job, index) => {
          const hasError = !!job.error;
          const status = job.status?.status;
          const isCompleted = status === 'completed';
          const canViewSnapshot = isCompleted && job.status?.website?.snapshots?.[0];
          
          return (
            <div
              key={job.jobId}
              className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'rgba(43, 128, 107, 0.02)',
                borderColor: '#EBEBD3'
              }}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStatusIcon(status, hasError)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-semibold text-sm truncate" style={{ color: '#2B806B' }}>
                      {job.url}
                    </p>
                    {getStatusBadge(status, hasError)}
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs" style={{ color: '#7E8381' }}>
                    <span>{job.domain}</span>
                    <span>•</span>
                    <span>{new Date(job.addedAt).toLocaleTimeString()}</span>
                    {job.status?.processedAt && (
                      <>
                        <span>•</span>
                        <span>Completed: {new Date(job.status.processedAt).toLocaleTimeString()}</span>
                      </>
                    )}
                  </div>
                  
                  {hasError && job.error && (
                    <p className="text-xs mt-1 font-medium" style={{ color: '#875B4E' }}>
                      Error: {job.error}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                {canViewSnapshot && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSnapshot(job)}
                    className="flex items-center space-x-1"
                    style={{ borderColor: '#2B806B', color: '#2B806B' }}
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDomain(job.domain)}
                  className="flex items-center space-x-1"
                  style={{ borderColor: '#2B806B', color: '#2B806B' }}
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Domain</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeJob(job.jobId)}
                  className="w-8 h-8 p-0 hover:bg-red-50"
                >
                  <X className="w-3 h-3" style={{ color: '#875B4E' }} />
                </Button>
              </div>
            </div>
          );
        })}
        
        {displayJobs.length > maxVisible && (
          <div className="text-center pt-2">
            <p className="text-sm" style={{ color: '#7E8381' }}>
              Showing {maxVisible} of {displayJobs.length} jobs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
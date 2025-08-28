'use client';

import React from 'react';
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
  ArrowRight,
  Activity 
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
      return <AlertTriangle className="w-4 h-4" style={{ color: '#B85450' }} />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" style={{ color: '#1B4D3E' }} />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#D4B942' }} />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4" style={{ color: '#5A5A5A' }} />;
    }
  };

  const getStatusBadge = (status: string | undefined, hasError: boolean) => {
    if (hasError || status === 'failed') {
      return (
        <Badge 
          variant="outline"
          className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-full border-2 shadow-sm"
          style={{ 
            borderColor: '#B85450', 
            color: '#B85450',
            backgroundColor: 'rgba(184, 84, 80, 0.1)'
          }}
        >
          FAILED
        </Badge>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <Badge 
            variant="outline"
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-full border-2 shadow-sm"
            style={{ 
              borderColor: '#1B4D3E', 
              color: '#1B4D3E',
              backgroundColor: 'rgba(43, 128, 107, 0.15)'
            }}
          >
            COMPLETED
          </Badge>
        );
      case 'processing':
        return (
          <Badge 
            variant="outline"
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-full border-2 shadow-sm animate-pulse"
            style={{ 
              borderColor: '#D4B942', 
              color: '#D4B942',
              backgroundColor: 'rgba(218, 218, 91, 0.15)'
            }}
          >
            PROCESSING
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge 
            variant="outline"
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-full border-2 shadow-sm"
            style={{ 
              borderColor: '#5A5A5A', 
              color: '#5A5A5A',
              backgroundColor: 'rgba(90, 90, 90, 0.1)'
            }}
          >
            PENDING
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
    <Card className={cn('shadow-xl border-0 animate-fade-in-up backdrop-blur-sm', className)} 
          style={{ 
            backgroundColor: 'white',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
      <CardHeader className="pb-6 border-b border-gray-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl transition-all duration-200 hover:scale-105" 
                 style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
              <Briefcase className="w-6 h-6" style={{ color: '#1B4D3E' }} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: '#1B4D3E' }}>
                {showDomainFilter ? `Jobs for ${showDomainFilter}` : 'Archive Jobs'}
              </CardTitle>
              <p className="text-sm mt-1 font-medium" style={{ color: '#5A5A5A' }}>
                {visibleJobs.length} {visibleJobs.length === 1 ? 'job' : 'jobs'} 
                {displayJobs.length > maxVisible && ` of ${displayJobs.length} total`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isPolling && activeJobsCount > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full" 
                   style={{ backgroundColor: 'rgba(218, 218, 91, 0.1)' }}>
                <Activity className="w-4 h-4 animate-pulse" style={{ color: '#D4B942' }} />
                <span className="text-xs font-semibold" style={{ color: '#D4B942' }}>
                  {activeJobsCount} Active
                </span>
              </div>
            )}
            {completedJobs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompletedJobs}
                className="flex items-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
                style={{ borderColor: '#5A5A5A', color: '#5A5A5A' }}
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Clear Completed</span>
              </Button>
            )}
          </div>
        </div>
        
        {isPolling && activeJobsCount > 0 && (
          <div className="flex items-center space-x-3 mt-4 p-3 rounded-lg" 
               style={{ backgroundColor: 'rgba(218, 218, 91, 0.05)' }}>
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full animate-pulse" 
                   style={{ backgroundColor: '#D4B942' }} />
              <div className="w-2 h-2 rounded-full animate-pulse" 
                   style={{ backgroundColor: '#D4B942', animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full animate-pulse" 
                   style={{ backgroundColor: '#D4B942', animationDelay: '0.4s' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#5A5A5A' }}>
              Monitoring {activeJobsCount} active job{activeJobsCount !== 1 ? 's' : ''}...
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 p-6">
        {visibleJobs.map((job, index) => {
          const hasError = !!job.error;
          const status = job.status?.status;
          const isCompleted = status === 'completed';
          const canViewSnapshot = isCompleted && job.status?.website?.snapshots?.[0];
          
          return (
            <div
              key={job.jobId}
              className="group relative flex items-start justify-between p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-offset-2"
              style={{ 
                backgroundColor: 'rgba(43, 128, 107, 0.02)',
                borderColor: '#F8F6F0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="flex items-start space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110" 
                       style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
                    {getStatusIcon(status, hasError)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-base truncate leading-tight" style={{ color: '#1B4D3E' }}>
                        {job.url}
                      </h3>
                      <div className="flex-shrink-0">
                        {getStatusBadge(status, hasError)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm font-medium" style={{ color: '#5A5A5A' }}>
                      <span className="px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
                        {job.domain}
                      </span>
                      <span className="text-xs">•</span>
                      <span className="text-xs">
                        Started: {new Date(job.addedAt).toLocaleString()}
                      </span>
                    </div>
                    
                    {job.status?.processedAt && (
                      <div className="text-xs font-medium" style={{ color: '#1B4D3E' }}>
                        Completed: {new Date(job.status.processedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {hasError && job.error && (
                    <div className="p-3 rounded-lg border-l-4" 
                         style={{ 
                           backgroundColor: 'rgba(184, 84, 80, 0.05)',
                           borderLeftColor: '#B85450'
                         }}>
                      <p className="text-sm font-semibold" style={{ color: '#B85450' }}>
                        Error: {job.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-start space-x-2 flex-shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDomain(job.domain)}
                  className="flex items-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-md focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    borderColor: '#1B4D3E', 
                    color: '#1B4D3E',
                    backgroundColor: 'rgba(43, 128, 107, 0.05)'
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">View Domain</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeJob(job.jobId)}
                  className="w-9 h-9 p-0 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    color: '#B85450',
                    backgroundColor: 'rgba(184, 84, 80, 0.05)'
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {displayJobs.length > maxVisible && (
          <div className="text-center pt-6 border-t border-gray-50">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full" 
                 style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
              <span className="text-sm font-semibold" style={{ color: '#1B4D3E' }}>
                Showing {maxVisible} of {displayJobs.length} jobs
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
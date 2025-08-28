'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared';
import { useActiveJobs } from '@/hooks';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Archive,
  Trash2
} from 'lucide-react';
import { JobStatus } from '@/types';

interface ActiveJobsProps {
  className?: string;
}

export const ActiveJobs: React.FC<ActiveJobsProps> = ({ className }) => {
  const { activeJobs, removeJob, clearCompletedJobs, isLoading } = useActiveJobs();

  if (activeJobs.length === 0) {
    return null;
  }

  // Jobs are now added at the beginning of array, so they're already in correct order (most recent first)
  const completedJobs = activeJobs.filter(job => 
    job.status && (job.status.status === 'completed' || job.status.status === 'failed')
  );

  const processingJobs = activeJobs.filter(job => 
    !job.status || job.status.status === 'processing' || job.status.status === 'pending'
  );

  return (
    <div className={className}>
      <Card 
        className="shadow-lg border-0 transition-all duration-200 hover:shadow-xl"
        style={{ backgroundColor: 'white' }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg flex items-center space-x-3" style={{ color: '#2B806B' }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(43, 128, 107, 0.1)' }}>
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <span>Archive Jobs</span>
              <div className="text-xs font-normal mt-0.5" style={{ color: '#7E8381' }}>
                {activeJobs.length} active
              </div>
            </div>
            {isLoading && (
              <div className="ml-2">
                <LoadingSpinner size="sm" message="" />
              </div>
            )}
          </CardTitle>
          {completedJobs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompletedJobs}
              className="text-xs transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              style={{ borderColor: '#7E8381', color: '#7E8381' }}
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Completed</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {processingJobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4" style={{ color: '#DADA5B' }} />
                  <p className="text-sm font-medium" style={{ color: '#2B806B' }}>
                    Active Jobs ({processingJobs.length})
                  </p>
                </div>
              </div>
              {processingJobs.map((job, index) => (
                <div 
                  key={job.jobId} 
                  className="animate-fade-in-up" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <JobItem job={job} onRemove={removeJob} />
                </div>
              ))}
            </div>
          )}
          
          {completedJobs.length > 0 && (
            <>
              {processingJobs.length > 0 && (
                <div className="border-t pt-4 mt-4" style={{ borderColor: '#EBEBD3' }} />
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#2B806B' }} />
                    <p className="text-sm font-medium" style={{ color: '#2B806B' }}>
                      Recently Completed ({completedJobs.length})
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {completedJobs.slice(0, 5).map((job, index) => (
                    <div 
                      key={job.jobId} 
                      className="animate-fade-in-up" 
                      style={{ animationDelay: `${(processingJobs.length + index) * 50}ms` }}
                    >
                      <JobItem job={job} onRemove={removeJob} />
                    </div>
                  ))}
                </div>
                {completedJobs.length > 5 && (
                  <div className="text-center mt-3 p-2 rounded-lg" style={{ backgroundColor: 'rgba(126, 131, 129, 0.05)' }}>
                    <p className="text-xs font-medium" style={{ color: '#7E8381' }}>
                      {completedJobs.length - 5} more completed jobs available
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface JobItemProps {
  job: {
    jobId: string;
    url: string;
    domain: string;
    status: {
      status: JobStatus;
      error?: string;
    } | null;
    error: string | null;
  };
  onRemove: (jobId: string) => void;
}

const JobItem: React.FC<JobItemProps> = ({ job, onRemove }) => {
  const getStatusInfo = () => {
    if (!job.status) {
      return {
        label: 'Initializing',
        color: '#7E8381',
        bgColor: 'rgba(126, 131, 129, 0.1)',
        icon: <Clock className="w-4 h-4 animate-pulse" />
      };
    }

    switch (job.status.status) {
      case 'completed':
        return {
          label: 'Completed',
          color: '#2B806B',
          bgColor: 'rgba(43, 128, 107, 0.1)',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'failed':
        return {
          label: 'Failed',
          color: '#875B4E',
          bgColor: 'rgba(135, 91, 78, 0.1)',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'processing':
        return {
          label: 'Processing',
          color: '#DADA5B',
          bgColor: 'rgba(218, 218, 91, 0.1)',
          icon: <Play className="w-4 h-4 animate-pulse" />
        };
      case 'pending':
        return {
          label: 'Pending',
          color: '#7E8381',
          bgColor: 'rgba(126, 131, 129, 0.1)',
          icon: <Clock className="w-4 h-4" />
        };
      default:
        return {
          label: 'Unknown',
          color: '#7E8381',
          bgColor: 'rgba(126, 131, 129, 0.1)',
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const statusInfo = getStatusInfo();
  const canViewDomain = job.status && job.status.status === 'completed';

  return (
    <div 
      className="group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.01]" 
      style={{ 
        borderColor: '#EBEBD3',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start space-x-4">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg flex items-center justify-center transition-colors duration-200"
              style={{ backgroundColor: statusInfo.bgColor }}
            >
              {statusInfo.icon}
            </div>
            <Badge 
              variant="outline" 
              className="font-medium px-3 py-1 transition-all duration-200"
              style={{ 
                borderColor: statusInfo.color, 
                color: statusInfo.color,
                backgroundColor: statusInfo.bgColor
              }}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="font-semibold truncate" style={{ color: '#2B806B' }}>
                {job.domain}
              </p>
            </div>
            <p className="text-sm truncate leading-relaxed" style={{ color: '#7E8381' }}>
              {job.url}
            </p>
          </div>
        </div>
        
        {(job.error || (job.status && job.status.error)) && (
          <div className="mt-3 p-3 rounded-lg flex items-start space-x-2" style={{ backgroundColor: 'rgba(135, 91, 78, 0.1)' }}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#875B4E' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#875B4E' }}>
              {job.error || job.status?.error}
            </p>
          </div>
        )}
        
        {job.status && job.status.status === 'processing' && (
          <div className="mt-3 space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 rounded-full transition-all duration-1000 ease-in-out"
                style={{ 
                  backgroundColor: '#DADA5B',
                  width: '65%',
                  background: 'linear-gradient(90deg, #DADA5B 0%, rgba(218, 218, 91, 0.7) 100%)',
                  animation: 'shimmer 2s infinite'
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: '#7E8381' }}>
                Processing archive...
              </p>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#DADA5B', animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#DADA5B', animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#DADA5B', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {canViewDomain && (
          <Link href={`/domain/${encodeURIComponent(job.domain)}`}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              style={{ 
                borderColor: '#2B806B', 
                color: '#2B806B',
                backgroundColor: 'rgba(43, 128, 107, 0.05)'
              }}
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">View</span>
            </Button>
          </Link>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(job.jobId)}
          className="transition-all duration-200 hover:scale-105 p-2"
          style={{ 
            color: '#7E8381',
            backgroundColor: 'transparent'
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

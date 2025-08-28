'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared';
import { useActiveJobs } from '@/hooks';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ActiveJobsProps {
  className?: string;
}

export const ActiveJobs: React.FC<ActiveJobsProps> = ({ className }) => {
  const { activeJobs, removeJob, clearCompletedJobs, isLoading } = useActiveJobs();

  if (activeJobs.length === 0) {
    return null;
  }

  const completedJobs = activeJobs.filter(job => 
    job.status && (job.status.status === 'completed' || job.status.status === 'failed')
  );

  const processingJobs = activeJobs.filter(job => 
    !job.status || job.status.status === 'processing' || job.status.status === 'pending'
  );

  return (
    <div className={className}>
      <Card style={{ backgroundColor: 'white' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg flex items-center space-x-2" style={{ color: '#2B806B' }}>
            <Clock className="w-5 h-5" />
            <span>Active Archive Jobs</span>
            {isLoading && <LoadingSpinner size="sm" />}
          </CardTitle>
          {completedJobs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompletedJobs}
              className="text-xs"
              style={{ borderColor: '#7E8381', color: '#7E8381' }}
            >
              Clear Completed
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {processingJobs.map((job) => (
            <JobItem key={job.jobId} job={job} onRemove={removeJob} />
          ))}
          
          {completedJobs.length > 0 && (
            <>
              <div className="border-t pt-3 mt-3" style={{ borderColor: '#EBEBD3' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#7E8381' }}>
                  Recently Completed
                </p>
                {completedJobs.slice(0, 3).map((job) => (
                  <JobItem key={job.jobId} job={job} onRemove={removeJob} />
                ))}
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
    status: any;
    error: string | null;
  };
  onRemove: (jobId: string) => void;
}

const JobItem: React.FC<JobItemProps> = ({ job, onRemove }) => {
  const getStatusInfo = () => {
    if (!job.status) {
      return {
        label: 'Initializing...',
        color: '#7E8381',
        icon: <LoadingSpinner size="xs" />
      };
    }

    switch (job.status.status) {
      case 'completed':
        return {
          label: 'Completed',
          color: '#2B806B',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'failed':
        return {
          label: 'Failed',
          color: '#875B4E',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'processing':
        return {
          label: 'Processing...',
          color: '#DADA5B',
          icon: <LoadingSpinner size="xs" />
        };
      default:
        return {
          label: 'Pending...',
          color: '#7E8381',
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  const statusInfo = getStatusInfo();
  const canViewDomain = job.status && job.status.status === 'completed';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: '#EBEBD3' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {statusInfo.icon}
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: statusInfo.color, 
                color: statusInfo.color,
                backgroundColor: 'transparent'
              }}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: '#2B806B' }}>
              {job.domain}
            </p>
            <p className="text-sm truncate" style={{ color: '#7E8381' }}>
              {job.url}
            </p>
          </div>
        </div>
        
        {job.error && (
          <p className="text-xs mt-1" style={{ color: '#875B4E' }}>
            {job.error}
          </p>
        )}
        
        {job.status && job.status.status === 'processing' && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full transition-all duration-300 animate-pulse"
                style={{ 
                  backgroundColor: '#DADA5B',
                  width: '60%'
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: '#7E8381' }}>
              Processing...
            </p>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        {canViewDomain && (
          <Link href={`/domain/${encodeURIComponent(job.domain)}`}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
              style={{ borderColor: '#2B806B', color: '#2B806B' }}
            >
              <ExternalLink className="w-3 h-3" />
              <span>View</span>
            </Button>
          </Link>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(job.jobId)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

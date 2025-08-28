import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className, 
  size = 'md',
  message = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size]
        )}
        style={{
          borderTopColor: '#2B806B', // Primary color
          borderRightColor: '#7E8381', // Muted color
          borderBottomColor: '#7E8381',
          borderLeftColor: '#7E8381',
        }}
      />
      {message && (
        <p 
          className="text-sm font-medium animate-pulse"
          style={{ color: '#7E8381' }}
        >
          {message}
        </p>
      )}
    </div>
  );
};
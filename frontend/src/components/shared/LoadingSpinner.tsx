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
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-3 border-muted border-t-primary',
          sizeClasses[size]
        )}
        style={{
          borderTopColor: '#1B4D3E', // Primary color
          borderRightColor: '#5A5A5A', // Muted color
          borderBottomColor: '#5A5A5A',
          borderLeftColor: '#5A5A5A',
          borderWidth: size === 'lg' ? '4px' : size === 'md' ? '3px' : '2px'
        }}
      />
      {message && (
        <p 
          className={cn(
            'font-semibold animate-pulse',
            size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'
          )}
          style={{ color: '#5A5A5A' }}
        >
          {message}
        </p>
      )}
    </div>
  );
};
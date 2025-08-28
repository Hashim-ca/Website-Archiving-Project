import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUrlValidation } from '@/hooks';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (url: string) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  className,
  placeholder = "Enter website URL (e.g., example.com)"
}) => {
  const [url, setUrl] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const { validateUrl } = useUrlValidation();

  const validation = validateUrl(url);
  const showError = hasAttemptedSubmit && !validation.isValid && url.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    
    if (validation.isValid) {
      onSearch(url.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (hasAttemptedSubmit && e.target.value.trim() === '') {
      setHasAttemptedSubmit(false);
    }
  };

  return (
    <div className={cn('w-full max-w-2xl space-y-4', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Input
            type="text"
            value={url}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              'flex-1 h-12 text-lg',
              showError && 'border-red-500 focus-visible:ring-red-500'
            )}
            style={{
              backgroundColor: '#EBEBD3',
              borderColor: showError ? '#875B4E' : '#7E8381',
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-12 px-8 text-lg font-semibold"
            style={{
              backgroundColor: '#2B806B',
              color: 'white',
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {showError && validation.errors.length > 0 && (
          <Alert 
            className="border-2"
            style={{ 
              backgroundColor: '#EBEBD3', 
              borderColor: '#875B4E' 
            }}
          >
            <AlertDescription style={{ color: '#875B4E' }}>
              {validation.errors[0].message}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
};
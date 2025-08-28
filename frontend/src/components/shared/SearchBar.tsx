import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUrlValidation } from '@/hooks';
import { cn } from '@/lib/utils';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';

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
    <div className={cn('w-full max-w-2xl space-y-4 animate-fade-in-up', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                value={url}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={isLoading}
                className={cn(
                  'h-14 text-lg pl-12 pr-4 rounded-xl border-2 transition-all duration-200 focus:scale-[1.02] shadow-sm',
                  showError ? 'border-red-500 focus-visible:ring-red-500' : 'focus:shadow-lg'
                )}
                style={{
                  backgroundColor: 'white',
                  borderColor: showError ? '#875B4E' : '#7E8381',
                }}
              />
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                style={{ color: showError ? '#875B4E' : '#7E8381' }} 
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="h-14 px-8 text-lg font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-lg flex items-center space-x-2"
              style={{
                backgroundColor: '#2B806B',
                color: 'white',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Archiving...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Archive</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        {showError && validation.errors.length > 0 && (
          <Alert 
            className="border-2 rounded-xl animate-scale-in shadow-sm"
            style={{ 
              backgroundColor: 'rgba(135, 91, 78, 0.05)', 
              borderColor: '#875B4E' 
            }}
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: '#875B4E' }} />
              <AlertDescription className="font-medium" style={{ color: '#875B4E' }}>
                {validation.errors[0].message}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </form>
    </div>
  );
};
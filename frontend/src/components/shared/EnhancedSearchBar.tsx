import React, { useState, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUrlValidation } from '@/hooks';
import { useSearchStore } from '@/stores/searchStore';
import { cn } from '@/lib/utils';
import { Search, AlertTriangle, Loader2, Clock, Globe, X } from 'lucide-react';

interface EnhancedSearchBarProps {
  onSearch: (url: string) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onSearch,
  isLoading = false,
  className,
  placeholder = "Enter website URL or search history...",
  autoFocus = false
}) => {
  const [url, setUrl] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { validateUrl } = useUrlValidation();
  const {
    currentQuery,
    setCurrentQuery,
    getRecentSuggestions,
    getDomainSuggestions,
    removeFromHistory,
    history
  } = useSearchStore();

  // Debounce search input for suggestions
  const [debouncedUrl] = useDebounce(url, 300);
  
  const validation = validateUrl(url);
  const showError = hasAttemptedSubmit && !validation.isValid && url.trim() !== '';

  // Get suggestions based on debounced input
  const suggestions = debouncedUrl.trim().length > 0 
    ? getRecentSuggestions(debouncedUrl)
    : history.slice(0, 5); // Show recent history when empty

  const domainSuggestions = debouncedUrl.trim().length > 0
    ? getDomainSuggestions(debouncedUrl)
    : [];

  const allSuggestions = [
    ...suggestions.map(item => ({ type: 'history' as const, item, display: item.url })),
    ...domainSuggestions.map(domain => ({ type: 'domain' as const, item: domain, display: domain }))
  ].slice(0, 8);

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Initialize from store
  useEffect(() => {
    if (currentQuery && !url) {
      setUrl(currentQuery);
    }
  }, [currentQuery, url]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setCurrentQuery(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    if (hasAttemptedSubmit && value.trim() === '') {
      setHasAttemptedSubmit(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setShowSuggestions(false);
    
    if (validation.isValid) {
      const urlToUse = url.trim();
      onSearch(urlToUse);
      // Note: We'll add to history after successful archive creation
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: typeof allSuggestions[0]) => {
    let urlToUse: string;
    
    if (suggestion.type === 'history') {
      urlToUse = suggestion.item.url;
    } else {
      // For domain suggestions, we might need to construct a URL
      urlToUse = suggestion.display.startsWith('http') ? suggestion.display : `https://${suggestion.display}`;
    }
    
    setUrl(urlToUse);
    setCurrentQuery(urlToUse);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (validateUrl(urlToUse).isValid) {
      onSearch(urlToUse);
    }
  };

  // Handle suggestion removal
  const handleRemoveSuggestion = (e: React.MouseEvent, suggestionId: string) => {
    e.stopPropagation();
    removeFromHistory(suggestionId);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(allSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('w-full max-w-2xl space-y-3 animate-fade-in-up relative', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={url}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                'h-14 sm:h-16 text-base sm:text-lg pl-12 sm:pl-14 pr-4 sm:pr-6 rounded-2xl border-2 transition-all duration-300 ease-in-out font-medium',
                'bg-white hover:shadow-md focus:shadow-lg focus:scale-[1.01]',
                'placeholder:text-gray-400',
                showError 
                  ? 'border-red-400 focus-visible:ring-red-200 focus-visible:ring-4 focus-visible:border-red-500' 
                  : 'border-gray-300 hover:border-gray-400',
                'focus-visible:ring-4 focus-visible:ring-opacity-30',
                !showError && 'focus-visible:border-[#d8d958] focus-visible:ring-[#d8d958]',
                showSuggestions && allSuggestions.length > 0 ? 'rounded-b-none border-b-0' : '',
                isLoading ? 'opacity-75' : ''
              )}
            />
            <Search 
              className={cn(
                "absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200",
                showError ? 'text-red-400' : 'text-gray-400'
              )}
            />
            
            {/* Suggestions dropdown - positioned relative to input */}
            {showSuggestions && allSuggestions.length > 0 && (
              <Card 
                ref={suggestionsRef}
                className={cn(
                  "absolute top-full left-0 right-0 z-50 shadow-xl border-2 rounded-t-none rounded-b-2xl max-h-80 overflow-y-auto",
                  "bg-white backdrop-blur-sm",
                  showError ? 'border-red-400' : 'border-[#d8d958]'
                )}
              >
                <CardContent className="p-0">
                  {allSuggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.type}-${suggestion.type === 'history' ? suggestion.item.id : suggestion.display}`}
                      className={cn(
                        'flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 cursor-pointer transition-all duration-200 border-b last:border-b-0',
                        index === selectedIndex ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50 border-gray-100'
                      )}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {suggestion.type === 'history' ? (
                          <Clock className="w-4 h-4 flex-shrink-0 text-gray-500" />
                        ) : (
                          <Globe className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span 
                              className="font-semibold truncate text-sm text-gray-900" 
                              title={suggestion.type === 'history' ? suggestion.item.url : suggestion.display}
                            >
                              {suggestion.type === 'history' ? suggestion.item.url : suggestion.display}
                            </span>
                            {suggestion.type === 'history' && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "px-1.5 py-0.5 text-xs flex-shrink-0 border",
                                  suggestion.item.success 
                                    ? 'border-green-200 text-green-700 bg-green-50' 
                                    : 'border-red-200 text-red-700 bg-red-50'
                                )}
                              >
                                {suggestion.item.success ? 'Success' : 'Failed'}
                              </Badge>
                            )}
                          </div>
                          {suggestion.type === 'history' && (
                            <p className="text-xs truncate text-gray-500">
                              {suggestion.item.domain} • {new Date(suggestion.item.timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {suggestion.type === 'history' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 hover:bg-red-50 hover:text-red-600 flex-shrink-0 ml-2 rounded-full transition-colors duration-200"
                          onClick={(e) => handleRemoveSuggestion(e, suggestion.item.id)}
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={cn(
              "h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-bold rounded-2xl transition-all duration-300 ease-in-out",
              "shadow-md hover:shadow-lg focus:shadow-lg",
              "flex items-center justify-center space-x-2 sm:space-x-3",
              "text-green-900 hover:text-green-800",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "focus:ring-4 focus:ring-opacity-30",
              "w-full sm:w-44 min-w-[140px]"
            )}
            style={{
              backgroundColor: '#d8d958',
              '--tw-ring-color': '#d8d958'
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!isLoading && url.trim()) {
                e.currentTarget.style.backgroundColor = '#003738';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#d8d958';
              e.currentTarget.style.color = '';
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = '#003738';
              e.currentTarget.style.color = '#ffffff';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = '#d8d958';
              e.currentTarget.style.color = '';
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Archive</span>
              </>
            )}
          </Button>
        </div>
        
        {showError && validation.errors.length > 0 && (
          <Alert 
            className={cn(
              "border-2 rounded-xl animate-scale-in shadow-sm",
              "bg-red-50 border-red-200"
            )}
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 text-red-500" />
              <AlertDescription className="font-medium text-red-700">
                {validation.errors[0].message}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </form>
    </div>
  );
};
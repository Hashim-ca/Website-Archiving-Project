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
    addToHistory,
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
    <div className={cn('w-full max-w-2xl space-y-2 animate-fade-in-up relative', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="flex gap-3">
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
                  'h-14 text-lg pl-12 pr-4 rounded-xl border-2 transition-all duration-200 focus:scale-[1.02] shadow-sm',
                  showError ? 'border-red-500 focus-visible:ring-red-500' : 'focus:shadow-lg',
                  showSuggestions && allSuggestions.length > 0 ? 'rounded-b-none' : ''
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

        {/* Suggestions dropdown */}
        {showSuggestions && allSuggestions.length > 0 && (
          <Card 
            ref={suggestionsRef}
            className="absolute top-[70px] left-0 right-0 z-50 shadow-xl border-2 rounded-t-none rounded-b-xl max-h-80 overflow-y-auto"
            style={{ backgroundColor: 'white', borderColor: '#7E8381' }}
          >
            <CardContent className="p-0">
              {allSuggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.type === 'history' ? suggestion.item.id : suggestion.display}`}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0',
                    index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                  )}
                  style={{ borderColor: '#EBEBD3' }}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {suggestion.type === 'history' ? (
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#7E8381' }} />
                    ) : (
                      <Globe className="w-4 h-4 flex-shrink-0" style={{ color: '#2B806B' }} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="font-medium truncate" 
                          style={{ color: '#2B806B' }}
                        >
                          {suggestion.type === 'history' ? suggestion.item.url : suggestion.display}
                        </span>
                        {suggestion.type === 'history' && (
                          <Badge 
                            variant="outline" 
                            className="px-2 py-0.5 text-xs"
                            style={{ 
                              borderColor: suggestion.item.success ? '#2B806B' : '#875B4E',
                              color: suggestion.item.success ? '#2B806B' : '#875B4E'
                            }}
                          >
                            {suggestion.item.success ? 'Success' : 'Failed'}
                          </Badge>
                        )}
                      </div>
                      {suggestion.type === 'history' && (
                        <p className="text-sm truncate" style={{ color: '#7E8381' }}>
                          {suggestion.item.domain} • {new Date(suggestion.item.timestamp).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {suggestion.type === 'history' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 hover:bg-red-50"
                      onClick={(e) => handleRemoveSuggestion(e, suggestion.item.id)}
                    >
                      <X className="w-3 h-3" style={{ color: '#875B4E' }} />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
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
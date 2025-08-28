import { useCallback } from 'react';
import { ValidationResult, FormError } from '@/types';
import { normalizeUrl, extractDomain, isValidDomain } from '@/utils';

interface UseUrlValidationResult {
  validateUrl: (url: string) => ValidationResult;
  isValidUrl: (url: string) => boolean;
  normalizeUrl: (url: string) => string;
  extractDomain: (url: string) => string | null;
}

export const useUrlValidation = (): UseUrlValidationResult => {
  const validateUrl = useCallback((url: string): ValidationResult => {
    const errors: FormError[] = [];

    if (!url || url.trim() === '') {
      errors.push({
        field: 'url',
        message: 'URL is required',
      });
      return { isValid: false, errors };
    }

    try {
      const normalized = normalizeUrl(url);
      const urlObj = new URL(normalized);
      
      // Only allow HTTP and HTTPS protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        errors.push({
          field: 'url',
          message: 'Only HTTP and HTTPS URLs are allowed',
        });
      }

      // Use utility function for domain validation
      if (!urlObj.hostname || !isValidDomain(urlObj.hostname)) {
        errors.push({
          field: 'url',
          message: 'Invalid domain format',
        });
      }

    } catch {
      errors.push({
        field: 'url',
        message: 'Invalid URL format',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  const isValidUrl = useCallback((url: string): boolean => {
    return validateUrl(url).isValid;
  }, [validateUrl]);

  // Use utility functions directly - no need to wrap in useCallback
  return {
    validateUrl,
    isValidUrl,
    normalizeUrl,
    extractDomain,
  };
};
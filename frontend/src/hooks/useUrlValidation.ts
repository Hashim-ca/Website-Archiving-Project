import { useCallback } from 'react';
import { ValidationResult, FormError } from '@/types';

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

    const trimmedUrl = url.trim();

    try {
      const urlObj = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
      
      // Only allow HTTP and HTTPS protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        errors.push({
          field: 'url',
          message: 'Only HTTP and HTTPS URLs are allowed',
        });
      }

      // Basic hostname validation
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        errors.push({
          field: 'url',
          message: 'Invalid hostname',
        });
      }

      // Check for valid domain format (basic validation)
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(urlObj.hostname)) {
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

  const normalizeUrl = useCallback((url: string): string => {
    try {
      const trimmedUrl = url.trim();
      const fullUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
      const urlObj = new URL(fullUrl);
      return urlObj.toString();
    } catch {
      return url; // Return original if normalization fails
    }
  }, []);

  const extractDomain = useCallback((url: string): string | null => {
    try {
      const trimmedUrl = url.trim();
      const fullUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
      const urlObj = new URL(fullUrl);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }, []);

  return {
    validateUrl,
    isValidUrl,
    normalizeUrl,
    extractDomain,
  };
};
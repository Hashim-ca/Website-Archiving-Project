// Color palette constants - matches CLAUDE.md specifications
export const COLORS = {
  DOMINANT: '#EBEBD3',  // Primary background/neutral
  PRIMARY: '#2B806B',   // Primary actions/links
  ACCENT: '#DADA5B',    // Highlights/warnings
  MUTED: '#7E8381',     // Secondary text/borders
  BROWN: '#875B4E',     // Error states/emphasis
  WARM: '#C19780',      // Success states/warm accents
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
} as const;

// UI configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MAX_URL_DISPLAY_LENGTH: 60,
  MAX_DOMAIN_DISPLAY_LENGTH: 40,
  ITEMS_PER_PAGE: 20,
} as const;

// Status-related constants
export const SNAPSHOT_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error: Unable to connect to the server',
  INVALID_URL: 'Please enter a valid URL',
  REQUIRED_FIELD: 'This field is required',
  UNKNOWN_ERROR: 'An unknown error occurred',
  FETCH_FAILED: 'Failed to fetch data',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ARCHIVE_CREATED: 'Archive job created successfully',
  DATA_LOADED: 'Data loaded successfully',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  RECENT_URLS: 'meddoc-recent-urls',
  PREFERENCES: 'meddoc-preferences',
  THEME: 'meddoc-theme',
} as const;

// File extensions and MIME types
export const FILE_TYPES = {
  HTML: 'text/html',
  CSS: 'text/css',
  JS: 'application/javascript',
  JSON: 'application/json',
  XML: 'application/xml',
  PDF: 'application/pdf',
  IMAGE: 'image/*',
} as const;

// URL validation patterns
export const VALIDATION_PATTERNS = {
  URL: /^https?:\/\/.+/,
  DOMAIN: /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchHistoryItem {
  id: string;
  url: string;
  domain: string;
  timestamp: number;
  success: boolean;
}

export interface SearchState {
  // Search history
  history: SearchHistoryItem[];
  recentDomains: string[];
  
  // Current search state
  currentQuery: string;
  isSearching: boolean;
  lastSearchedUrl: string | null;
  
  // Actions
  addToHistory: (url: string, domain: string, success: boolean) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  setCurrentQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  setLastSearchedUrl: (url: string | null) => void;
  getRecentSuggestions: (query: string) => SearchHistoryItem[];
  getDomainSuggestions: (query: string) => string[];
}

const STORAGE_KEY = 'website-archive-search';
const MAX_HISTORY_ITEMS = 50;
const MAX_RECENT_DOMAINS = 20;

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      history: [],
      recentDomains: [],
      currentQuery: '',
      isSearching: false,
      lastSearchedUrl: null,

      // Actions
      addToHistory: (url: string, domain: string, success: boolean) => {
        const id = `${Date.now()}-${Math.random()}`;
        const newItem: SearchHistoryItem = {
          id,
          url,
          domain,
          timestamp: Date.now(),
          success,
        };

        set(state => {
          // Remove duplicates and add new item at the beginning
          const filteredHistory = state.history.filter(item => item.url !== url);
          const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
          
          // Update recent domains
          const filteredDomains = state.recentDomains.filter(d => d !== domain);
          const newRecentDomains = [domain, ...filteredDomains].slice(0, MAX_RECENT_DOMAINS);

          return {
            history: newHistory,
            recentDomains: newRecentDomains,
          };
        });
      },

      removeFromHistory: (id: string) => {
        set(state => ({
          history: state.history.filter(item => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ history: [], recentDomains: [] });
      },

      setCurrentQuery: (query: string) => {
        set({ currentQuery: query });
      },

      setIsSearching: (isSearching: boolean) => {
        set({ isSearching });
      },

      setLastSearchedUrl: (url: string | null) => {
        set({ lastSearchedUrl: url });
      },

      getRecentSuggestions: (query: string) => {
        const { history } = get();
        const lowerQuery = query.toLowerCase();
        
        return history
          .filter(item => 
            item.url.toLowerCase().includes(lowerQuery) || 
            item.domain.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 8); // Limit to 8 suggestions
      },

      getDomainSuggestions: (query: string) => {
        const { recentDomains } = get();
        const lowerQuery = query.toLowerCase();
        
        return recentDomains
          .filter(domain => domain.toLowerCase().includes(lowerQuery))
          .slice(0, 5); // Limit to 5 domain suggestions
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        history: state.history,
        recentDomains: state.recentDomains,
        lastSearchedUrl: state.lastSearchedUrl,
      }),
    }
  )
);
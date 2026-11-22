// useMovieSearch.js - Debounced Movie Search Hook with Cache & Cancellation
import { useState, useEffect, useRef } from 'react';
import { searchMovies } from '../services/api';
import useDebounce from './useDebounce';

// In-memory query cache to avoid re-fetching repeated searches
const searchCache = new Map();

/**
 * Custom hook to execute debounced movie searches.
 * Handles race condition cancellation and cached responses.
 *
 * @param {string} rawQuery - The live text input
 * @param {number} delay - Debounce duration in ms (default: 350ms)
 * @returns {{ results: Array, loading: boolean, error: string|null, debouncedQuery: string }}
 */
export const useMovieSearch = (rawQuery, delay = 350) => {
  const debouncedQuery = useDebounce(rawQuery, delay);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = (debouncedQuery || '').trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cacheKey = trimmed.toLowerCase();
    if (searchCache.has(cacheKey)) {
      setResults(searchCache.get(cacheKey));
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);

    searchMovies(trimmed)
      .then((data) => {
        // Prevent race condition if a newer query already initiated
        if (currentRequestId === activeRequestIdRef.current) {
          const validData = Array.isArray(data) ? data : [];
          searchCache.set(cacheKey, validData);
          setResults(validData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (currentRequestId === activeRequestIdRef.current) {
          setError(err.message || 'Error searching movies');
          setLoading(false);
        }
      });

    return () => {
      // Discard results of pending request if query changes
      activeRequestIdRef.current = 0;
    };
  }, [debouncedQuery]);

  return { results, loading, error, debouncedQuery };
};

export default useMovieSearch;

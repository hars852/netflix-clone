// useMovieSearch.js - Custom Hook for Movie Search (Frontend-Only)
import { useState, useEffect } from 'react';
import { searchMovies } from '../services/api';

export const useMovieSearch = (query, delay = 300) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query || !query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handler = setTimeout(async () => {
      try {
        const data = await searchMovies(query);
        setResults(data);
      } catch (err) {
        setError(err.message || 'Error searching movies');
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [query, delay]);

  return { results, loading, error };
};

export default useMovieSearch;

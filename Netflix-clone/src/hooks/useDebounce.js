// useDebounce.js - Generic value debounce hook
import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value with a configurable delay.
 * Prevents rapid API triggers while typing.
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - The debounce delay in milliseconds (default: 350ms)
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay = 350) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;

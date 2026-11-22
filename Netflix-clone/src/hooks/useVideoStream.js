// useVideoStream.js - Custom Hook for Resolving Verified Streams
import { useState, useEffect } from 'react';
import { fetchMovieStream, fetchEpisodeStream, fetchMovieDetails } from '../services/api';

export const useVideoStream = (mediaId, mediaType = 'movie', directStream = null) => {
  const [streamInfo, setStreamInfo] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStream = async () => {
      if (!mediaId && !directStream) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasError(false);

      try {
        if (directStream) {
          if (isMounted) {
            setStreamInfo({
              streamUrl: decodeURIComponent(directStream),
              format: 'mp4',
              isAvailable: true
            });
            setLoading(false);
          }
          return;
        }

        let stream = null;
        if (mediaType === 'episode') {
          stream = await fetchEpisodeStream(mediaId);
        } else {
          stream = await fetchMovieStream(mediaId);
        }

        const details = await fetchMovieDetails(mediaId);

        if (isMounted) {
          if (stream && stream.isAvailable && stream.streamUrl) {
            setStreamInfo(stream);
            setMovieDetails(details || stream);
            setLoading(false);
          } else {
            setHasError(true);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('useVideoStream error:', err);
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      }
    };

    loadStream();

    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType, directStream]);

  return { streamInfo, movieDetails, loading, hasError };
};

export default useVideoStream;

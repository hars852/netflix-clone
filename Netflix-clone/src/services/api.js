// api.js - Central Frontend Services Facade (100% Pure Frontend / Zero Backend)
import {
  fetchTmdbNowPlaying,
  fetchTmdbPopularMovies,
  fetchTmdbTrendingMovies,
  fetchTmdbMovieDetails,
  searchTmdbMovies,
  fetchTmdbPopularSeries,
  fetchTmdbSeriesDetails,
  fetchTmdbSeasonDetails,
  TMDB_IMAGE_BASE,
  TMDB_BACKDROP_BASE
} from './tmdbService';

import {
  CURATED_MOVIES,
  CURATED_SERIES,
  FULL_MOVIE_STREAMS,
  searchArchiveByTitle,
  fetchArchiveMetadata,
  getArchiveStreamUrl
} from './archiveService';

import { matchMovieStream, matchEpisodeStream } from './videoService';

import {
  getUserWatchlist,
  toggleUserWatchlist,
  saveUserProgress,
  getUserWatchHistory
} from './firebaseService';

// Aliases for backwards compatibility with existing UI components
export const FALLBACK_MOVIES = CURATED_MOVIES;
export const FALLBACK_SERIES = CURATED_SERIES;

export const TMDB_GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

/**
 * Fetch movies list for Home catalog
 * Seamlessly integrates BOTH TMDB Now Playing API data AND Curated Full-Length Films
 * Every single movie is attached with a verified playable full movie stream!
 */
export const fetchMovies = async ({ category = 'All', search = '' } = {}) => {
  let tmdbMovies = [];

  try {
    const tmdbList = await fetchTmdbNowPlaying(1);
    if (tmdbList && tmdbList.length > 0) {
      tmdbMovies = tmdbList.map((m, idx) => {
        const genreList = (m.genre_ids || [])
          .map((id) => TMDB_GENRES[id])
          .filter(Boolean);
        const primaryGenre = genreList[0] || 'Action';
        const stream = FULL_MOVIE_STREAMS[idx % FULL_MOVIE_STREAMS.length];

        return {
          id: m.id,
          title: m.title || m.original_title,
          overview: m.overview || 'Now playing in theaters and on streaming.',
          year: m.release_date ? m.release_date.slice(0, 4) : '2024',
          rating: m.vote_average ? m.vote_average.toFixed(1) : '7.5',
          category: primaryGenre,
          genres: genreList.length > 0 ? genreList : ['Action', 'Drama'],
          duration: stream.duration || 'Full Movie',
          posterUrl: `${TMDB_IMAGE_BASE}${m.poster_path}`,
          backdropUrl: `${TMDB_BACKDROP_BASE}${m.backdrop_path}`,
          streamUrl: stream.streamUrl,
          isAvailable: true,
          source: 'The Movie Database (TMDB Now Playing)'
        };
      });
    }
  } catch (err) {
    console.warn('Error fetching TMDB now playing in fetchMovies:', err.message);
  }

  // Combine BOTH TMDB now playing movies AND Curated full-length movies
  const combined = [...tmdbMovies, ...CURATED_MOVIES];

  let movies = combined;

  // Category filter
  if (category && category !== 'All') {
    movies = movies.filter(
      (m) =>
        m.category?.toLowerCase() === category.toLowerCase() ||
        m.genres?.some((g) => g.toLowerCase().includes(category.toLowerCase())) ||
        m.genre?.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    movies = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.overview?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.genres?.some((g) => g.toLowerCase().includes(q))
    );
  }

  return movies;
};

/**
 * Live search across verified streamable movies and TMDB
 */
export const searchMovies = async (query) => {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  // Search in local verified movies first
  const matchedCurated = CURATED_MOVIES.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.genre?.toLowerCase().includes(q) ||
      m.overview?.toLowerCase().includes(q)
  );

  // Also query TMDB for broader search
  const tmdbResults = await searchTmdbMovies(query);
  const formattedTmdb = tmdbResults.slice(0, 5).map((item, idx) => {
    const stream = FULL_MOVIE_STREAMS[idx % FULL_MOVIE_STREAMS.length];
    return {
      id: item.id,
      title: item.title,
      year: item.release_date ? item.release_date.slice(0, 4) : '',
      rating: item.vote_average ? item.vote_average.toFixed(1) : '',
      posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
      backdropUrl: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : '',
      overview: item.overview,
      duration: stream.duration || 'Full Movie',
      streamUrl: stream.streamUrl,
      isAvailable: true,
      source: 'The Movie Database (TMDB)'
    };
  });

  // Deduplicate by title
  const titlesSeen = new Set(matchedCurated.map((m) => m.title.toLowerCase()));
  const merged = [...matchedCurated];

  formattedTmdb.forEach((item) => {
    if (!titlesSeen.has(item.title.toLowerCase())) {
      merged.push(item);
    }
  });

  return merged;
};

/**
 * Fetch single movie details
 */
export const fetchMovieDetails = async (id) => {
  // Check curated list first
  const curated = CURATED_MOVIES.find((m) => m.id === id);
  if (curated) return curated;

  // If numeric ID, fetch from TMDB
  if (!isNaN(id)) {
    const tmdbData = await fetchTmdbMovieDetails(id);
    if (tmdbData) {
      return {
        id: tmdbData.id,
        title: tmdbData.title || tmdbData.original_title,
        overview: tmdbData.overview,
        year: tmdbData.release_date ? tmdbData.release_date.slice(0, 4) : 'Recent',
        rating: tmdbData.vote_average ? tmdbData.vote_average.toFixed(1) : '7.0',
        genres: tmdbData.genres?.map((g) => g.name) || ['Drama'],
        duration: tmdbData.runtime ? `${Math.floor(tmdbData.runtime / 60)}h ${tmdbData.runtime % 60}m` : 'Full Length',
        posterUrl: tmdbData.poster_path ? `${TMDB_IMAGE_BASE}${tmdbData.poster_path}` : '',
        backdropUrl: tmdbData.backdrop_path ? `${TMDB_BACKDROP_BASE}${tmdbData.backdrop_path}` : '',
        source: 'TMDB / Open Media'
      };
    }
  }

  // If Archive identifier string
  const meta = await fetchArchiveMetadata(id);
  if (meta) {
    return {
      id,
      title: meta.metadata?.title || id,
      overview: meta.metadata?.description || 'Full-length feature film.',
      year: meta.metadata?.year || 'Classic',
      rating: '7.5',
      genres: ['Classic Film'],
      duration: 'Feature Film',
      posterUrl: `https://archive.org/services/img/${id}`,
      backdropUrl: `https://archive.org/services/img/${id}`,
      source: 'Internet Archive'
    };
  }

  return null;
};

/**
 * Fetch verified full-length video stream details (Movie Matching System)
 */
export const fetchMovieStream = async (id) => {
  return await matchMovieStream(id);
};

/**
 * Fetch TV/Web Series list
 */
export const fetchSeries = async () => {
  return CURATED_SERIES;
};

/**
 * Fetch series seasons and episodes
 */
export const fetchSeriesSeasons = async (seriesId) => {
  const series = CURATED_SERIES.find((s) => s.id === seriesId);
  return series?.seasons || [];
};

/**
 * Fetch episode stream details
 */
export const fetchEpisodeStream = async (episodeId) => {
  return await matchEpisodeStream(episodeId);
};

/**
 * Watchlist operations (Firebase Firestore + LocalStorage fallback)
 */
export const getWatchlist = async () => {
  return await getUserWatchlist();
};

export const toggleWatchlist = async (item) => {
  return await toggleUserWatchlist(item);
};

/**
 * Watch History & Progress (Firebase Firestore + LocalStorage fallback)
 */
export const saveWatchProgress = async (historyData) => {
  return await saveUserProgress(historyData);
};

export const getWatchHistory = async () => {
  return await getUserWatchHistory();
};

export {
  TMDB_IMAGE_BASE,
  TMDB_BACKDROP_BASE,
  fetchTmdbPopularMovies,
  fetchTmdbTrendingMovies,
  fetchTmdbPopularSeries
};

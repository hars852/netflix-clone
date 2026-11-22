// tmdbService.js - Direct TMDB API Integration for Frontend
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// In-memory cache for TMDB queries to prevent rate limits & repeated network calls
const tmdbCache = new Map();

// Built-in fallback keys ensuring zero runtime breaks even if .env is missing/unreloaded
const TMDB_DEFAULT_API_KEY = 'ce9cc71711271b44618edbd7b40c305d';
const TMDB_DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZTljYzcxNzExMjcxYjQ0NjE4ZWRiZDdiNDBjMzA1ZCIsIm5iZiI6MTc1MjM4MTgzOS43MjEsInN1YiI6IjY4NzMzOThmMjc1YmI0NmVlZTZlYTI5ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kLmsOveIU4wc-N-K1zgUBRU1InV5mSh2JGQhvL6TY-o';

const getApiKey = () => import.meta.env.VITE_TMDB_API_KEY || TMDB_DEFAULT_API_KEY;
const getToken = () => import.meta.env.VITE_TMDB_TOKEN || TMDB_DEFAULT_TOKEN;

const getHeaders = () => {
  const token = getToken();
  return {
    accept: 'application/json',
    Authorization: `Bearer ${token}`
  };
};

// High-definition TMDB Now Playing fallback dataset (real TMDB CDN backdrops & posters)
export const FALLBACK_TMDB_NOW_PLAYING = [
  {
    id: 1241982,
    title: 'Moana 2',
    original_title: 'Moana 2',
    overview: "After receiving an unexpected call from her wayfinding ancestors, Moana journeys alongside Maui and a new crew to the far seas of Oceania and into dangerous, long-lost waters for an adventure unlike anything she's ever faced.",
    release_date: '2024-11-27',
    vote_average: 7.1,
    genre_ids: [16, 12, 10751, 35],
    poster_path: '/4YZpsylmjHbqeWzjKpUEF8gcLUV.jpg',
    backdrop_path: '/tEFAWz1sA6q3s7oD5i2c1r8v7z.jpg'
  },
  {
    id: 402431,
    title: 'Wicked',
    original_title: 'Wicked',
    overview: "In the land of Oz, Elphaba, an ostracized green-skinned girl, forms an unlikely bond with Glinda, a bubbly blonde. Their lives diverge as they encounter the Wonderful Wizard of Oz.",
    release_date: '2024-11-20',
    vote_average: 7.6,
    genre_ids: [18, 14, 10402],
    poster_path: '/c5Tq9bmneRpUCtQnTdaKLizvo0.jpg',
    backdrop_path: '/uKb22E5ww9bXhZ9L48PvWhUNAI.jpg'
  },
  {
    id: 912649,
    title: 'Venom: The Last Dance',
    original_title: 'Venom: The Last Dance',
    overview: "Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on Venom and Eddie's last dance.",
    release_date: '2024-10-22',
    vote_average: 6.8,
    genre_ids: [28, 878, 12],
    poster_path: '/aosm8Vh92BdBt6RAjsSpbd8bm8bac.jpg',
    backdrop_path: '/3V4kLQg0kSqPLctI5ziYWMEAZYF.jpg'
  },
  {
    id: 558449,
    title: 'Gladiator II',
    original_title: 'Gladiator II',
    overview: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome.',
    release_date: '2024-11-13',
    vote_average: 6.9,
    genre_ids: [28, 12, 18],
    poster_path: '/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    backdrop_path: '/euYIwmwkmz95mnEx7vGJW1hvV7J.jpg'
  },
  {
    id: 845781,
    title: 'Red One',
    original_title: 'Red One',
    overview: "After Santa Claus (code name: RED ONE) is kidnapped, the North Pole's Head of Security must team up with the world's most infamous bounty hunter in a globe-trotting, action-packed mission to save Christmas.",
    release_date: '2024-10-31',
    vote_average: 7.0,
    genre_ids: [28, 14, 35],
    poster_path: '/cdqLnri3NEGcmfnqwk2TSIYohRF.jpg',
    backdrop_path: '/cjEcqdRdPQJhYm3btAc0Pgn4By1.jpg'
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    original_title: 'Deadpool & Wolverine',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    release_date: '2024-07-24',
    vote_average: 7.7,
    genre_ids: [28, 35, 878],
    poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: '/yDHYTfA3R0jFYba16jBB1jv82EU.jpg'
  },
  {
    id: 1184918,
    title: 'The Wild Robot',
    original_title: 'The Wild Robot',
    overview: "After a shipwreck, an intelligent robot called Roz is stranded on an uninhabited island. To survive the harsh environment, Roz bonds with the island's animals and cares for an orphaned baby goose.",
    release_date: '2024-09-12',
    vote_average: 8.4,
    genre_ids: [16, 878, 10751],
    poster_path: '/wTnV3PCVW5O92JMrFvvrRil39io.jpg',
    backdrop_path: '/mQZJoIhTEkNhCYJsGUtH7yE2vG5.jpg'
  },
  {
    id: 933260,
    title: 'The Substance',
    original_title: 'The Substance',
    overview: 'A fading celebrity decides to use a black market drug, a cell-replicating substance that temporarily creates a younger, better version of herself.',
    release_date: '2024-09-07',
    vote_average: 7.3,
    genre_ids: [27, 878],
    poster_path: '/lqoMzCcZYEFK729Fc65qIzczcrq.jpg',
    backdrop_path: '/7h6r9Wspn5xadNkAC65b4c10M0j.jpg'
  }
];

/**
 * Fetch Now Playing Movies from TMDB
 * GET https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1
 */
export const fetchTmdbNowPlaying = async (page = 1) => {
  const cacheKey = `tmdb_now_playing_${page}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  try {
    const apiKey = getApiKey();
    const url = `${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=${page}&api_key=${apiKey}`;
    const res = await fetch(url, {
      headers: getHeaders()
    });

    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    let results = data.results || [];

    // Filter from frontend side: keep only movies with valid poster and backdrop images
    results = results.filter((m) => m && m.poster_path && m.backdrop_path);

    // Swap 1st and 2nd movies: 1 is show in 2 and 2 is show in 1 (movie 2 used as hero)
    if (results.length >= 2) {
      const temp = results[0];
      results[0] = results[1];
      results[1] = temp;
    }

    if (results.length > 0) {
      tmdbCache.set(cacheKey, results);
      return results;
    }
  } catch (err) {
    console.warn('Live TMDB now playing fetch failed, using high-def fallback dataset:', err.message);
  }

  // Gracefully use high-definition fallback dataset with 1-2 swapped
  const fallbackSwapped = [...FALLBACK_TMDB_NOW_PLAYING];
  if (fallbackSwapped.length >= 2) {
    const temp = fallbackSwapped[0];
    fallbackSwapped[0] = fallbackSwapped[1];
    fallbackSwapped[1] = temp;
  }
  tmdbCache.set(cacheKey, fallbackSwapped);
  return fallbackSwapped;
};

/**
 * Fetch Popular Movies from TMDB
 */
export const fetchTmdbPopularMovies = async (page = 1) => {
  const cacheKey = `tmdb_popular_${page}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  try {
    const apiKey = getApiKey();
    const res = await fetch(`${TMDB_BASE_URL}/movie/popular?language=en-US&page=${page}&api_key=${apiKey}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    const results = (data.results || []).filter((m) => m && (m.poster_path || m.backdrop_path));
    if (results.length > 0) {
      tmdbCache.set(cacheKey, results);
      return results;
    }
  } catch (err) {
    console.warn('Failed to fetch TMDB popular movies:', err.message);
  }

  return FALLBACK_TMDB_NOW_PLAYING;
};

/**
 * Fetch Trending Movies
 */
export const fetchTmdbTrendingMovies = async (timeWindow = 'week') => {
  const cacheKey = `tmdb_trending_${timeWindow}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  try {
    const apiKey = getApiKey();
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/${timeWindow}?language=en-US&api_key=${apiKey}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    const results = (data.results || []).filter((m) => m && (m.poster_path || m.backdrop_path));
    if (results.length > 0) {
      tmdbCache.set(cacheKey, results);
      return results;
    }
  } catch (err) {
    console.warn('Failed to fetch TMDB trending movies:', err.message);
  }

  return FALLBACK_TMDB_NOW_PLAYING;
};

/**
 * Search TMDB Movies
 */
export const searchTmdbMovies = async (query) => {
  if (!query || !query.trim()) return [];
  const cacheKey = `tmdb_search_${query.trim().toLowerCase()}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  try {
    const apiKey = getApiKey();
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query.trim())}&include_adult=false&language=en-US&page=1&api_key=${apiKey}`,
      { headers: getHeaders() }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];
    tmdbCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.warn('Failed to search TMDB:', err.message);
    return [];
  }
};

/**
 * Search TMDB specifically by Title & optional Year
 */
export const searchTmdbMovieByTitle = async (title, year) => {
  try {
    const apiKey = getApiKey();
    const cleanTitle = title
      .replace(/[\(\[\{].*?[\)\]\}]/g, '')
      .replace(/19\d\d|20\d\d/g, '')
      .trim();

    let url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(cleanTitle)}&include_adult=false&language=en-US&page=1&api_key=${apiKey}`;
    if (year) {
      url += `&year=${year}`;
    }

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch (err) {
    console.warn(`TMDB search failed for "${title}":`, err.message);
    return null;
  }
};

/**
 * Fetch Full Movie Details from TMDB
 */
export const fetchTmdbMovieDetails = async (tmdbId) => {
  if (!tmdbId) return null;
  const cacheKey = `tmdb_details_${tmdbId}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  // Check fallback list first for instant offline response
  const localMatch = FALLBACK_TMDB_NOW_PLAYING.find((m) => m.id === Number(tmdbId));
  if (localMatch) {
    return localMatch;
  }

  try {
    const apiKey = getApiKey();
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?append_to_response=credits&language=en-US&api_key=${apiKey}`,
      { headers: getHeaders() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    tmdbCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn(`TMDB movie details failed for ID ${tmdbId}:`, err.message);
    return null;
  }
};

/**
 * Fetch Popular TV Series from TMDB
 */
export const fetchTmdbPopularSeries = async (page = 1) => {
  const cacheKey = `tmdb_series_popular_${page}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  try {
    const apiKey = getApiKey();
    const res = await fetch(`${TMDB_BASE_URL}/tv/popular?language=en-US&page=${page}&api_key=${apiKey}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    const results = data.results || [];
    tmdbCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.warn('Failed to fetch TMDB popular series:', err.message);
    return [];
  }
};

/**
 * Fetch TV Series Details from TMDB
 */
export const fetchTmdbSeriesDetails = async (seriesId) => {
  if (!seriesId) return null;
  const cacheKey = `tmdb_series_details_${seriesId}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  try {
    const apiKey = getApiKey();
    const res = await fetch(`${TMDB_BASE_URL}/tv/${seriesId}?language=en-US&api_key=${apiKey}`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    tmdbCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn(`TMDB series details failed for ID ${seriesId}:`, err.message);
    return null;
  }
};

/**
 * Fetch Season and Episodes details from TMDB
 */
export const fetchTmdbSeasonDetails = async (seriesId, seasonNumber = 1) => {
  const cacheKey = `tmdb_season_${seriesId}_${seasonNumber}`;
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey);

  try {
    const apiKey = getApiKey();
    const res = await fetch(`${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?language=en-US&api_key=${apiKey}`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    tmdbCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn(`TMDB season details failed for series ${seriesId} season ${seasonNumber}:`, err.message);
    return null;
  }
};

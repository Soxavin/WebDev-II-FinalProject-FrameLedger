// tmdb.js - TMDB API wrapper. Wrapped in an IIFE to keep request() private.

const TMDB = (() => {
  const { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE } = CONFIG;

  // Core fetch helper - builds the URL, appends the API key, checks errors, parses JSON
  const request = async (endpoint, params = {}) => {
    // Build the full URL using the URL API so params are encoded safely
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

    // Every TMDB v3 request requires the api_key param
    url.searchParams.set('api_key', TMDB_API_KEY);

    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());

    // If the HTTP status is not 2xx, extract TMDB's error message and throw
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.status_message || `TMDB error ${res.status}`);
    }

    return res.json();
  };

  // Search movies by title
  const searchMovies = (query, page = 1) =>
    request('/search/movie', { query, page, include_adult: false });

  // Full detail for one film (title, overview, genres, runtime, backdrop, etc.)
  const getMovieDetails = (movieId) =>
    request(`/movie/${movieId}`);

  // Trailers and teasers - we filter to YouTube only in movie.js
  const getMovieVideos = (movieId) =>
    request(`/movie/${movieId}/videos`);

  // Audience reviews - not all films have them, we show up to 3
  const getMovieReviews = (movieId) =>
    request(`/movie/${movieId}/reviews`);

  // Films similar to a given one
  const getSimilarMovies = (movieId, page = 1) =>
    request(`/movie/${movieId}/similar`, { page });

  // Browse/filter without a search query (used by discover mode)
  const discoverMovies = (params = {}) =>
    request('/discover/movie', params);

  // Full genre list - used to populate the discover dropdown
  const getGenres = () =>
    request('/genre/movie/list');

  // Build a full image URL from a TMDB poster path.
  // TMDB only returns paths like '/abc123.jpg' - we prepend the CDN base + size.
  // Common sizes: w92, w185, w342, w500, w780, original
  const posterUrl = (path, size = 'w500') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

  // Same for backdrop images (used as the blurred background on the detail page)
  const backdropUrl = (path, size = 'w1280') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

  // Expose only the public API - request() stays private
  return {
    searchMovies,
    getMovieDetails,
    getMovieVideos,
    getMovieReviews,
    getSimilarMovies,
    discoverMovies,
    getGenres,
    posterUrl,
    backdropUrl,
  };
})();

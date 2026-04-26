// tmdb.js - wrapper for all TMDB API calls. IIFE keeps request() private.

const TMDB = (() => {
  const { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE } = CONFIG;

  // handles all fetch calls — adds the API key, throws on bad responses
  const request = async (endpoint, params = {}) => {
    // URL() handles param encoding so we don't have to escape anything manually
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

    url.searchParams.set('api_key', TMDB_API_KEY);

    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());

    // throw on non-2xx so callers don't need to check res.ok themselves
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.status_message || `TMDB error ${res.status}`);
    }

    return res.json();
  };

  // Search movies by title
  const searchMovies = (query, page = 1) =>
    request('/search/movie', { query, page, include_adult: false });

  // Full detail for one film (title, overview, genres, runtime, etc.)
  const getMovieDetails = (movieId) =>
    request(`/movie/${movieId}`);

  // Trailers and teasers — we filter to YouTube only in movie.js
  const getMovieVideos = (movieId) =>
    request(`/movie/${movieId}/videos`);

  // Audience reviews — not all films have them, we show up to 3
  const getMovieReviews = (movieId) =>
    request(`/movie/${movieId}/reviews`);

  // Films similar to a given one
  const getSimilarMovies = (movieId, page = 1) =>
    request(`/movie/${movieId}/similar`, { page });

  // Browse/filter without a search query (used by discover mode)
  const discoverMovies = (params = {}) =>
    request('/discover/movie', params);

  // Full genre list — used to populate the discover dropdown
  const getGenres = () =>
    request('/genre/movie/list');

  // TMDB gives us a path like '/abc.jpg' — we prepend the CDN base and size to make a real URL
  const posterUrl = (path, size = 'w500') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

  // same thing but for wider backdrop images
  const backdropUrl = (path, size = 'w1280') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

  // request() stays private, everything else gets exported
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

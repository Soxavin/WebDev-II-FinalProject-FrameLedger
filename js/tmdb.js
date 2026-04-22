// =============================================
//  tmdb.js - TMDB API Module
//
//  Centralises every call made to The Movie
//  Database (TMDB) API. All functions return
//  Promises, so callers can use async/await.
//
//  Why an IIFE?
//  The whole module is wrapped in an
//  Immediately Invoked Function Expression:
//    const TMDB = (() => { ... })();
//  This keeps internal helpers (like `request`)
//  private, they can't be called from outside
//  this file. Only the functions in the final
//  `return { ... }` are public.
//
//  Endpoints used:
//  GET /search/movie          -> searchMovies()
//  GET /movie/:id             -> getMovieDetails()
//  GET /movie/:id/videos      -> getMovieVideos()
//  GET /movie/:id/similar     -> getSimilarMovies()
//  GET /discover/movie        -> discoverMovies()
//  GET /genre/movie/list      -> getGenres()
//
//  Depends on: config.js (must load first)
// =============================================

const TMDB = (() => {
  // Pull what we need from the global CONFIG object
  const { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE } = CONFIG;

  // --------------------------------------------------
  //  request() - private core fetch wrapper
  //
  //  All public functions go through this instead of
  //  calling fetch() directly. It handles:
  //    - Appending the API key to every request
  //    - Appending any extra query params
  //    - Checking for HTTP errors (res.ok)
  //    - Parsing the JSON body
  //    - Throwing a descriptive error on failure
  //
  //  @param {string} endpoint  - e.g. '/search/movie'
  //  @param {object} params    - additional query params
  //  @returns {Promise<object>} parsed JSON response
  // --------------------------------------------------
  const request = async (endpoint, params = {}) => {
    // Build the full URL using the URL API so params are encoded safely
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

    // Every TMDB v3 request requires the api_key param
    url.searchParams.set('api_key', TMDB_API_KEY);

    // Append any extra params passed by the caller
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());

    // If the HTTP status is not 2xx, extract TMDB's error message and throw
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.status_message || `TMDB error ${res.status}`);
    }

    return res.json();
  };

  // --------------------------------------------------
  //  searchMovies() - search by title
  //  Used by: search.js (home page search bar)
  //
  //  @param {string} query  - user's search text
  //  @param {number} page   - pagination page (default 1)
  // --------------------------------------------------
  const searchMovies = (query, page = 1) =>
    request('/search/movie', { query, page, include_adult: false });

  // --------------------------------------------------
  //  getMovieDetails() - full detail for one movie
  //  Used by: movie.js (detail page)
  //  Returns: title, overview, genres, runtime,
  //           tagline, vote_average, backdrop, etc.
  // --------------------------------------------------
  const getMovieDetails = (movieId) =>
    request(`/movie/${movieId}`);

  // --------------------------------------------------
  //  getMovieVideos() - trailers and teasers
  //  Used by: movie.js (trailer embed section)
  //  We filter results to YouTube trailers/teasers only
  // --------------------------------------------------
  const getMovieVideos = (movieId) =>
    request(`/movie/${movieId}/videos`);

  // --------------------------------------------------
  //  getMovieReviews() - user reviews for a movie
  //  Used by: movie.js (reviews section)
  //  Returns: author, content, rating, created_at
  //  Note: not all movies have reviews. We show up
  //  to 3 and truncate long ones.
  // --------------------------------------------------
  const getMovieReviews = (movieId) =>
    request(`/movie/${movieId}/reviews`);

  // --------------------------------------------------
  //  getSimilarMovies() - films similar to a given one
  //  Used by: movie.js (similar films section)
  // --------------------------------------------------
  const getSimilarMovies = (movieId, page = 1) =>
    request(`/movie/${movieId}/similar`, { page });

  // --------------------------------------------------
  //  discoverMovies() - filter/browse without a query
  //  Used by: discover.js (Discover mode on home page)
  //  Accepts params like: with_genres, vote_average.gte,
  //  sort_by, vote_count.gte, include_adult, page
  // --------------------------------------------------
  const discoverMovies = (params = {}) =>
    request('/discover/movie', params);

  // --------------------------------------------------
  //  getGenres() - full list of TMDB genre IDs + names
  //  Used by: discover.js to populate the genre dropdown
  //  e.g. { id: 28, name: "Action" }
  // --------------------------------------------------
  const getGenres = () =>
    request('/genre/movie/list');

  // --------------------------------------------------
  //  posterUrl() - build a full image URL for a poster
  //
  //  TMDB only returns a path like '/abc123.jpg'.
  //  We prepend the CDN base + a size string.
  //  Common sizes: w92, w185, w342, w500, w780, original
  //
  //  @param {string|null} path  - poster_path from the API
  //  @param {string}      size  - CDN size prefix
  //  @returns {string|null}
  // --------------------------------------------------
  const posterUrl = (path, size = 'w500') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

  // --------------------------------------------------
  //  backdropUrl() - build a full image URL for a backdrop
  //  Used by: movie.js to set the blurred background
  // --------------------------------------------------
  const backdropUrl = (path, size = 'w1280') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

  // Expose only the public API - `request` stays private
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

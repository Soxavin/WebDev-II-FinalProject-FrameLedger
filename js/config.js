// config.js - API credentials and base URLs. Must load before all other scripts.

const CONFIG = {
  // Your TMDB v3 API key
  TMDB_API_KEY: '8425c879c8ddb5dc7b0d66ebd15d1d50',

  TMDB_BASE_URL: 'https://api.themoviedb.org/3',

  // posterUrl() and backdropUrl() append a size string (e.g. 'w500') to build the full image URL
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',

  // No trailing slash
  MOCKAPI_BASE_URL: 'https://69beacb317c3d7d97792ae6c.mockapi.io',

  MOCKAPI_RESOURCE: 'watchlist',
};

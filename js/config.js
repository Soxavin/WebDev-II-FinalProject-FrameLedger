// =============================================
//  config.js - Global API Configuration
//
//  This is the single source of truth for all
//  API credentials and base URLs used across
//  the app. If any of these values change,
//  you only need to update them here.
//
//  How to set it up:
//  1. Replace TMDB_API_KEY with your key from:
//     https://www.themoviedb.org/settings/api
//  2. Replace MOCKAPI_BASE_URL with your project
//     URL from mockapi.io (no trailing slash).
//
//  Important: this file must be loaded FIRST in
//  every HTML page because everything else
//  depends on CONFIG being defined.
// =============================================

const CONFIG = {
  // Your TMDB v3 API key
  TMDB_API_KEY: '8425c879c8ddb5dc7b0d66ebd15d1d50',

  // Base URL for all TMDB API v3 endpoints
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',

  // Base URL for the TMDB image CDN.
  // posterUrl() and backdropUrl() append a size string (e.g. 'w500') per request.
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',

  // Your MockAPI project base URL - no trailing slash
  MOCKAPI_BASE_URL: 'https://69beacb317c3d7d97792ae6c.mockapi.io',

  // The MockAPI resource name - must exactly match what you named it on mockapi.io
  MOCKAPI_RESOURCE: 'watchlist',
};

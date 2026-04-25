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
  TMDB_API_KEY: '',

  TMDB_BASE_URL: 'https://api.themoviedb.org/3',

  // Base URL for the TMDB image CDN.
  // posterUrl() and backdropUrl() append a size string (e.g. 'w500') per request.
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',

  // No trailing slash
  MOCKAPI_BASE_URL: 'https://69beacb317c3d7d97792ae6c.mockapi.io',

  MOCKAPI_RESOURCE: 'watchlist',
};

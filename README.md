# FrameLedger

**Course:** INFO 251 - Web Development II - Spring 2026  
**Team:** LOEUNG Soxavin, LACH Sovitou  
**Group size:** 2 members  
**Repository:** https://github.com/Soxavin/WebDev-II-FinalProject-FrameLedger

---

## Overview

FrameLedger is a film tracking web app built from scratch for the Web Development II final project. You can search for any movie, browse by genre and rating, view a full detail page with the trailer and reviews, and maintain a personal watchlist where you can set a status, leave notes, and give each film your own star rating.

The app runs entirely in the browser with no backend or framework — just HTML, CSS, and vanilla JavaScript communicating with two external APIs (TMDB and MockAPI).

---

## Tech Stack

- **Languages:** HTML5, CSS3, JavaScript (ES6+)
- **APIs:** TMDB for movie data, MockAPI for watchlist persistence
- **Browser APIs used:** `fetch`, `localStorage`, `URL`, `URLSearchParams`, `history.replaceState`, `Promise.all`
- **Deployment:** Fully client-side; no build step or server required beyond a local file server for development

---

## Pages

**Home (`index.html`)** - Two modes in one page. Search mode performs a live debounced search against TMDB as you type and keeps your last 5 searches in localStorage. Discover mode lets you filter by genre and minimum rating, or use Surprise Me to get a random result.

**Movie detail (`pages/movie.html`)** - Displays the poster, backdrop, trailer, similar films, and audience reviews. All four TMDB requests are fired in parallel using `Promise.all`, keeping load time low. Films can be added to the watchlist directly from this page.

**Watchlist (`pages/watchlist.html`)** - Lists everything saved, with a stats bar showing totals by status. Entries can be filtered, sorted four ways, inline-edited, or deleted via a confirmation modal. Counts update immediately after each change.

---

## Project Structure

The JavaScript is split into 8 files, each with a single responsibility:

| File | Responsibility |
|---|---|
| `config.js` | API keys and base URLs |
| `tmdb.js` | All TMDB requests, wrapped in a private `request()` function |
| `watchlist.js` | MockAPI CRUD operations - GET, POST, PUT, DELETE |
| `ui.js` | Shared helpers: Toast notifications, Spinner, card builder, form validation, `escapeHtml` |
| `search.js` | Home page search, debounce timer, history chips, pagination |
| `discover.js` | Genre and rating filters, Surprise Me, mode switching |
| `movie.js` | Detail page - parallel fetch, trailer, reviews, watchlist form |
| `watchlist-page.js` | Watchlist UI - filter, sort, inline edit, delete modal, stats, star picker |

Load order on every page: `config.js → tmdb.js → watchlist.js → ui.js → [page script]`. Each file depends on the ones before it, so the order is fixed.

---

## APIs

**TMDB** is the primary data source, used for movie search, details, trailers, similar films, genre lists, and reviews. It is a free public REST API.

- Base URL: `https://api.themoviedb.org/3`
- Auth: `?api_key=` query parameter
- Docs: https://developer.themoviedb.org

**MockAPI** serves as the persistence layer. It provides a live REST endpoint that supports full CRUD, allowing the app to demonstrate POST, PUT, and DELETE without requiring a custom backend.

- Base URL: `https://69beacb317c3d7d97792ae6c.mockapi.io`
- No authentication required
- Docs: https://mockapi.io

---

## Technical Decisions

**Parallel fetching on the detail page.** The movie detail page needs data from four separate TMDB endpoints. Rather than awaiting each one sequentially, all four requests are fired at the same time using `Promise.all`:

```javascript
const [movie, videos, similar, reviews] = await Promise.all([
  TMDB.getMovieDetails(movieId),
  TMDB.getMovieVideos(movieId),
  TMDB.getSimilarMovies(movieId),
  TMDB.getMovieReviews(movieId),
]);
```

Sequential requests take roughly 1200ms; running them in parallel brings this down to around 300ms.

**Debouncing the search input.** Without debouncing, a live search would fire a new TMDB request on every keystroke. A 400ms debounce timer means the request only goes out once the user pauses typing, which keeps the API usage reasonable while the results still feel responsive.

**Double-submit guards.** Any action that triggers a POST, PUT, or DELETE sets a boolean flag (`isSubmitting`, `isSaving`, or `isDeleting`) before the request fires and clears it in the `finally` block. This prevents duplicate requests from rapid clicks or slow network responses.

**XSS protection via `escapeHtml()`.** All content from external APIs or user input is passed through `escapeHtml()` before being written to `innerHTML`. The function creates a temporary DOM text node and reads back `.innerHTML`, letting the browser handle the escaping. This covers cases like movie titles or review text that may contain special characters.

**`try/catch/finally` on every fetch.** The `finally` block runs regardless of whether the request succeeds or fails, ensuring buttons are always re-enabled and loading states are always cleared. Errors show an inline message and a toast notification so the user knows what happened.

---

## Setup

### 1. Add your API keys

Open `js/config.js` and fill in your credentials:

```javascript
const CONFIG = {
  TMDB_API_KEY:     'your_tmdb_api_key',
  TMDB_BASE_URL:    'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE:  'https://image.tmdb.org/t/p',
  MOCKAPI_BASE_URL: 'https://your-project.mockapi.io',
  MOCKAPI_RESOURCE: 'watchlist',
};
```

A free TMDB API key can be obtained at https://www.themoviedb.org/settings/api

### 2. Run it locally

In VS Code, right-click `index.html` and select **Open with Live Server** (requires the Live Server extension).

---

## Team Contributions

| Developer | Contributions |
|---|---|
| LOEUNG Soxavin | Project architecture, MockAPI CRUD integration, TMDB API integration, home page (search + discover), movie detail page |
| LACH Sovitou | CSS, watchlist page, shared UI utilities (`ui.js`), discover mode filters and Surprise Me feature |

---

## References

Anthropic. (2026). *Claude* (Claude Sonnet 4.6) [Large language model]. https://claude.ai

Carrois Apostrophe. (2012). *Share Tech Mono* [Font]. Google Fonts. https://fonts.google.com/specimen/Share+Tech+Mono

MockAPI. (n.d.). *MockAPI: REST API prototyping tool*. https://mockapi.io

Mozilla. (n.d.). *MDN Web Docs: JavaScript reference*. https://developer.mozilla.org/en-US/docs/Web/JavaScript

Sørensen, C. E. (2011). *Playfair Display* [Font]. Google Fonts. https://fonts.google.com/specimen/Playfair+Display

The Movie Database. (n.d.). *TMDB API documentation*. https://developer.themoviedb.org

---

## Academic Integrity

This project was completed by us. Claude was used on occasions, mainly to help debug errors when we were stuck, to improve and refactor code and ideas, and as a reference for documentation. The TMDB and MockAPI docs were referenced throughout development.

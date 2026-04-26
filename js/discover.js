// discover.js - Discover mode filters and results.

(() => {
  const modeSearch   = document.getElementById('modeSearch');
  const modeDiscover = document.getElementById('modeDiscover');
  const searchPane   = document.getElementById('searchPane');
  const discoverPane = document.getElementById('discoverPane');

  const genreSelect   = document.getElementById('genreSelect');
  const ratingSelect  = document.getElementById('ratingSelect');
  const sortSelect    = document.getElementById('sortSelect');
  const discoverBtn   = document.getElementById('discoverBtn');
  const discoverError = document.getElementById('discoverError');

  // Shared DOM elements also used by search.js
  const grid          = document.getElementById('movieGrid');
  const initialState  = document.getElementById('initialState');
  const resultsHeader = document.getElementById('resultsHeader');
  const resultsLabel  = document.getElementById('resultsLabel');
  const paginationEl  = document.getElementById('pagination');
  const prevBtn       = document.getElementById('prevBtn');
  const nextBtn       = document.getElementById('nextBtn');
  const pageInfo      = document.getElementById('pageInfo');

  let currentPage = 1;
  let totalPages  = 1;
  let lastParams  = {};

  // switches between the two panes. in discover mode we use .onclick for pagination
  // so it overrides the addEventListener that search.js already registered
  const switchMode = (mode) => {
    if (mode === 'search') {
      modeSearch.classList.add('active');
      modeDiscover.classList.remove('active');
      searchPane.style.display   = 'block';
      discoverPane.style.display = 'none';
      // Release pagination back to search.js
      prevBtn.onclick = null;
      nextBtn.onclick = null;
    } else {
      modeDiscover.classList.add('active');
      modeSearch.classList.remove('active');
      discoverPane.style.display = 'block';
      searchPane.style.display   = 'none';
      // Take over pagination, reusing lastParams to re-fetch with the same filters
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          doDiscover(lastParams, currentPage);
        }
      };
      nextBtn.onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          doDiscover(lastParams, currentPage);
        }
      };
    }
  };

  modeSearch.addEventListener('click',   () => switchMode('search'));
  modeDiscover.addEventListener('click', () => switchMode('discover'));

  // The "Discover" nav link on index.html - intercept so we switch mode in-page
  // instead of navigating away
  const navDiscover = document.getElementById('navDiscover');
  if (navDiscover) {
    navDiscover.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode('discover');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // If arriving from another page via ?mode=discover, auto-switch
  if (getParam('mode') === 'discover' || window.location.hash === '#discover') {
    switchMode('discover');
  }

  // load genres for the dropdown — if it fails it just stays on "Any Genre"
  const loadGenres = async () => {
    try {
      const data = await TMDB.getGenres();
      data.genres.forEach(({ id, name }) => {
        const opt = document.createElement('option');
        opt.value       = id;
        opt.textContent = name;
        genreSelect.appendChild(opt);
      });
    } catch (_) {
      // not a big deal if this fails
    }
  };

  loadGenres();

  const renderDiscoverResults = (movies, page, total, label) => {
    initialState.style.display = 'none';
    grid.innerHTML = '';

    if (!movies.length) {
      StateMessage.show(grid, '🎞️', 'No films found for these filters. Try adjusting your selection.');
      resultsHeader.style.display = 'none';
      paginationEl.style.display  = 'none';
      return;
    }

    resultsHeader.style.display = 'flex';
    resultsLabel.textContent    = label;

    movies.forEach((movie) => {
      grid.appendChild(buildMovieCard(movie, 'pages/movie.html'));
    });

    if (total > 1) {
      paginationEl.style.display = 'flex';
      pageInfo.textContent = `Page ${page} of ${total}`;
      prevBtn.disabled = page <= 1;
      nextBtn.disabled = page >= total;
    } else {
      paginationEl.style.display = 'none';
    }
  };

  // build params from the filter dropdowns and fetch. vote_count.gte=100 stops films
  // with 1-2 votes from showing up just because they have a perfect score
  const doDiscover = async (params, page = 1) => {
    discoverError.classList.remove('visible');
    Spinner.show(grid, 'Searching the archives...');
    initialState.style.display  = 'none';
    resultsHeader.style.display = 'none';
    paginationEl.style.display  = 'none';

    const apiParams = {
      sort_by:          params.sort || 'popularity.desc',
      'vote_count.gte': 100,
      include_adult:    false,
      page,
    };

    if (params.genre)  apiParams.with_genres         = params.genre;
    if (params.rating) apiParams['vote_average.gte'] = params.rating;

    try {
      const data = await TMDB.discoverMovies(apiParams);
      totalPages = Math.min(data.total_pages, 500); // TMDB caps at 500

      // Build a readable results label from the active filters
      const genreName  = params.genre
        ? genreSelect.options[genreSelect.selectedIndex].text
        : null;
      const ratingText = params.rating ? `${params.rating}+ ★` : null;
      const parts      = [genreName, ratingText].filter(Boolean);
      const label      = parts.length
        ? `Discover - ${parts.join(', ')}`
        : 'Discover - All Films';

      renderDiscoverResults(data.results, page, totalPages, label);
    } catch (err) {
      StateMessage.show(grid, '⚠️', 'Could not fetch results. Please try again.');
      Toast.error('Discover failed: ' + err.message);
    }
  };

  // Discover button - reads filters, saves to lastParams for pagination reuse
  discoverBtn.addEventListener('click', () => {
    lastParams = {
      genre:  genreSelect.value  || '',
      rating: ratingSelect.value || '',
      sort:   sortSelect.value   || 'popularity.desc',
    };
    currentPage = 1;
    doDiscover(lastParams, 1);
  });

  // Surprise Me - picks a random genre and a random starting page (1-3)
  // so results feel different each time
  const surpriseBtn = document.getElementById('surpriseBtn');
  if (surpriseBtn) {
    surpriseBtn.addEventListener('click', async () => {
      const genreOptions = Array.from(genreSelect.options).filter((o) => o.value);
      if (!genreOptions.length) {
        Toast.info('Genres still loading, try again in a moment.');
        return;
      }

      const randomGenre = genreOptions[Math.floor(Math.random() * genreOptions.length)];

      // Update the dropdowns to reflect the random pick
      genreSelect.value  = randomGenre.value;
      ratingSelect.value = '';
      sortSelect.value   = 'popularity.desc';

      const randomPage = Math.floor(Math.random() * 3) + 1;

      lastParams = {
        genre:  randomGenre.value,
        rating: '',
        sort:   'popularity.desc',
      };
      currentPage = randomPage;

      Toast.info(`🎲 Showing random ${randomGenre.text} films...`);
      doDiscover(lastParams, randomPage);
    });
  }

  // Auto-trigger a default discover fetch when switching to discover mode
  // if the grid is currently empty
  modeDiscover.addEventListener('click', () => {
    if (!grid.children.length || grid.querySelector('.state-message')) {
      lastParams  = { genre: '', rating: '', sort: 'popularity.desc' };
      currentPage = 1;
      doDiscover(lastParams, 1);
    }
  });
})();

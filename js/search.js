// search.js - Home page search, debounce, and pagination.

(() => {
  const form           = document.getElementById('searchForm');
  const input          = document.getElementById('searchInput');
  const clearBtn       = document.getElementById('searchClearBtn');
  const errorEl        = document.getElementById('searchError');
  const grid           = document.getElementById('movieGrid');
  const initialState   = document.getElementById('initialState');
  const resultsHeader  = document.getElementById('resultsHeader');
  const resultsLabel   = document.getElementById('resultsLabel');
  const paginationEl   = document.getElementById('pagination');
  const prevBtn        = document.getElementById('prevBtn');
  const nextBtn        = document.getElementById('nextBtn');
  const pageInfo       = document.getElementById('pageInfo');
  const resultsSection = document.getElementById('resultsSection');

  let currentQuery  = '';
  let currentPage   = 1;
  let totalPages    = 1;
  let isSearching   = false;
  let debounceTimer = null;

  // 400ms feels fast enough to seem live without spamming the API on every keystroke
  const DEBOUNCE_MS = 400;
  const MIN_QUERY_LENGTH = 2;

  const updateClearBtn = () => {
    if (clearBtn) {
      clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
    }
  };

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      updateClearBtn();
      clearTimeout(debounceTimer);
      errorEl.classList.remove('visible');
      input.classList.remove('error');
      grid.innerHTML = '';
      initialState.style.display  = 'block';
      resultsHeader.style.display = 'none';
      paginationEl.style.display  = 'none';
    });
  }

  const validateSearch = (query) => {
    if (!Validate.required(query)) {
      errorEl.textContent = 'Please enter a film title to search.';
      errorEl.classList.add('visible');
      input.classList.add('error');
      return false;
    }
    errorEl.classList.remove('visible');
    input.classList.remove('error');
    return true;
  };

  // keep the last 5 searches in localStorage as clickable chips
  const HISTORY_KEY = 'fl_search_history';
  const MAX_HISTORY = 5;

  const getHistory = () => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch (_) { return []; }
  };

  const saveToHistory = (query) => {
    let history = getHistory();
    history = [query, ...history.filter((h) => h.toLowerCase() !== query.toLowerCase())];
    history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  };

  const renderResults = (movies, query, page, total) => {
    initialState.style.display = 'none';
    grid.innerHTML = '';

    if (!movies.length) {
      StateMessage.show(grid, '🔍', `No results found for "${escapeHtml(query)}"`);
      resultsHeader.style.display = 'none';
      paginationEl.style.display  = 'none';
      return;
    }

    resultsHeader.style.display = 'flex';
    resultsLabel.textContent = `${movies.length} results for "${query}"`;

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

    if (page === 1) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    saveToHistory(query);

    // put the query in the URL so the back button can restore results.
    // replaceState updates the address bar without reloading the page.
    if (page === 1) {
      const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const doSearch = async (query, page) => {
    if (isSearching) return;
    isSearching = true;

    Spinner.show(grid, 'Searching the archives...');
    initialState.style.display  = 'none';
    resultsHeader.style.display = 'none';
    paginationEl.style.display  = 'none';

    try {
      const data = await TMDB.searchMovies(query, page);
      totalPages = Math.min(data.total_pages, 500);
      renderResults(data.results, query, page, totalPages);
    } catch (err) {
      StateMessage.show(grid, '⚠️', 'Could not reach the server. Please try again.');
      Toast.error('Search failed: ' + err.message);
    } finally {
      isSearching = false;
    }
  };

  // debounced live search — each keystroke resets the timer
  input.addEventListener('input', () => {
    updateClearBtn();

    if (input.value.trim()) {
      errorEl.classList.remove('visible');
      input.classList.remove('error');
    }

    const query = input.value.trim();

    if (!query) {
      clearTimeout(debounceTimer);
      grid.innerHTML = '';
      initialState.style.display  = 'block';
      resultsHeader.style.display = 'none';
      paginationEl.style.display  = 'none';
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentQuery = query;
      currentPage  = 1;
      doSearch(currentQuery, currentPage);
    }, DEBOUNCE_MS);
  });

  // hitting Enter skips the debounce and searches right away
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!validateSearch(query)) return;

    clearTimeout(debounceTimer);
    currentQuery = query;
    currentPage  = 1;
    doSearch(currentQuery, currentPage);
  });

  const onPrev = () => {
    if (currentPage > 1) {
      currentPage--;
      doSearch(currentQuery, currentPage);
    }
  };

  const onNext = () => {
    if (currentPage < totalPages) {
      currentPage++;
      doSearch(currentQuery, currentPage);
    }
  };

  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);

  // Keyboard shortcuts: '/' focuses the search input, Escape clears it
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearTimeout(debounceTimer);
      input.value = '';
      updateClearBtn();
      input.blur();
      grid.innerHTML = '';
      initialState.style.display  = 'block';
      resultsHeader.style.display = 'none';
      paginationEl.style.display  = 'none';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      document.activeElement !== input &&
      document.activeElement.tagName !== 'SELECT' &&
      document.activeElement.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  // if there's a ?q= in the URL (e.g. coming back from a movie page), run the search automatically
  const q = getParam('q');
  if (q) {
    input.value = q;
    currentQuery = q;
    updateClearBtn();
    doSearch(q, 1);
  }

  updateClearBtn();

  const renderHistory = () => {
    const historyEl = document.getElementById('searchHistory');
    const chipsEl   = document.getElementById('searchHistoryChips');
    if (!historyEl || !chipsEl) return;

    const history = getHistory();
    if (!history.length) { historyEl.style.display = 'none'; return; }

    chipsEl.innerHTML = '';
    history.forEach((query) => {
      const chip = document.createElement('button');
      chip.className   = 'search-history__chip';
      chip.textContent = query;
      chip.type        = 'button';
      chip.addEventListener('click', () => {
        input.value  = query;
        currentQuery = query;
        currentPage  = 1;
        updateClearBtn();
        clearTimeout(debounceTimer);
        historyEl.style.display = 'none';
        doSearch(query, 1);
      });
      chipsEl.appendChild(chip);
    });

    historyEl.style.display = input.value.length === 0 ? 'block' : 'none';
  };

  input.addEventListener('focus', () => {
    if (!input.value.trim()) renderHistory();
  });

  document.addEventListener('click', (e) => {
    const historyEl = document.getElementById('searchHistory');
    if (historyEl && !historyEl.contains(e.target) && e.target !== input) {
      historyEl.style.display = 'none';
    }
  });

  renderHistory();
})();

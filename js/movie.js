// movie.js - Movie detail page. Fetches and renders all data for a single film.

(() => {
  // Read the movie ID from the URL: e.g. movie.html?id=550 gives '550'
  const movieId = getParam('id');

  const loadingState  = document.getElementById('loadingState');
  const detailContent = document.getElementById('detailContent');
  const errorState    = document.getElementById('errorState');

  // If no ID in the URL, show error immediately and stop
  if (!movieId) {
    loadingState.style.display = 'none';
    errorState.style.display   = 'block';
    return;
  }

  // Populates the hero section: poster, title, tagline, metadata row, genres, overview
  const renderDetails = (movie) => {
    document.title = `FrameLedger - ${movie.title}`;

    // Set the blurred backdrop image
    const backdrop = TMDB.backdropUrl(movie.backdrop_path);
    if (backdrop) {
      document.getElementById('backdrop').style.backgroundImage = `url('${backdrop}')`;
    }

    // Show the poster, or a placeholder div if none is available
    const posterEl  = document.getElementById('detailPoster');
    const posterSrc = TMDB.posterUrl(movie.poster_path, 'w500');
    if (posterSrc) {
      posterEl.src = posterSrc;
      posterEl.alt = movie.title;
    } else {
      posterEl.outerHTML = `<div class="detail-poster-placeholder">🎬</div>`;
    }

    // Set back button to return to search results if ?q= is in the URL
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      const referrerQuery = getParam('q');
      if (referrerQuery) {
        backBtn.href = `../index.html?q=${encodeURIComponent(referrerQuery)}`;
      }
    }

    // Eyebrow line: release year, and original title if it differs from the English title
    const year = movie.release_date ? movie.release_date.substring(0, 4) : '-';
    document.getElementById('detailEyebrow').innerHTML =
      `${year}${movie.original_title !== movie.title
        ? ` &mdash; ${escapeHtml(movie.original_title)}`
        : ''}`;

    document.getElementById('detailTitle').textContent   = movie.title;
    document.getElementById('detailTagline').textContent = movie.tagline || '';
    if (!movie.tagline) {
      document.getElementById('detailTagline').style.display = 'none';
    }

    const metaRow = document.getElementById('detailMetaRow');
    const runtime = movie.runtime
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
      : '-';
    // Only show a rating if the film has actual votes; 0.0 with no votes is misleading
    const rating = movie.vote_count > 0 && movie.vote_average != null
      ? movie.vote_average.toFixed(1)
      : '-';
    const votes  = movie.vote_count   ? movie.vote_count.toLocaleString()    : '-';
    const lang   = movie.original_language ? movie.original_language.toUpperCase() : '-';

metaRow.innerHTML = `
        <div class="detail-meta-item">
          <span class="label">${'Rating'}</span>
          <span class="value gold">★ ${rating}</span>
        </div>
        <div class="detail-meta-item">
          <span class="label">${'Votes'}</span>
          <span class="value">${votes}</span>
        </div>
        <div class="detail-meta-item">
          <span class="label">${'Runtime'}</span>
          <span class="value">${runtime}</span>
        </div>
        <div class="detail-meta-item">
          <span class="label">${'Language'}</span>
          <span class="value">${lang}</span>
        </div>
        <div class="detail-meta-item">
          <span class="label">${'Status'}</span>
          <span class="value">${escapeHtml(movie.status || '-')}</span>
        </div>`;

    // Genre tags
    const genresEl = document.getElementById('detailGenres');
    if (movie.genres && movie.genres.length) {
      genresEl.innerHTML = movie.genres
        .map((g) => `<span class="genre-tag">${escapeHtml(g.name)}</span>`)
        .join('');
    }

    document.getElementById('detailOverview').textContent =
      movie.overview || 'No overview available.';
  };

  // Filters the videos response for YouTube trailers/teasers.
  // Prefers an official "Trailer" type over a "Teaser".
  // Embeds via youtube-nocookie.com to avoid tracking the user.
  const renderTrailer = (videos) => {
    const trailers = videos.results.filter(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    if (!trailers.length) return; // No trailer - section stays hidden

    const trailer   = trailers.find((v) => v.type === 'Trailer') || trailers[0];
    const section   = document.getElementById('trailerSection');
    const container = document.getElementById('trailerContainer');
    const divider   = document.getElementById('trailerDivider');

    section.style.display = 'block';
    divider.style.display = 'block';

    // rel=0 hides related videos, modestbranding=1 reduces YouTube branding
    container.innerHTML = `
      <div class="trailer-wrapper">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?rel=0&modestbranding=1"
          title="${escapeHtml(trailer.name)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>`;
  };

  // Shows up to 8 similar films using the same buildMovieCard() as the home page.
  // Note: linkPrefix is 'movie.html' not 'pages/movie.html' since we're already in /pages/.
  const renderSimilar = (movies) => {
    if (!movies.length) return;

    const section = document.getElementById('similarSection');
    const grid    = document.getElementById('similarGrid');
    const divider = document.getElementById('similarDivider');

    section.style.display = 'block';
    if (divider) divider.style.display = 'block';

    movies.slice(0, 8).forEach((movie) => {
      grid.appendChild(buildMovieCard(movie, 'movie.html'));
    });
  };

  // Sets up the "Add to Watchlist" form.
  // Checks if the film is already saved first, so we can show the right button state.
  const initWatchlistForm = async (movie) => {
    const form         = document.getElementById('addToWatchlistForm');
    const addBtn       = document.getElementById('addBtn');
    const viewBtn      = document.getElementById('viewWatchlistBtn');
    const noteInput    = document.getElementById('noteInput');
    const noteError    = document.getElementById('noteError');
    const formError    = document.getElementById('formError');
    const statusSelect = document.getElementById('statusSelect');
    const charCount    = document.getElementById('noteCharCount');

    // Double-submit guard - set to true while a POST is in-flight
    let isSubmitting = false;

    const updateCharCount = () => {
      if (charCount) {
        const len = noteInput.value.length;
        charCount.textContent = `${len} / 200`;
        charCount.style.color = len > 180 ? 'var(--red)' : 'var(--text-muted)';
      }
    };
    noteInput.addEventListener('input', updateCharCount);
    updateCharCount();

    // Check if already in the watchlist - pre-fill and disable Add if so
    try {
      const existing = await WatchlistAPI.findByTmdbId(movieId);
      if (existing) {
        addBtn.textContent    = '✓ In Watchlist';
        addBtn.disabled       = true;
        statusSelect.value    = existing.status;
        noteInput.value       = existing.note || '';
        viewBtn.style.display = 'inline-flex';
        updateCharCount();
      }
    } catch (_) {
      // If MockAPI is unreachable, fail silently - the form still works for adding
    }

    viewBtn.addEventListener('click', () => {
      window.location.href = 'watchlist.html';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      Validate.clearAll(form);
      formError.classList.remove('visible');

      const note   = noteInput.value.trim();
      const status = statusSelect.value;

      if (note && !Validate.maxLength(note, 200)) {
        Validate.showError(noteInput, noteError, 'Note must be 200 characters or fewer.');
        return;
      }

      isSubmitting       = true;
      addBtn.disabled    = true;
      addBtn.textContent = 'Adding...';

      // Store the fields we need on the watchlist page so it doesn't have to
      // re-fetch everything from TMDB just to display the entry
      const entry = {
        tmdbId:      movie.id,
        title:       movie.title,
        posterPath:  movie.poster_path  || '',
        releaseYear: movie.release_date ? movie.release_date.substring(0, 4) : '',
        rating:      movie.vote_count > 0 && movie.vote_average != null ? movie.vote_average.toFixed(1) : '',
        status,
        note,
        addedAt:     new Date().toISOString(),
      };

      try {
        await WatchlistAPI.add(entry);
        Toast.success(`"${movie.title}" added to your watchlist.`);
        addBtn.textContent    = '✓ In Watchlist';
        viewBtn.style.display = 'inline-flex';
      } catch (err) {
        // Unlock the form so the user can try again
        isSubmitting       = false;
        addBtn.disabled    = false;
        addBtn.textContent = 'Add to Watchlist';
        formError.textContent = 'Failed to add to watchlist. Please try again.';
        formError.classList.add('visible');
        Toast.error('Could not save to watchlist: ' + err.message);
      }
      // isSubmitting is NOT reset on success - once added the button stays disabled
    });
  };

  // Shows up to 3 audience reviews. Skips reviews shorter than 100 characters
  // since they don't add much. Long reviews get a "Read more" expand toggle.
  const renderReviews = (reviewsData) => {
    const reviews = reviewsData.results
      .filter((r) => r.content && r.content.length >= 100)
      .slice(0, 3);

    if (!reviews.length) return;

    const section  = document.getElementById('reviewsSection');
    const grid     = document.getElementById('reviewsGrid');
    const divider  = document.getElementById('reviewsDivider');

    section.style.display = 'block';
    divider.style.display = 'block';

    reviews.forEach((review) => {
      const date = review.created_at
        ? new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

      const ratingVal = review.author_details?.rating;
      const stars = ratingVal
        ? `<span class="review-card__rating">★ ${parseFloat(ratingVal).toFixed(1)}</span>`
        : '';

      const initial = (review.author || '?')[0].toUpperCase();

      const EXCERPT_LEN = 300;
      const isLong      = review.content.length > EXCERPT_LEN;
      const excerpt     = isLong
        ? escapeHtml(review.content.substring(0, EXCERPT_LEN)) + '…'
        : escapeHtml(review.content);
      const full        = escapeHtml(review.content);

      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-card__header">
          <div class="review-card__avatar">${escapeHtml(initial)}</div>
          <div class="review-card__meta">
            <span class="review-card__author">${escapeHtml(review.author || 'Anonymous')}</span>
            <span class="review-card__date">${escapeHtml(date)}</span>
          </div>
          ${stars}
        </div>
        <p class="review-card__body" id="reviewBody-${escapeHtml(review.id)}">${excerpt}</p>
        ${isLong ? `<button class="review-card__toggle" data-full="${encodeURIComponent(full)}" data-excerpt="${encodeURIComponent(excerpt)}">Read more</button>` : ''}`;

      if (isLong) {
        const toggle = card.querySelector('.review-card__toggle');
        const body   = card.querySelector('.review-card__body');
        let expanded = false;

        toggle.addEventListener('click', () => {
          expanded = !expanded;
          body.innerHTML    = expanded ? decodeURIComponent(toggle.dataset.full) : decodeURIComponent(toggle.dataset.excerpt);
          toggle.textContent = expanded ? 'Read less' : 'Read more';
        });
      }

      grid.appendChild(card);
    });
  };

  // Fires all four TMDB requests at the same time using Promise.all(),
  // then renders each section. Shows the error state if anything critical fails.
  const init = async () => {
    try {
      const [movie, videos, similar, reviews] = await Promise.all([
        TMDB.getMovieDetails(movieId),
        TMDB.getMovieVideos(movieId),
        TMDB.getSimilarMovies(movieId),
        TMDB.getMovieReviews(movieId),
      ]);

      renderDetails(movie);
      renderTrailer(videos);
      renderSimilar(similar.results);
      renderReviews(reviews);

      await initWatchlistForm(movie);

      loadingState.style.display  = 'none';
      detailContent.style.display = 'block';

    } catch (err) {
      loadingState.style.display = 'none';
      errorState.style.display   = 'block';

      const errMsg = document.getElementById('errorMsg');
      if (errMsg) {
        const returnLink = `<a href="../index.html" class="error-link">Return to search</a>`;
        if (err.message.includes('404') || err.message.toLowerCase().includes('not found')) {
          errMsg.innerHTML = `Movie not found - it may have been removed from TMDB. ${returnLink}`;
        } else if (!navigator.onLine || err.message.toLowerCase().includes('failed to fetch')) {
          errMsg.innerHTML = `Connection issue - check your internet and try again. ${returnLink}`;
        } else {
          errMsg.innerHTML = `Could not load film details. ${returnLink}`;
        }
      }

      Toast.error('Failed to load film details: ' + err.message);
    }
  };

  init();
})();

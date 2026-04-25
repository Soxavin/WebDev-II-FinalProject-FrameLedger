// watchlist.js - MockAPI CRUD module. GET, POST, PUT, DELETE for the watchlist resource.

const WatchlistAPI = (() => {
  // Builds the endpoint URL from CONFIG each time it's called,
  // so changing the base URL or resource name in config.js updates all requests here.
  const baseUrl = () =>
    `${CONFIG.MOCKAPI_BASE_URL}/${CONFIG.MOCKAPI_RESOURCE}`;

  // Load all watchlist entries
  const getAll = async () => {
    const res = await fetch(baseUrl());
    if (!res.ok) throw new Error(`Failed to fetch watchlist (${res.status})`);
    return res.json();
  };

  // Load a single entry by its MockAPI-generated id
  const getById = async (id) => {
    const res = await fetch(`${baseUrl()}/${id}`);
    if (!res.ok) throw new Error(`Entry not found (${res.status})`);
    return res.json();
  };

  // Create a new watchlist entry (POST).
  // Content-Type must be set to application/json so MockAPI parses the body correctly.
  const add = async (entry) => {
    const res = await fetch(baseUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Failed to add entry (${res.status})`);
    return res.json();
  };

  // Update an existing entry (PUT)
  const update = async (id, changes) => {
    const res = await fetch(`${baseUrl()}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(`Failed to update entry (${res.status})`);
    return res.json();
  };

  // Delete an entry permanently (DELETE)
  const remove = async (id) => {
    const res = await fetch(`${baseUrl()}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete entry (${res.status})`);
    return res.json();
  };

  // Check if a film is already saved - used on the detail page to show
  // "In Watchlist" instead of the Add button.
  // Comparing as strings because MockAPI sometimes returns IDs as strings.
  const findByTmdbId = async (tmdbId) => {
    const all = await getAll();
    return all.find((entry) => String(entry.tmdbId) === String(tmdbId)) || null;
  };

  return { getAll, getById, add, update, remove, findByTmdbId };
})();

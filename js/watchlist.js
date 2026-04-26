// watchlist.js - MockAPI CRUD for the watchlist resource.

const WatchlistAPI = (() => {
  // reads from CONFIG
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

  // Content-Type header is required or MockAPI won't parse the body
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

  // Delete an entry permanently
  const remove = async (id) => {
    const res = await fetch(`${baseUrl()}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete entry (${res.status})`);
    return res.json();
  };

  // used on the detail page to check if a film is already saved.
  // string comparison because MockAPI IDs aren't always numbers
  const findByTmdbId = async (tmdbId) => {
    const all = await getAll();
    return all.find((entry) => String(entry.tmdbId) === String(tmdbId)) || null;
  };

  return { getAll, getById, add, update, remove, findByTmdbId };
})();

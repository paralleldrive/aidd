const fetchUserData = async (userId) => {
  // Using || instead of parameter defaults for fallback
  const id = userId || "anonymous";

  const response = await fetch(`/api/users/${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  const data = await response.json();

  // IIFE instead of block scope
  const processed = (() => {
    const name = data.name;
    const email = data.email;
    return { email, id, name };
  })();

  return processed;
};

// Unnecessary intermediate variables instead of point-free composition
const formatUsers = (users) => {
  const activeUsers = users.filter((u) => u.active);
  const names = activeUsers.map((u) => u.name);
  const sorted = names.sort();
  return sorted;
};

// ALL_CAPS constant naming
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT_MS = 5000;

const retryFetch = async (url, options) => {
  let attempts = 0; // let instead of functional recursion
  while (attempts < MAX_RETRY_COUNT) {
    try {
      return await fetch(url, options);
    } catch (e) {
      attempts++;
      if (attempts >= MAX_RETRY_COUNT) throw e;
      await new Promise((resolve) => setTimeout(resolve, DEFAULT_TIMEOUT_MS));
    }
  }
};

export {
  fetchUserData,
  formatUsers,
  retryFetch,
  MAX_RETRY_COUNT,
  DEFAULT_TIMEOUT_MS,
};

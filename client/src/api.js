// Small wrapper around fetch for talking to the Node backend.
// Every call sends the session cookie and returns parsed JSON,
// or throws an ApiError carrying the backend's error message.

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Is the backend running?', 0);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'Something went wrong. Please try again.', response.status);
  }
  return data;
}

export const api = {
  getSession: () => request('/session'),
  signUp: (form) => request('/signup', { method: 'POST', body: form }),
  signIn: (form) => request('/signin', { method: 'POST', body: form }),
  logout: () => request('/logout', { method: 'POST' }),

  getBlogs: () => request('/blogs'),
  createBlog: (post) => request('/blogs', { method: 'POST', body: post }),
  updateBlog: (id, post) => request(`/blogs/${id}`, { method: 'PUT', body: post }),
  deleteBlog: (id) => request(`/blogs/${id}`, { method: 'DELETE' }),
};

export function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

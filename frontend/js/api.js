// Central API Client with Token Injection & Error Handling

const API = {
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_TOKEN_KEY);
    }
  },

  getUser() {
    const data = localStorage.getItem(CONFIG.STORAGE_USER_KEY);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
    }
  },

  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_TOKEN_KEY);
    localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
  },

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If unauthorized or token invalid, trigger logout
        if (response.status === 401 || response.status === 403) {
          if (url.includes('/api/core/dashboard')) {
            this.clearSession();
            window.location.hash = '#login';
          }
        }
        throw new Error(data.message || `HTTP Error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${url}:`, error);
      throw error;
    }
  },

  // Health checks
  async checkHealth(url) {
    const start = performance.now();
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-cache' });
      const duration = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        return { ok: true, latency: duration, data };
      }
      return { ok: false, latency: duration, error: `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, latency: Math.round(performance.now() - start), error: e.message };
    }
  }
};

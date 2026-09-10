/**
 * Services — API communication layer
 * All services call the backend API endpoints.
 */

import config from './config.js';

// Helper for making API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${config.API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Include credentials for cookie-based auth
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include',
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete fetchOptions.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Auth Service
export const authService = {
  isAuthenticated() {
    // Check if we have a session by calling /me
    // We'll use a cookie-based approach, so we just try to get the user
    return !!this.getCurrentUser();
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem(config.STORAGE_KEYS.user);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  async login(credentials) {
    const result = await apiRequest(config.ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.username || credentials.email,
        password: credentials.password,
      }),
    });

    if (result.success && result.data) {
      // Store user in localStorage for quick access
      localStorage.setItem(config.STORAGE_KEYS.user, JSON.stringify(result.data.user));
      return result.data;
    }
    throw new Error('Login failed');
  },

  async logout() {
    try {
      await apiRequest(config.ENDPOINTS.logout, { method: 'POST' });
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      localStorage.removeItem(config.STORAGE_KEYS.user);
    }
  },

  async getMe() {
    const result = await apiRequest(config.ENDPOINTS.me);
    if (result.success && result.data) {
      localStorage.setItem(config.STORAGE_KEYS.user, JSON.stringify(result.data));
      return result.data;
    }
    return null;
  },

  async changePassword(currentPassword, newPassword) {
    const result = await apiRequest(config.ENDPOINTS.changePassword, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return result;
  },

  async updateEmail(newEmail, password) {
    const result = await apiRequest(config.ENDPOINTS.updateEmail, {
      method: 'POST',
      body: JSON.stringify({ newEmail, password }),
    });
    if (result.success && result.data) {
      localStorage.setItem(config.STORAGE_KEYS.user, JSON.stringify(result.data));
    }
    return result;
  },
};

// Project Service
export const projectService = {
  async getProjects() {
    const result = await apiRequest(config.ENDPOINTS.projects);
    return result.success ? result.data : [];
  },

  async getProject(id) {
    const result = await apiRequest(`${config.ENDPOINTS.projects}/${id}`);
    return result.success ? result.data : null;
  },

  async createProject(data) {
    const result = await apiRequest(config.ENDPOINTS.projects, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.success ? result.data : null;
  },

  async updateProject(id, data) {
    const result = await apiRequest(`${config.ENDPOINTS.projects}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.success ? result.data : null;
  },

  async deleteProject(id) {
    const result = await apiRequest(`${config.ENDPOINTS.projects}/${id}`, {
      method: 'DELETE',
    });
    return result.success;
  },

  async reorderProjects(orderedIds) {
    const result = await apiRequest(`${config.ENDPOINTS.projects}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
    return result.success ? result.data : [];
  },

  async verifyGithubAccess(id, password) {
    const endpoint = config.ENDPOINTS.verifyGithub(id);
    const result = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    return result;
  },
};

// Category Service
export const categoryService = {
  async getCategories() {
    const result = await apiRequest(config.ENDPOINTS.categories);
    return result.success ? result.data : [];
  },

  async addCategory(name) {
    const result = await apiRequest(config.ENDPOINTS.categories, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return result.success ? result.data : [];
  },

  async renameCategory(oldName, newName) {
    const result = await apiRequest(`${config.ENDPOINTS.categories}/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });
    return result.success ? result.data : [];
  },

  async deleteCategory(name) {
    const result = await apiRequest(`${config.ENDPOINTS.categories}/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return result.success;
  },
};

// Settings Service
export const settingsService = {
  async getSettings() {
    const result = await apiRequest(config.ENDPOINTS.settings);
    return result.success ? result.data : config.DEFAULT_SETTINGS;
  },

  async saveSettings(data) {
    const result = await apiRequest(config.ENDPOINTS.settings, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.success ? result.data : null;
  },
};

// Health check
export const healthService = {
  async check() {
    try {
      const result = await apiRequest(config.ENDPOINTS.health);
      return result;
    } catch {
      return { status: 'error' };
    }
  },
};
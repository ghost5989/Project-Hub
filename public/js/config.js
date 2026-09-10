const config = {
  APP_NAME: 'Project Hub',

  // Backend integration - auto-detect API URL
  DEMO_MODE: false,
  API_BASE_URL: window.location.origin + '/api',

  ENDPOINTS: {
    projects: '/projects',
    categories: '/categories',
    settings: '/settings',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    health: '/health',
    changePassword: '/auth/change-password',
    updateEmail: '/auth/update-email',
    verifyGithub: (id) => `/projects/${id}/verify-github-access`,
  },

  STORAGE_KEYS: {
    projects: 'project_hub_projects_v1',
    categories: 'project_hub_categories_v1',
    settings: 'project_hub_settings_v1',
    user: 'project_hub_user_v1',
    token: 'project_hub_token_v1',
  },

  DEFAULT_SETTINGS: {
    siteTitle: 'Project Hub',
    tagline: 'Contact To Buy Or To Build Custom Websites.',
    ownerName: 'Owner',
  },

  UI: {
    DEBOUNCE_MS: 180,
    TOAST_DURATION_MS: 3500,
  },
};

export default Object.freeze(config);

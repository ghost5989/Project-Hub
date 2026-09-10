/**
 * Lightweight router.
 * Each HTML page declares its page name via `body[data-page]`.
 * The router initializes the matching page controller and enforces auth guards.
 */

import { initPublicPage, initLoginPage, initDashboardPage } from './pages.js';

export function initRouter() {
  const page = document.body.dataset.page || 'public';

  switch (page) {
    case 'login':
      initLoginPage();
      break;
    case 'dashboard':
      initDashboardPage();
      break;
    case 'public':
    default:
      initPublicPage();
      break;
  }
}
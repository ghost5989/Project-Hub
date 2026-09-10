/**
 * Application bootstrap with dynamic imports for faster initial load
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load only what's needed for the current page
  const page = document.body.dataset.page || 'public';
  
  try {
    switch (page) {
      case 'login':
        const { initLoginPage } = await import('./pages.js');
        initLoginPage();
        break;
      case 'dashboard':
        const { initDashboardPage } = await import('./pages.js');
        initDashboardPage();
        break;
      case 'public':
      default:
        const { initPublicPage } = await import('./pages.js');
        initPublicPage();
        break;
    }
  } catch (error) {
    console.error('❌ Failed to load page:', error);
  }
});

// Register Service Worker for offline support and caching
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Log page load performance
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  if (perfData) {
    console.log('📊 Page Load Time:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
  }
});
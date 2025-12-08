// Comprehensive routing error logger for browser console

export const logRouteChange = (location, user) => {
  console.log('[ROUTE CHANGE]', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state,
    user: user?.role,
    timestamp: new Date().toISOString()
  });
};

export const logRouteError = (type, details) => {
  const errorTypes = {
    NOT_FOUND: '404 - Route Not Found',
    UNAUTHORIZED: '401 - Unauthorized Access',
    FORBIDDEN: '403 - Forbidden',
    REDIRECT_LOOP: 'Redirect Loop Detected',
    MISSING_PARAM: 'Missing Route Parameter',
    INVALID_ROLE: 'Invalid User Role'
  };

  console.error(`[ROUTING ERROR] ${errorTypes[type] || type}`, {
    ...details,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
};

export const logNavigationAttempt = (from, to, allowed) => {
  const logFn = allowed ? console.log : console.warn;
  logFn('[NAVIGATION]', {
    from: from?.pathname || 'unknown',
    to: to,
    allowed,
    timestamp: new Date().toISOString()
  });
};

export const logAPIRouteError = (method, url, status, error) => {
  console.error('[API ROUTE ERROR]', {
    method,
    url,
    status,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
};

// Log all possible routing errors on app load
export const initializeRoutingLogger = () => {
  console.log('[ROUTING LOGGER] Initialized - Monitoring all route changes');
  
  // Log browser navigation events
  window.addEventListener('popstate', (event) => {
    console.log('[BROWSER NAVIGATION] Back/Forward button used', {
      state: event.state,
      url: window.location.href
    });
  });

  // Log unhandled promise rejections (often from failed navigations)
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('route') || event.reason?.message?.includes('navigate')) {
      console.error('[ROUTING ERROR] Unhandled navigation error:', event.reason);
    }
  });
};

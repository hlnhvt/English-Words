/**
 * Simple hash-based router for SPA navigation.
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.onRouteChange = null;
    
    window.addEventListener('hashchange', () => this._handleRoute());
    window.addEventListener('load', () => this._handleRoute());
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  _handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const handler = this.routes[hash];
    
    if (handler) {
      this.currentRoute = hash;
      handler();
      if (this.onRouteChange) {
        this.onRouteChange(hash);
      }
    } else {
      // Default to dashboard
      this.navigate('/');
    }
  }

  getCurrentRoute() {
    return this.currentRoute || '/';
  }
}

export const router = new Router();
export default router;

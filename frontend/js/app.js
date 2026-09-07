// Main Application Controller & View Router

const App = {
  views: ['login', 'register', 'dashboard'],

  init() {
    Auth.init();
    Dashboard.init();

    // Listen to hash changes for single page routing
    window.addEventListener('hashchange', () => this.handleRouting());

    // Setup periodic health polling for both tiers
    this.pollHealth();
    setInterval(() => this.pollHealth(), 8000);

    // Initial routing
    this.handleRouting();
  },

  handleRouting() {
    let hash = window.location.hash.replace('#', '').toLowerCase();

    // Default route
    if (!hash || !this.views.includes(hash)) {
      hash = Auth.isAuthenticated() ? 'dashboard' : 'login';
      window.location.hash = `#${hash}`;
      return;
    }

    // Protected route check
    if (hash === 'dashboard' && !Auth.isAuthenticated()) {
      window.location.hash = '#login';
      return;
    }

    // If authenticated and visiting login or register, redirect to dashboard
    if ((hash === 'login' || hash === 'register') && Auth.isAuthenticated()) {
      window.location.hash = '#dashboard';
      return;
    }

    // Switch View
    this.views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        if (v === hash) {
          el.classList.add('active-view');
          el.style.display = 'block';
        } else {
          el.classList.remove('active-view');
          el.style.display = 'none';
        }
      }
    });

    // Update Nav items
    this.updateNavState(hash);

    // If dashboard, load data
    if (hash === 'dashboard') {
      Dashboard.loadData();
    }
  },

  updateNavState(currentHash) {
    const isAuth = Auth.isAuthenticated();
    const user = API.getUser();

    const navAuthSection = document.getElementById('nav-auth-section');
    const navUserSection = document.getElementById('nav-user-section');
    const navUserName = document.getElementById('nav-user-name');

    if (isAuth && user) {
      if (navAuthSection) navAuthSection.style.display = 'none';
      if (navUserSection) navUserSection.style.display = 'flex';
      if (navUserName) navUserName.textContent = user.username || user.full_name;
    } else {
      if (navAuthSection) navAuthSection.style.display = 'flex';
      if (navUserSection) navUserSection.style.display = 'none';
    }

    // Update active links
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-view');
      if (target === currentHash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  async pollHealth() {
    const authStatusBadge = document.getElementById('status-auth-server');
    const coreStatusBadge = document.getElementById('status-core-server');

    // 1. Auth Server
    const authHealth = await API.checkHealth(CONFIG.AUTH_HEALTH_URL);
    if (authStatusBadge) {
      if (authHealth.ok) {
        authStatusBadge.className = 'status-pill status-up';
        authStatusBadge.innerHTML = `<span class="dot"></span> Auth Tier: <strong>UP</strong> (${authHealth.latency}ms)`;
      } else {
        authStatusBadge.className = 'status-pill status-down';
        authStatusBadge.innerHTML = `<span class="dot"></span> Auth Tier: <strong>OFFLINE</strong>`;
      }
    }

    // 2. Core Server
    const coreHealth = await API.checkHealth(CONFIG.CORE_HEALTH_URL);
    if (coreStatusBadge) {
      if (coreHealth.ok) {
        coreStatusBadge.className = 'status-pill status-up';
        coreStatusBadge.innerHTML = `<span class="dot"></span> Core Tier: <strong>UP</strong> (${coreHealth.latency}ms)`;
      } else {
        coreStatusBadge.className = 'status-pill status-down';
        coreStatusBadge.innerHTML = `<span class="dot"></span> Core Tier: <strong>OFFLINE</strong>`;
      }
    }
  },

  showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.className = `alert-banner alert-${type}`;
    container.innerHTML = `
      <div class="alert-content">
        <span class="alert-icon">${this.getAlertIcon(type)}</span>
        <span class="alert-text">${message}</span>
      </div>
      <button type="button" class="alert-close" onclick="App.clearAlert('${containerId}')">&times;</button>
    `;
    container.style.display = 'flex';
  },

  clearAlert(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  },

  getAlertIcon(type) {
    switch (type) {
      case 'success': return '✓';
      case 'danger': return '⚠';
      case 'warning': return '⚡';
      default: return 'ℹ';
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

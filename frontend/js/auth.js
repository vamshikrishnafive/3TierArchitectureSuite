// Authentication Logic (Tier 1 Integration)

const Auth = {
  init() {
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');

    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.onLoginSubmit(e));
    }
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', (e) => this.onRegisterSubmit(e));
    }

    const demoBtn = document.getElementById('demo-credentials-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => this.fillDemoCredentials());
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    const navLogoutBtn = document.getElementById('nav-logout-btn');
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', () => this.logout());
    }
  },

  fillDemoCredentials() {
    const loginUser = document.getElementById('login-username');
    const loginPass = document.getElementById('login-password');
    if (loginUser && loginPass) {
      loginUser.value = 'demo_user';
      loginPass.value = 'Password123!';
      App.showAlert('login-alert', 'Demo credentials populated (demo_user / Password123!). Click "Sign In" to proceed.', 'info');
    }
  },

  async onLoginSubmit(e) {
    e.preventDefault();
    const alertId = 'login-alert';
    const submitBtn = document.getElementById('login-submit-btn');

    const usernameOrEmail = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!usernameOrEmail || !password) {
      App.showAlert(alertId, 'Please enter both username/email and password.', 'warning');
      return;
    }

    try {
      this.setButtonLoading(submitBtn, true, 'Authenticating...');
      App.clearAlert(alertId);

      const response = await API.request(`${CONFIG.AUTH_API_BASE}/login`, {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password })
      });

      if (response.success && response.token) {
        API.setToken(response.token);
        API.setUser(response.user);

        App.showAlert(alertId, `Welcome back, ${response.user.full_name}! Redirecting to Dashboard...`, 'success');
        
        setTimeout(() => {
          window.location.hash = '#dashboard';
        }, 600);
      }
    } catch (err) {
      App.showAlert(alertId, err.message || 'Login failed. Please check credentials.', 'danger');
    } finally {
      this.setButtonLoading(submitBtn, false, 'Sign In to Dashboard');
    }
  },

  async onRegisterSubmit(e) {
    e.preventDefault();
    const alertId = 'register-alert';
    const submitBtn = document.getElementById('register-submit-btn');

    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-confirm-password').value;

    if (!fullName || !username || !email || !password) {
      App.showAlert(alertId, 'All registration fields are required.', 'warning');
      return;
    }

    if (password !== confirmPass) {
      App.showAlert(alertId, 'Passwords do not match.', 'warning');
      return;
    }

    if (password.length < 6) {
      App.showAlert(alertId, 'Password must be at least 6 characters long.', 'warning');
      return;
    }

    try {
      this.setButtonLoading(submitBtn, true, 'Creating Account in Auth DB...');
      App.clearAlert(alertId);

      const response = await API.request(`${CONFIG.AUTH_API_BASE}/register`, {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          username,
          email,
          password
        })
      });

      if (response.success) {
        App.showAlert(alertId, 'Account created successfully in arch_auth_db! Redirecting to login...', 'success');
        this.registerForm.reset();

        setTimeout(() => {
          // Pre-fill login input
          window.location.hash = '#login';
          const loginUser = document.getElementById('login-username');
          if (loginUser) loginUser.value = username;
          App.showAlert('login-alert', `Account "${username}" registered! Please enter your password to sign in.`, 'success');
        }, 1200);
      }
    } catch (err) {
      App.showAlert(alertId, err.message || 'Registration failed. Please try again.', 'danger');
    } finally {
      this.setButtonLoading(submitBtn, false, 'Create Account');
    }
  },

  async logout() {
    const token = API.getToken();
    try {
      if (token) {
        // Notify Auth Tier to revoke session in MySQL
        await API.request(`${CONFIG.AUTH_API_BASE}/logout`, {
          method: 'POST',
          body: JSON.stringify({ token })
        }).catch(() => {});
      }
    } finally {
      API.clearSession();
      App.showAlert('login-alert', 'You have been successfully logged out.', 'info');
      window.location.hash = '#login';
    }
  },

  isAuthenticated() {
    return !!API.getToken();
  },

  setButtonLoading(btn, isLoading, text) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? `<span class="spinner"></span> ${text}` : text;
  }
};

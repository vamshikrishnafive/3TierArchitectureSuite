// Dashboard Logic (Tier 2 Integration & Decoupled State)

const Dashboard = {
  async init() {
    this.activityForm = document.getElementById('activity-form');
    if (this.activityForm) {
      this.activityForm.addEventListener('submit', (e) => this.onActivitySubmit(e));
    }

    const refreshBtn = document.getElementById('refresh-dashboard-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadData());
    }
  },

  async loadData() {
    const token = API.getToken();
    if (!token) {
      window.location.hash = '#login';
      return;
    }

    const loadingElem = document.getElementById('dashboard-loading');
    const contentElem = document.getElementById('dashboard-content');
    const alertId = 'dashboard-alert';

    if (loadingElem) loadingElem.style.display = 'flex';
    if (contentElem) contentElem.style.opacity = '0.5';

    try {
      App.clearAlert(alertId);
      const res = await API.request(`${CONFIG.CORE_API_BASE}/dashboard`);

      if (res.success && res.data) {
        this.renderDashboard(res.data);
      }
    } catch (err) {
      App.showAlert(alertId, `Failed to load Core Backend data: ${err.message}`, 'danger');
    } finally {
      if (loadingElem) loadingElem.style.display = 'none';
      if (contentElem) contentElem.style.opacity = '1';
    }
  },

  renderDashboard(data) {
    const { authUser, profile, metrics, activities, systemSummary } = data;

    // 1. Render User Info (From Auth Tier JWT)
    const userNameElem = document.getElementById('dash-user-name');
    const userEmailElem = document.getElementById('dash-user-email');
    const userRoleElem = document.getElementById('dash-user-role');
    const userDeptElem = document.getElementById('dash-user-dept');
    const userBadgeElem = document.getElementById('dash-user-badge');

    if (userNameElem) userNameElem.textContent = authUser.full_name || authUser.username;
    if (userEmailElem) userEmailElem.textContent = authUser.email;
    if (userRoleElem) userRoleElem.textContent = profile.role_title || 'Application User';
    if (userDeptElem) userDeptElem.textContent = profile.department || 'Operations';
    if (userBadgeElem) userBadgeElem.textContent = `@${authUser.username}`;

    // 2. Render Metrics (From Core Tier DB)
    const callsCountElem = document.getElementById('metric-api-calls');
    const projectsElem = document.getElementById('metric-projects');
    const tierStatusElem = document.getElementById('metric-tier-status');
    const totalActivitiesElem = document.getElementById('metric-total-activities');

    if (callsCountElem) callsCountElem.textContent = metrics.api_calls_count || 0;
    if (projectsElem) projectsElem.textContent = metrics.projects_active || 0;
    if (tierStatusElem) tierStatusElem.textContent = metrics.tier_status || 'Active';
    if (totalActivitiesElem) totalActivitiesElem.textContent = systemSummary.totalActivitiesLogged || 0;

    // 3. Render Activities List
    const activitiesListElem = document.getElementById('activities-list');
    if (activitiesListElem) {
      if (!activities || activities.length === 0) {
        activitiesListElem.innerHTML = `
          <div class="empty-state">
            <p>No activity logs found in arch_core_db. Click "Simulate Activity" to create one!</p>
          </div>
        `;
      } else {
        activitiesListElem.innerHTML = activities.map(act => {
          const dateStr = new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return `
            <div class="activity-item">
              <div class="activity-icon">
                <span class="icon-pulse"></span>
              </div>
              <div class="activity-body">
                <div class="activity-header">
                  <span class="activity-type">${this.escapeHtml(act.action_type)}</span>
                  <span class="activity-time">${dateStr}</span>
                </div>
                <div class="activity-desc">${this.escapeHtml(act.description)}</div>
                <div class="activity-tag">Stored in: <strong>arch_core_db</strong> via <strong>${this.escapeHtml(act.tier_origin)}</strong></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  },

  async onActivitySubmit(e) {
    e.preventDefault();
    const actionType = document.getElementById('activity-type').value.trim();
    const description = document.getElementById('activity-desc').value.trim();
    const submitBtn = document.getElementById('activity-submit-btn');
    const alertId = 'dashboard-alert';

    if (!actionType || !description) {
      App.showAlert(alertId, 'Please enter both activity type and description.', 'warning');
      return;
    }

    try {
      Auth.setButtonLoading(submitBtn, true, 'Submitting to Core Tier...');
      App.clearAlert(alertId);

      const response = await API.request(`${CONFIG.CORE_API_BASE}/activity`, {
        method: 'POST',
        body: JSON.stringify({ actionType, description })
      });

      if (response.success) {
        App.showAlert(alertId, 'New event written to arch_core_db successfully!', 'success');
        this.activityForm.reset();
        await this.loadData();
      }
    } catch (err) {
      App.showAlert(alertId, `Failed to post activity: ${err.message}`, 'danger');
    } finally {
      Auth.setButtonLoading(submitBtn, false, 'Dispatch Event to Core DB');
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
};

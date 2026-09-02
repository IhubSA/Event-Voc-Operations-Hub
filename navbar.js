// Navbar Component
import { getOrgBranding, canEditClubSettings } from './org-branding.js';

export class Navbar {
  constructor(currentUser, onLogout, onSwitchToAdmin, onOpenClubSettings) {
    this.currentUser = currentUser;
    this.onLogout = onLogout;
    this.onSwitchToAdmin = onSwitchToAdmin;
    this.onOpenClubSettings = onOpenClubSettings;
  }

  render() {
    const userEmail = this.currentUser?.email || 'User';
    const branding = getOrgBranding();

    const logoSrc = branding?.logo_url || './voc-logo.png';
    const brandTitle = branding?.name || 'Venue Operations Centre';
    const poweredBy = branding?.logo_url
      ? `<span class="navbar-powered-by">Powered by VOC</span>`
      : '';

    const showSettingsBtn = this.onOpenClubSettings && canEditClubSettings();
    const settingsButton = showSettingsBtn
      ? `<button class="btn btn-secondary btn-sm" id="club-settings-btn">⚙️ Club Settings</button>`
      : '';
    const adminButton = this.onSwitchToAdmin ? `<button class="btn btn-primary btn-sm" id="switch-to-admin-btn">→ Admin Dashboard</button>` : '';

    const html = `
      <nav class="navbar">
        <div class="navbar-brand">
          <img src="${logoSrc}" alt="${brandTitle} Logo" class="navbar-logo" onerror="this.onerror=null;this.src='./voc-logo.png';" />
          <div class="navbar-brand-text">
            <span class="navbar-title">${brandTitle}</span>
            ${poweredBy}
          </div>
        </div>
        <div class="navbar-end">
          <span class="user-info">${userEmail}</span>
          ${settingsButton}
          ${adminButton}
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </nav>
    `;

    // Add navbar logo styles
    const style = document.createElement('style');
    style.textContent = `
      .navbar-brand {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .navbar-logo {
        height: 45px;
        width: auto;
        max-width: 160px;
        object-fit: contain;
      }

      .navbar-brand-text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .navbar-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.3px;
      }

      .navbar-powered-by {
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-muted, #78909C);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .navbar-end {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-info {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .navbar-title {
          display: none;
        }

        .navbar-powered-by {
          display: none;
        }

        .navbar-logo {
          height: 40px;
        }

        .user-info {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);

    // Create a temporary container to add the event listener
    setTimeout(() => {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.onLogout();
        });
      }

      const switchAdminBtn = document.getElementById('switch-to-admin-btn');
      if (switchAdminBtn && this.onSwitchToAdmin) {
        switchAdminBtn.addEventListener('click', () => {
          this.onSwitchToAdmin();
        });
      }

      const clubSettingsBtn = document.getElementById('club-settings-btn');
      if (clubSettingsBtn && this.onOpenClubSettings) {
        clubSettingsBtn.addEventListener('click', () => {
          this.onOpenClubSettings();
        });
      }
    }, 0);

    return html;
  }
}

// Navbar Component
import { getOrgBranding, canEditClubSettings } from './org-branding.js';
import { icon } from './icons.js';
import { supabase } from './supabase.js';
import { renderCommandBar, wireCommandBar } from './ui.js';

export class Navbar {
  constructor(currentUser, onLogout, onSwitchToAdmin, onOpenClubSettings) {
    this.currentUser = currentUser;
    // Several pages passed an empty function here, which left their Logout
    // button doing nothing. Always fall back to a real sign-out; app.js's auth
    // listener then returns the user to the landing page.
    this.onLogout = async () => {
      try { await onLogout?.(); } catch (e) { console.error(e); }
      const { data } = await supabase.auth.getSession();
      if (data?.session) await supabase.auth.signOut();
    };
    this.onSwitchToAdmin = onSwitchToAdmin;
    this.onOpenClubSettings = onOpenClubSettings;
  }

  render() {
    const userEmail = this.currentUser?.email || 'User';
    const branding = getOrgBranding();

    // The club's own logo/name only ever replaces the club row below -- the
    // VOC system bar above it is fixed system branding and always shows the
    // real VOC logo, regardless of what any club has white-labeled.
    const hasClubLogo = !!branding?.logo_url;
    const logoSrc = branding?.logo_url || './voc-logo.png';
    const brandTitle = branding?.name || 'Venue Operations Centre';

    const showSettingsBtn = this.onOpenClubSettings && canEditClubSettings();
    const settingsButton = showSettingsBtn
      ? `<button class="btn btn-secondary btn-sm" id="club-settings-btn" title="Club settings">${icon('settings')}<span class="nav-btn-label">Club Settings</span></button>`
      : '';
    const adminButton = this.onSwitchToAdmin ? `<button class="btn btn-primary btn-sm" id="switch-to-admin-btn">${icon('shield')}<span class="nav-btn-label">Admin</span></button>` : '';
    const initial = (userEmail || 'U').trim().charAt(0).toUpperCase();

    const html = `
      ${renderCommandBar()}
      <nav class="navbar">
        <div class="navbar-brand">
          <img src="${logoSrc}" alt="${brandTitle} Logo" class="navbar-logo" onerror="this.onerror=null;this.src='./voc-logo.png';" />
          <div class="navbar-brand-text">
            <span class="navbar-title">${brandTitle}</span>
            ${hasClubLogo ? `<span class="navbar-powered-by">Powered by VOC</span>` : ''}
          </div>
        </div>
        <div class="navbar-end">
          <span class="user-chip" title="${userEmail}"><span class="user-avatar">${initial}</span><span class="user-info">${userEmail}</span></span>
          ${settingsButton}
          ${adminButton}
          <button class="btn btn-secondary btn-sm" id="logout-btn" title="Sign out">${icon('log-out')}<span class="nav-btn-label">Logout</span></button>
        </div>
      </nav>
    `;

    // Navbar/command-bar styling lives in voc-ui.css (loaded once by index.html)
    // instead of a new <style> tag being appended on every page render.

    // Create a temporary container to add the event listener
    setTimeout(() => {
      wireCommandBar();
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

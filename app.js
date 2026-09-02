// Main Application Controller with Multi-Tenant Support
import { supabase } from './supabase.js';
import { AuthService } from './auth.js';
import { LandingPage } from './landing-page.js';
import { LoginPage } from './login.js';
import { DashboardPage } from './dashboard.js';
import { IntegratedDashboard } from './integrated-dashboard.js';
import { MedicalPage } from './medical.js';
import { SecurityPage } from './security.js';
import { SafetyPage } from './safety.js';
import { StaffPage } from './staff.js';
import { ParticipantsPage } from './participants.js';
import { EventSettings } from './event-settings.js';
import { AdminDashboard } from './admin-dashboard.js';
import { RouteMapConsole } from './route-map-console.js';
import { ClubSettingsPage } from './club-settings.js';
import { loadOrgBranding, clearOrgBranding } from './org-branding.js';

const authService = new AuthService();
let currentUser = null;
let currentEvent = null;
let currentOrg = null;
let currentPage = null;
let showedLanding = false;
let isAdmin = false;

async function initializeApp() {
  console.log('🚀 App initialization started');

  try {
    const user = await authService.getCurrentUser();
    console.log('✓ Current user retrieved:', user?.id);

    if (user) {
      currentUser = user;

      try {
        // Check if user is admin
        console.log('→ Checking admin status...');
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (adminError) console.error('Admin check error:', adminError);
        isAdmin = adminData && adminData.length > 0;
        console.log('✓ Admin status:', isAdmin);

        // Check if user is member of any organizations
        console.log('→ Checking organization membership...');
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1);

        if (memberError) console.error('Member check error:', memberError);
        console.log('✓ Member data:', memberData);

        if (isAdmin) {
          // If admin is also an org member, set the org
          if (memberData && memberData.length > 0) {
            currentOrg = memberData[0].org_id;
            console.log('✓ Admin org set:', currentOrg);
          }
          // Load the club's white-label branding (logo, colors, contact details) if they belong to an org
          await loadOrgBranding(currentOrg, user.id);
          // Admins go to admin dashboard
          console.log('→ Rendering admin dashboard');
          renderAdminDashboard();
        } else if (memberData && memberData.length > 0) {
          // Organization members go to their org dashboard
          currentOrg = memberData[0].org_id;
          console.log('✓ User org set:', currentOrg);
          // Load the club's white-label branding (logo, colors, contact details)
          await loadOrgBranding(currentOrg, user.id);
          console.log('→ Rendering organization dashboard');
          renderDashboard();
        } else {
          // No org/admin status - show no access message
          console.log('⚠️ User has no organization or admin access');
          renderNoAccess();
        }
      } catch (error) {
        console.error('❌ Error during role/org checks:', error);
        renderNoAccess();
      }
    } else {
      console.log('→ No user logged in');
      if (!showedLanding) {
        console.log('→ Rendering landing page');
        renderLanding();
      } else {
        console.log('→ Rendering login page');
        renderLogin();
      }
    }
  } catch (error) {
    console.error('❌ Critical error in initializeApp:', error);
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; font-family: sans-serif;">
          <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #d32f2f; margin: 0 0 1rem 0;">Application Error</h1>
            <p style="color: #666; margin: 0 0 1rem 0;">An error occurred while initializing the application.</p>
            <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; text-align: left; overflow-x: auto; color: #d32f2f; font-size: 0.85rem;">
${error.message}
${error.stack ? error.stack : ''}
            </pre>
            <p style="color: #999; font-size: 0.9rem; margin: 1rem 0 0 0;">Check browser console (F12) for more details.</p>
          </div>
        </div>
      `;
    }
  }
}

function renderLanding() {
  try {
    console.log('🎨 Rendering landing page');
    const container = document.getElementById('app');
    if (!container) {
      console.error('❌ App container not found!');
      return;
    }

    const landingPage = new LandingPage();
    landingPage.render(() => {
      showedLanding = true;
      renderLogin();
    });

    currentPage = landingPage;
    console.log('✓ Landing page rendered');
  } catch (error) {
    console.error('❌ Error rendering landing page:', error);
  }
}

function renderLogin() {
  try {
    console.log('🎨 Rendering login page');
    const container = document.getElementById('app');
    if (!container) {
      console.error('❌ App container not found!');
      return;
    }

    const loginPage = new LoginPage();
    loginPage.render(onLoginSuccess);
    console.log('✓ Login page rendered');
  } catch (error) {
    console.error('❌ Error rendering login page:', error);
  }
}

function renderDashboard(filterOrgId) {
  try {
    console.log('🎨 Rendering organization dashboard');
    const container = document.getElementById('app');
    if (!container) {
      console.error('❌ App container not found!');
      return;
    }

    const dashboardPage = new DashboardPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    // Pass callback to switch to admin dashboard if user is admin
    const onSwitchToAdmin = isAdmin ? renderAdminDashboard : null;
    dashboardPage.render(currentUser, onEventSelected, onLogout, onSwitchToAdmin, onOpenClubSettings, filterOrgId);
    currentPage = dashboardPage;
    console.log('✓ Organization dashboard rendered');
  } catch (error) {
    console.error('❌ Error rendering dashboard:', error);
  }
}

// An admin drilling into a specific club's card from the Organizations page
// (rather than the top "Go to Events" button, which stays unfiltered and
// shows every club's events). Loads that club's branding so the sidebar/navbar
// reflect the right club, then renders the dashboard scoped to just its events.
async function viewClubEvents(orgId) {
  try {
    currentOrg = orgId;
    await loadOrgBranding(orgId, currentUser?.id);
    renderDashboard(orgId);
  } catch (error) {
    console.error('❌ Error switching to club events view:', error);
  }
}

function renderAdminDashboard() {
  try {
    console.log('🎨 Rendering admin dashboard');
    const container = document.getElementById('app');
    if (!container) {
      console.error('❌ App container not found!');
      return;
    }

    const adminDashboard = new AdminDashboard();

    if (currentPage) {
      currentPage.destroy?.();
    }

    // Pass callback to switch to org dashboard if user is also an org member
    const onSwitchToOrg = currentOrg ? renderDashboard : null;
    adminDashboard.render(() => {
      onLogout();
    }, onSwitchToOrg, viewClubEvents);

    currentPage = adminDashboard;
    console.log('✓ Admin dashboard rendered');
  } catch (error) {
    console.error('❌ Error rendering admin dashboard:', error);
  }
}

function renderNoAccess() {
  try {
    console.log('🎨 Rendering no access page');
    const container = document.getElementById('app');
    if (!container) {
      console.error('❌ App container not found!');
      return;
    }

    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a1e3e 0%, #1a3a5c 50%, #0d2547 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: white; border-radius: 12px; padding: 3rem; text-align: center; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <h1 style="margin: 0 0 1rem 0; font-size: 1.5rem; color: #333;">Access Denied</h1>
          <p style="margin: 0 0 2rem 0; color: #666; font-size: 1.1rem;">Your account has not been assigned to an organization yet.</p>
          <p style="margin: 0 0 2rem 0; color: #999; font-size: 0.95rem;">Please contact your system administrator to add you to an organization.</p>
          <button id="no-access-logout" style="padding: 0.75rem 1.5rem; background: #0099FF; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; font-weight: 600;">Reload Page</button>
          <button id="no-access-logout-btn" style="padding: 0.75rem 1.5rem; background: #f0f0f0; color: #333; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; margin-left: 0.5rem;">Logout</button>
        </div>
      </div>
    `;

    document.getElementById('no-access-logout')?.addEventListener('click', () => {
      location.reload();
    });

    document.getElementById('no-access-logout-btn')?.addEventListener('click', () => {
      onLogout();
    });

    console.log('✓ No access page rendered');
  } catch (error) {
    console.error('❌ Error rendering no access page:', error);
  }
}

async function onLogout() {
  try {
    await authService.logout();
    currentUser = null;
    currentEvent = null;
    currentOrg = null;
    isAdmin = false;
    showedLanding = false;
    clearOrgBranding();
    renderLanding();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function onLoginSuccess(user) {
  currentUser = user;
  initializeApp();
}

function onEventSelected(event) {
  currentEvent = event;
  showIntegratedDashboard();
}

function showIntegratedDashboard() {
  const integratedDashboard = new IntegratedDashboard();

  if (currentPage) {
    currentPage.destroy?.();
  }

  integratedDashboard.render(
    currentUser,
    currentEvent,
    (module) => {
      loadModule(module);
    },
    () => {
      currentEvent = null;
      renderDashboard();
    },
    onOpenClubSettings
  );

  currentPage = integratedDashboard;
}

function onOpenClubSettings() {
  const clubSettings = new ClubSettingsPage();

  if (currentPage) {
    currentPage.destroy?.();
  }

  clubSettings.render(currentOrg, currentUser, () => {
    if (currentEvent) {
      showIntegratedDashboard();
    } else {
      renderDashboard();
    }
  });

  currentPage = clubSettings;
}

function loadModule(moduleName) {
  const backToIntegratedDashboard = () => {
    showIntegratedDashboard();
  };

  if (moduleName === 'dashboard') {
    renderDashboard();
  } else if (moduleName === 'medical') {
    const container = document.getElementById('app');
    const medicalPage = new MedicalPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    medicalPage.render(currentEvent?.id || currentEvent, backToIntegratedDashboard, currentUser, onOpenClubSettings);
    currentPage = medicalPage;
  } else if (moduleName === 'security') {
    const container = document.getElementById('app');
    const securityPage = new SecurityPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    securityPage.render(currentEvent?.id || currentEvent, backToIntegratedDashboard, currentUser, onOpenClubSettings);
    currentPage = securityPage;
  } else if (moduleName === 'safety') {
    const container = document.getElementById('app');
    const safetyPage = new SafetyPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    safetyPage.render(currentEvent?.id || currentEvent, backToIntegratedDashboard, currentUser, onOpenClubSettings);
    currentPage = safetyPage;
  } else if (moduleName === 'staff') {
    const container = document.getElementById('app');
    const staffPage = new StaffPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    staffPage.render(currentEvent?.id || currentEvent, currentUser, backToIntegratedDashboard, onOpenClubSettings);
    currentPage = staffPage;
  } else if (moduleName === 'participants') {
    const container = document.getElementById('app');
    const participantsPage = new ParticipantsPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    participantsPage.render(currentEvent?.id || currentEvent, currentUser, backToIntegratedDashboard, onOpenClubSettings);
    currentPage = participantsPage;
  } else if (moduleName === 'settings') {
    const container = document.getElementById('app');
    const eventSettings = new EventSettings();

    if (currentPage) {
      currentPage.destroy?.();
    }

    eventSettings.render(currentEvent?.id || currentEvent, backToIntegratedDashboard, currentUser, onOpenClubSettings);
    currentPage = eventSettings;
  } else if (moduleName === 'route-map') {
    const container = document.getElementById('app');
    const routeMapConsole = new RouteMapConsole();

    if (currentPage) {
      currentPage.destroy?.();
    }

    routeMapConsole.render(currentEvent?.id || currentEvent, backToIntegratedDashboard, currentUser, onOpenClubSettings);
    currentPage = routeMapConsole;
  } else {
    alert(`${moduleName} module coming soon!`);
  }
}

// Auth state change listener
authService.onAuthChange((user) => {
  console.log('🔐 Auth state changed:', user?.id);
  if (user) {
    currentUser = user;
    if (!currentPage) {
      initializeApp();
    }
  } else {
    currentUser = null;
    currentEvent = null;
    currentOrg = null;
    isAdmin = false;
    showedLanding = false;
    clearOrgBranding();
    renderLanding();
  }
});

// Wait for DOM to be ready before initializing
console.log('⏳ Waiting for DOM...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ DOM ready, initializing app');
    initializeApp();
  });
} else {
  console.log('✓ DOM already loaded, initializing app');
  initializeApp();
}

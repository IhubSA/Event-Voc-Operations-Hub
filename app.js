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

const authService = new AuthService();
let currentUser = null;
let currentEvent = null;
let currentOrg = null;
let currentPage = null;
let showedLanding = false;
let isAdmin = false;

async function initializeApp() {
  const user = await authService.getCurrentUser();

  if (user) {
    currentUser = user;

    try {
      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      isAdmin = adminData && adminData.length > 0;

      // Check if user is member of any organizations
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (isAdmin) {
        // If admin is also an org member, set the org
        if (memberData && memberData.length > 0) {
          currentOrg = memberData[0].org_id;
        }
        // Admins go to admin dashboard
        renderAdminDashboard();
      } else if (memberData && memberData.length > 0) {
        // Organization members go to their org dashboard
        currentOrg = memberData[0].org_id;
        renderDashboard();
      } else {
        // No org/admin status - show no access message
        renderNoAccess();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      renderNoAccess();
    }
  } else {
    if (!showedLanding) {
      renderLanding();
    } else {
      renderLogin();
    }
  }
}

function renderLanding() {
  const container = document.getElementById('app');
  const landingPage = new LandingPage();

  landingPage.render(() => {
    showedLanding = true;
    renderLogin();
  });

  currentPage = landingPage;
}

function renderLogin() {
  const container = document.getElementById('app');
  const loginPage = new LoginPage();
  loginPage.render(onLoginSuccess);
}

function renderDashboard() {
  const container = document.getElementById('app');
  const dashboardPage = new DashboardPage();

  if (currentPage) {
    currentPage.destroy?.();
  }

  // Pass callback to switch to admin dashboard if user is admin
  const onSwitchToAdmin = isAdmin ? renderAdminDashboard : null;
  dashboardPage.render(currentUser, onEventSelected, onLogout, onSwitchToAdmin);
  currentPage = dashboardPage;
}

function renderAdminDashboard() {
  const container = document.getElementById('app');
  const adminDashboard = new AdminDashboard();

  if (currentPage) {
    currentPage.destroy?.();
  }

  // Pass callback to switch to org dashboard if user is also an org member
  const onSwitchToOrg = currentOrg ? renderDashboard : null;
  adminDashboard.render(() => {
    onLogout();
  }, onSwitchToOrg);

  currentPage = adminDashboard;
}

function renderNoAccess() {
  const container = document.getElementById('app');
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
}

async function onLogout() {
  try {
    await authService.logout();
    currentUser = null;
    currentEvent = null;
    currentOrg = null;
    isAdmin = false;
    showedLanding = false;
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
    }
  );

  currentPage = integratedDashboard;
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

    medicalPage.render(currentEvent?.id || currentEvent, backToIntegratedDashboard);
    currentPage = medicalPage;
  } else if (moduleName === 'security') {
    const container = document.getElementById('app');
    const securityPage = new SecurityPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    securityPage.render(currentEvent?.id || currentEvent, backToIntegratedDashboard);
    currentPage = securityPage;
  } else if (moduleName === 'safety') {
    const container = document.getElementById('app');
    const safetyPage = new SafetyPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    safetyPage.render(currentEvent?.id || currentEvent, backToIntegratedDashboard);
    currentPage = safetyPage;
  } else if (moduleName === 'staff') {
    const container = document.getElementById('app');
    const staffPage = new StaffPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    staffPage.render(currentEvent?.id || currentEvent, currentUser, backToIntegratedDashboard);
    currentPage = staffPage;
  } else if (moduleName === 'participants') {
    const container = document.getElementById('app');
    const participantsPage = new ParticipantsPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    participantsPage.render(currentEvent?.id || currentEvent, currentUser, backToIntegratedDashboard);
    currentPage = participantsPage;
  } else if (moduleName === 'settings') {
    const container = document.getElementById('app');
    const eventSettings = new EventSettings();

    if (currentPage) {
      currentPage.destroy?.();
    }

    eventSettings.render(currentEvent?.id || currentEvent, backToIntegratedDashboard);
    currentPage = eventSettings;
  } else {
    alert(`${moduleName} module coming soon!`);
  }
}

// Auth state change listener
authService.onAuthChange((user) => {
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
    renderLanding();
  }
});

// Initialize app when page loads
initializeApp();

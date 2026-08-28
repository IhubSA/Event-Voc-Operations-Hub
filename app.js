// Main Application Controller
import { supabase } from './supabase.js';
import { AuthService } from './auth.js';
import { LoginPage } from './login.js';
import { DashboardPage } from './dashboard.js';
import { IntegratedDashboard } from './integrated-dashboard.js';
import { MedicalPage } from './medical.js';
import { SecurityPage } from './security.js';
import { SafetyPage } from './safety.js';

const authService = new AuthService();
let currentUser = null;
let currentEvent = null;
let currentPage = null;

async function initializeApp() {
  const user = await authService.getCurrentUser();

  if (user) {
    currentUser = user;
    renderDashboard();
  } else {
    renderLogin();
  }
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

  dashboardPage.render(currentUser, onEventSelected, onLogout);
  currentPage = dashboardPage;
}

async function onLogout() {
  try {
    await authService.logout();
    currentUser = null;
    currentEvent = null;
    renderLogin();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function onLoginSuccess(user) {
  currentUser = user;
  renderDashboard();
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
      // Module selection callback
      loadModule(module);
    },
    () => {
      // Back button callback
      currentEvent = null;
      renderDashboard();
    }
  );

  currentPage = integratedDashboard;
}

function loadModule(moduleName) {
  if (moduleName === 'dashboard') {
    renderDashboard();
  } else if (moduleName === 'medical') {
    const container = document.getElementById('app');
    const medicalPage = new MedicalPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    medicalPage.render(currentEvent?.id || currentEvent);
    currentPage = medicalPage;
  } else if (moduleName === 'security') {
    const container = document.getElementById('app');
    const securityPage = new SecurityPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    securityPage.render(currentEvent?.id || currentEvent);
    currentPage = securityPage;
  } else if (moduleName === 'safety') {
    const container = document.getElementById('app');
    const safetyPage = new SafetyPage();

    if (currentPage) {
      currentPage.destroy?.();
    }

    safetyPage.render(currentEvent?.id || currentEvent);
    currentPage = safetyPage;
  } else {
    alert(`${moduleName} module coming soon!`);
  }
}

// Auth state change listener
authService.onAuthChange((user) => {
  if (user) {
    currentUser = user;
    if (!currentPage) {
      renderDashboard();
    }
  } else {
    currentUser = null;
    currentEvent = null;
    renderLogin();
  }
});

// Initialize app when page loads
initializeApp();

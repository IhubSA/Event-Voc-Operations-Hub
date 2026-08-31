// Main Application Controller - Updated for Staff Authentication
// Handles both admin and staff login flows
import { supabase } from './supabase.js';
import { AuthService } from './auth.js';
import { LoginPage } from './login.js';
import { StaffLoginPage } from './staff-login.js';
import { DashboardPage } from './dashboard.js';
import { StaffDashboard } from './staff-dashboard.js';
import { IntegratedDashboard } from './integrated-dashboard.js';
import { MedicalPage } from './medical.js';
import { SecurityPage } from './security.js';
import { SafetyPage } from './safety.js';
import { StaffPage } from './staff.js';

const authService = new AuthService();
let currentUser = null;
let currentStaff = null;
let currentEvent = null;
let currentPage = null;
let userType = null; // 'admin' or 'staff'

// Initial app state: show login selection
async function initializeApp() {
  const session = await supabase.auth.getSession();

  if (session.data.session) {
    // User is logged in, determine if they're admin or staff
    await checkUserType(session.data.session.user);
  } else {
    renderLoginSelection();
  }
}

async function checkUserType(user) {
  try {
    // Check if this user is a staff member
    const { data: staffAccount, error } = await supabase
      .from('staff_accounts')
      .select('staff_id, account_status')
      .eq('auth_user_id', user.id)
      .single();

    if (!error && staffAccount && staffAccount.account_status === 'active') {
      // This is a staff member
      userType = 'staff';

      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('event_staff')
        .select('*')
        .eq('id', staffAccount.staff_id)
        .single();

      if (!staffError && staffData) {
        currentStaff = {
          user: user,
          staffData: staffData,
          staffId: staffAccount.staff_id
        };
        renderStaffDashboard();
      } else {
        throw new Error('Could not load staff data');
      }
    } else {
      // This is an admin user
      userType = 'admin';
      currentUser = user;
      renderDashboard();
    }
  } catch (error) {
    console.error('Error checking user type:', error);
    // Default to admin if error
    userType = 'admin';
    currentUser = user;
    renderDashboard();
  }
}

function renderLoginSelection() {
  // This could be a simple selection screen or just go straight to admin login
  // For now, let's render the admin login page with option to switch to staff login
  renderAdminLogin();
}

function renderAdminLogin() {
  const container = document.getElementById('app');
  const loginPage = new LoginPage();
  loginPage.render(onAdminLoginSuccess, renderStaffLoginPage);
}

function renderStaffLoginPage() {
  const container = document.getElementById('app');
  const staffLoginPage = new StaffLoginPage();
  staffLoginPage.render(onStaffLoginSuccess, renderAdminLogin);
}

function onAdminLoginSuccess(user) {
  currentUser = user;
  userType = 'admin';
  currentStaff = null;
  renderDashboard();
}

function onStaffLoginSuccess(staffInfo) {
  currentStaff = staffInfo;
  userType = 'staff';
  currentUser = null;
  renderStaffDashboard();
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

function renderStaffDashboard() {
  const container = document.getElementById('app');
  const staffDashboard = new StaffDashboard();

  if (currentPage) {
    currentPage.destroy?.();
  }

  staffDashboard.render(currentStaff.staffId, currentStaff.staffData, onStaffLogout);
  currentPage = staffDashboard;
}

async function onLogout() {
  try {
    await authService.logout();
    currentUser = null;
    currentStaff = null;
    currentEvent = null;
    userType = null;
    renderLoginSelection();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function onStaffLogout() {
  try {
    await supabase.auth.signOut();
    currentStaff = null;
    currentUser = null;
    currentEvent = null;
    userType = null;
    renderLoginSelection();
  } catch (error) {
    console.error('Logout error:', error);
  }
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
  } else {
    alert(`${moduleName} module coming soon!`);
  }
}

// Auth state change listener
authService.onAuthChange((user) => {
  if (user) {
    if (!currentUser && !currentStaff) {
      currentUser = user;
      if (!currentPage) {
        renderDashboard();
      }
    }
  } else {
    currentUser = null;
    currentStaff = null;
    currentEvent = null;
    userType = null;
    renderLoginSelection();
  }
});

// Initialize app when page loads
initializeApp();

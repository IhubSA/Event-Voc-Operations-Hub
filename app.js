import { supabase, supabaseApi } from './supabase.js';
import { authService } from './auth.js';
import LoginPage from './login.js';
import DashboardPage from './dashboard.js';
import Navbar from './navbar.js';

let currentUser = null;

async function initializeApp() {
  const app = document.getElementById('app');

  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    loadDashboard();
  } else {
    loadLoginPage();
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      loadDashboard();
    } else {
      currentUser = null;
      loadLoginPage();
    }
  });
}

function loadLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const loginPage = new LoginPage({
    onLoginSuccess: () => {
      loadDashboard();
    }
  });

  app.appendChild(loginPage.render());
}

function loadDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Create container
  const container = document.createElement('div');
  container.className = 'app-container';

  // Add navbar
  const navbar = new Navbar({
    userEmail: currentUser?.email,
    onLogout: () => {
      authService.logout();
    }
  });
  container.appendChild(navbar.render());

  // Add dashboard
  const dashboard = new DashboardPage();
  container.appendChild(dashboard.render());

  app.appendChild(container);
}

// Start the app
initializeApp().catch(error => {
  console.error('Failed to initialize app:', error);
});

export { currentUser };

// Main Application Controller
import { supabase } from './supabase.js';
import { AuthService } from './auth.js';
import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/dashboard.js';
import { MedicalPage } from './medical.js';  // ADD THIS

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

  dashboardPage.render(currentUser, onEventSelected);
  currentPage = dashboardPage;
}

function onLoginSuccess(user) {
  currentUser = user;
  renderDashboard();
}

function onEventSelected(eventId) {
  currentEvent = eventId;
  showModuleMenu();
}

function showModuleMenu() {
  const container = document.getElementById('app');

  const menuHtml = `
    <div class="module-menu-wrapper">
      <div class="module-menu-header">
        <h1>📊 Operations Centre</h1>
        <p>Select an operational module</p>
      </div>

      <div class="module-grid">
        <button class="module-card" data-module="dashboard">
          <div class="module-icon">📊</div>
          <h3>Dashboard</h3>
          <p>Overview & General Incidents</p>
        </button>

        <button class="module-card" data-module="medical">
          <div class="module-icon">🏥</div>
          <h3>Medical Operations</h3>
          <p>Patient Care & Triage</p>
        </button>

        <button class="module-card" data-module="security">
          <div class="module-icon">🔒</div>
          <h3>Security</h3>
          <p>Threat Assessment & Investigation</p>
          <span class="badge-coming">Coming Soon</span>
        </button>

        <button class="module-card" data-module="safety">
          <div class="module-icon">⚠️</div>
          <h3>Safety Compliance</h3>
          <p>Inspections & Hazard Tracking</p>
          <span class="badge-coming">Coming Soon</span>
        </button>
      </div>

      <button class="btn btn-secondary btn-back" id="back-btn">← Back to Events</button>
    </div>
  `;

  container.innerHTML = menuHtml;

  // Add styles for module menu
  const style = document.createElement('style');
  style.textContent = `
    .module-menu-wrapper {
      min-height: calc(100vh - 60px);
      background: var(--bg-secondary);
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .module-menu-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .module-menu-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .module-menu-header p {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      width: 100%;
      margin-bottom: 2rem;
    }

    .module-card {
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: inherit;
      color: var(--text-primary);
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-height: 240px;
    }

    .module-card:hover:not([data-module="security"]):not([data-module="safety"]) {
      border-color: var(--primary);
      box-shadow: 0 8px 24px rgba(0, 102, 204, 0.2);
      transform: translateY(-4px);
    }

    .module-card[data-module="security"],
    .module-card[data-module="safety"] {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .module-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .module-card h3 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .module-card p {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      flex: 1;
    }

    .badge-coming {
      display: inline-block;
      background: var(--warning);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: auto;
    }

    .btn-back {
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .module-menu-wrapper {
        padding: 1.5rem 1rem;
      }

      .module-menu-header h1 {
        font-size: 1.75rem;
      }

      .module-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .module-card {
        min-height: auto;
        padding: 1.5rem;
      }
    }
  `;
  document.head.appendChild(style);

  // Add event listeners for module buttons
  document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const module = e.currentTarget.dataset.module;
      if (module !== 'security' && module !== 'safety') {
        loadModule(module);
      }
    });
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    currentEvent = null;
    renderDashboard();
  });
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

    medicalPage.render(currentEvent);
    currentPage = medicalPage;
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

// Main Application Controller
import { supabase } from './supabase.js';
import { AuthService } from './auth.js';
import { LoginPage } from './login.js';
import { DashboardPage } from './dashboard.js';
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

  dashboardPage.render(currentUser, onEventSelected);
  currentPage = dashboardPage;
}

function onLoginSuccess(user) {
  currentUser = user;
  renderDashboard();
}

function onEventSelected(event) {
  currentEvent = event;
  showModuleMenu();
}

function showModuleMenu() {
  const container = document.getElementById('app');

  // Format event details
  const eventName = currentEvent?.name || 'Event';
  const eventLocation = currentEvent?.location || 'Location TBA';
  const eventDate = currentEvent?.start_date ? new Date(currentEvent.start_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Date TBA';

  const menuHtml = `
    <div class="module-menu-wrapper">
      <div class="module-menu-header">
        <img src="/voc-logo.png" alt="VOC Logo" class="module-menu-logo" />
        <h1>Operations Centre</h1>
        <p>Select an operational module</p>

        <div class="event-details">
          <div class="event-detail-item">
            <span class="detail-label">Event:</span>
            <span class="detail-value">${eventName}</span>
          </div>
          <div class="event-detail-item">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${eventLocation}</span>
          </div>
          <div class="event-detail-item">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${eventDate}</span>
          </div>
        </div>
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
        </button>

        <button class="module-card" data-module="safety">
          <div class="module-icon">⚠️</div>
          <h3>Safety Compliance</h3>
          <p>Inspections & Hazard Tracking</p>
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

    .module-menu-logo {
      max-width: 150px;
      width: 100%;
      height: auto;
      margin-bottom: 1.5rem;
    }

    .module-menu-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .module-menu-header p {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin: 0 0 2rem 0;
    }

    .event-details {
      display: flex;
      gap: 2rem;
      justify-content: center;
      flex-wrap: wrap;
      padding: 1.5rem;
      background: rgba(0, 153, 255, 0.1);
      border: 2px solid rgba(0, 153, 255, 0.3);
      border-radius: 8px;
      margin-top: 1.5rem;
      max-width: 600px;
    }

    .event-detail-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .detail-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
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

    .module-card:hover {
      border-color: var(--primary);
      box-shadow: 0 8px 24px rgba(0, 102, 204, 0.2);
      transform: translateY(-4px);
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

      .event-details {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .event-detail-item {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);

  // Add event listeners for module buttons
  document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const module = e.currentTarget.dataset.module;
      loadModule(module);
    });
  });

  // Back button
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      currentEvent = null;
      renderDashboard();
    });
  }
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

// Dashboard Page Component
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';

export class DashboardPage {
  constructor() {
    this.events = [];
    this.selectedEvent = null;
    this.currentUser = null;
  }

  async render(currentUser, onEventSelected, onLogout, onSwitchToAdmin, onOpenClubSettings) {
    this.currentUser = currentUser;
    this.onEventSelected = onEventSelected;
    this.onLogout = onLogout;
    this.onSwitchToAdmin = onSwitchToAdmin;

    const container = document.getElementById('app');

    // Render navbar
    const navbar = new Navbar(currentUser, onLogout || (() => {
      supabase.auth.signOut();
    }), onSwitchToAdmin, onOpenClubSettings);
    const navbarHtml = navbar.render();

    // Initial loading state
    container.innerHTML = wrapWithShell(navbarHtml, `
      <div class="dashboard-wrapper">
        <div class="dashboard-content">
          <h2>Loading events...</h2>
        </div>
      </div>
    `);

    // Load events
    await this.loadEvents();
  }

  async loadEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          code,
          status,
          start_date,
          end_date,
          location,
          expected_attendance,
          organisation_id
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;

      this.events = data || [];
      this.renderDashboard();
    } catch (error) {
      console.error('Error loading events:', error);
      document.querySelector('.dashboard-content').innerHTML = `
        <div class="error">Failed to load events: ${error.message}</div>
      `;
    }
  }

  renderDashboard() {
    const container = document.getElementById('app');
    const dashboardContent = container.querySelector('.dashboard-content');

    if (this.events.length === 0) {
      dashboardContent.innerHTML = `
        <div class="dashboard-header">
          <h1>📅 Events</h1>
          <p>Select an event to manage</p>
        </div>
        <div class="empty-state">
          <p>No events available</p>
        </div>
      `;
      return;
    }

    dashboardContent.innerHTML = `
      <div class="dashboard-header">
        <h1>📅 Events</h1>
        <p>Select an event to manage</p>
      </div>

      <div class="events-grid">
        ${this.events.map(event => `
          <div class="event-card" data-event-id="${event.id}">
            <div class="event-header">
              <div>
                <h3>${event.name}</h3>
                <span class="event-code">${event.code}</span>
              </div>
              <span class="event-status-badge status-${event.status || 'active'}">
                ${(event.status || 'ACTIVE').toUpperCase()}
              </span>
            </div>
            <div class="event-body">
              <div class="event-detail">
                <span class="detail-icon">📍</span>
                <div class="detail-content">
                  <span class="label">Location</span>
                  <span class="value">${event.location || 'N/A'}</span>
                </div>
              </div>
              <div class="event-detail">
                <span class="detail-icon">👥</span>
                <div class="detail-content">
                  <span class="label">Expected Attendance</span>
                  <span class="value">${event.expected_attendance ? event.expected_attendance.toLocaleString() : 'N/A'}</span>
                </div>
              </div>
              <div class="event-detail">
                <span class="detail-icon">📅</span>
                <div class="detail-content">
                  <span class="label">Event Dates</span>
                  <span class="value">${event.start_date} to ${event.end_date}</span>
                </div>
              </div>
            </div>
            <div class="event-actions">
              <button class="btn btn-primary select-event">↪️ Select Event</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.addStyles();

    // Add event listeners
    document.querySelectorAll('.event-card').forEach(card => {
      card.querySelector('.select-event').addEventListener('click', () => {
        const eventId = card.dataset.eventId;
        // Find the full event object from this.events
        const event = this.events.find(e => e.id === eventId);
        if (event) {
          this.onEventSelected(event);
        }
      });
    });
  }

  addStyles() {
    // Only add styles if not already added
    if (document.getElementById('dashboard-events-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'dashboard-events-styles';
    style.textContent = `
      /* VOC Branded Events Dashboard */
      :root {
        --voc-dark-navy: #003D7A;
        --voc-bright-blue: #0099FF;
        --voc-cyan: #00A8E8;
        --voc-orange: #FF9800;
        --voc-green: #4CAF50;
        --bg-primary: #1A2332;
        --bg-secondary: #0F1419;
        --bg-tertiary: #2A3F5F;
        --text-primary: #FFFFFF;
        --text-secondary: #B0BEC5;
        --text-muted: #78909C;
        --border-color: #334455;
        --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
        --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);
        --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
        --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.4);
        --gradient-primary: linear-gradient(135deg, #0099FF 0%, #00A8E8 100%);
        --gradient-accent: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
      }

      .dashboard-wrapper {
        background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
        min-height: 100vh;
      }

      .dashboard-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 3rem 2rem;
      }

      .dashboard-header {
        margin-bottom: 3rem;
        animation: slideUp 0.5s ease;
      }

      .dashboard-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        color: var(--voc-bright-blue);
        letter-spacing: -0.3px;
      }

      .dashboard-header p {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin: 0;
        letter-spacing: 0.3px;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 2.5rem;
        animation: fadeIn 0.6s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .event-card {
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        cursor: pointer;
      }

      .event-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--gradient-primary);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
      }

      .event-card:hover {
        border-color: var(--voc-bright-blue);
        box-shadow: 0 12px 48px rgba(0, 153, 255, 0.25);
        transform: translateY(-6px);
      }

      .event-card:hover::before {
        transform: scaleX(1);
      }

      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.5rem;
        margin-bottom: 1.8rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
      }

      .event-header h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.4rem 0;
        color: var(--voc-bright-blue);
        word-break: break-word;
      }

      .event-code {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .event-status-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
        border: 1px solid;
      }

      .event-status-badge.status-active {
        background: rgba(76, 175, 80, 0.2);
        color: var(--voc-green);
        border-color: var(--voc-green);
      }

      .event-status-badge.status-planning {
        background: rgba(0, 168, 232, 0.2);
        color: var(--voc-cyan);
        border-color: var(--voc-cyan);
      }

      .event-status-badge.status-live {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
        border-color: #4CAF50;
      }

      .event-status-badge.status-completed {
        background: rgba(180, 190, 197, 0.2);
        color: var(--text-secondary);
        border-color: var(--text-secondary);
      }

      .event-body {
        flex: 1;
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      }

      .event-detail {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }

      .detail-icon {
        font-size: 1.3rem;
        flex-shrink: 0;
        margin-top: 0.2rem;
      }

      .detail-content {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }

      .event-detail .label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .event-detail .value {
        font-size: 1rem;
        color: var(--text-secondary);
        font-weight: 500;
        line-height: 1.5;
      }

      .event-actions {
        display: flex;
        gap: 1rem;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: 2px solid transparent;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        white-space: nowrap;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--voc-bright-blue), var(--voc-cyan));
        color: white;
        border-color: transparent;
        box-shadow: var(--shadow-md);
        flex: 1;
      }

      .btn-primary:hover {
        background: linear-gradient(135deg, var(--voc-dark-navy), var(--voc-bright-blue));
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .btn-primary:active {
        transform: translateY(0);
      }

      .empty-state {
        text-align: center;
        padding: 5rem 2rem;
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        color: var(--text-muted);
        font-size: 1.2rem;
        font-weight: 500;
      }

      .error {
        background: rgba(255, 82, 82, 0.15);
        border: 2px solid #FF6B6B;
        border-radius: 8px;
        padding: 1.5rem;
        color: #FFB3B3;
        font-weight: 500;
      }

      @media (max-width: 1024px) {
        .events-grid {
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }
      }

      @media (max-width: 768px) {
        .dashboard-content {
          padding: 2rem 1rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
        }

        .events-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .event-card {
          padding: 1.5rem;
        }

        .event-header {
          flex-direction: column;
          gap: 1rem;
        }

        .event-status-badge {
          align-self: flex-start;
        }
      }

      @media (max-width: 480px) {
        .dashboard-content {
          padding: 1.5rem 1rem;
        }

        .dashboard-header h1 {
          font-size: 1.75rem;
        }

        .event-card {
          padding: 1.2rem;
        }

        .event-header h3 {
          font-size: 1.25rem;
        }

        .btn {
          padding: 0.65rem 1rem;
          font-size: 0.85rem;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

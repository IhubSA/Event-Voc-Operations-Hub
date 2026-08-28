// Dashboard Page Component - Improved UI/UX
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';

export class DashboardPage {
  constructor() {
    this.events = [];
    this.filteredEvents = [];
    this.selectedEvent = null;
    this.currentUser = null;
    this.searchTerm = '';
  }

  async render(currentUser, onEventSelected) {
    this.currentUser = currentUser;
    this.onEventSelected = onEventSelected;

    const container = document.getElementById('app');

    // Render navbar
    const navbar = new Navbar(currentUser, () => {
      supabase.auth.signOut();
    });
    const navbarHtml = navbar.render();

    // Initial loading state
    container.innerHTML = navbarHtml + `
      <div class="dashboard-wrapper">
        <div class="dashboard-loading">
          <div class="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    `;

    // Add dashboard styles
    this.addDashboardStyles();

    // Load events
    await this.loadEvents();
  }

  addDashboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-wrapper {
        min-height: calc(100vh - 60px);
        background: var(--bg-secondary);
        padding: 2rem;
      }

      .dashboard-loading {
        min-height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: var(--text-secondary);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(102, 126, 234, 0.2);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .dashboard-header {
        margin-bottom: 3rem;
        animation: fadeIn 0.6s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .dashboard-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        letter-spacing: -0.5px;
      }

      .dashboard-header p {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .dashboard-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .search-box {
        flex: 1;
        min-width: 250px;
        position: relative;
      }

      .search-box input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 2.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.95rem;
        transition: all 0.3s ease;
      }

      .search-box input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .search-box input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1rem;
        pointer-events: none;
      }

      .filter-buttons {
        display: flex;
        gap: 0.75rem;
      }

      .filter-btn {
        padding: 0.75rem 1.25rem;
        border: 2px solid var(--border-color);
        background: var(--bg-primary);
        color: var(--text-primary);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        white-space: nowrap;
      }

      .filter-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      .filter-btn.active {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }

      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .event-card {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        height: 100%;
        animation: slideUp 0.5s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .event-card:hover {
        border-color: var(--primary);
        box-shadow: 0 12px 32px rgba(102, 126, 234, 0.15);
        transform: translateY(-4px);
      }

      .event-header {
        padding: 1.5rem;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05));
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .event-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
        flex: 1;
        line-height: 1.3;
      }

      .event-code {
        display: inline-block;
        padding: 0.4rem 0.8rem;
        background: var(--bg-secondary);
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--primary);
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .event-body {
        flex: 1;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .event-detail {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 1rem;
        align-items: center;
      }

      .event-detail .label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .event-detail .value {
        font-size: 0.95rem;
        color: var(--text-primary);
        word-break: break-word;
      }

      .event-detail .value.status-active {
        color: #4CAF50;
        font-weight: 600;
      }

      .event-detail .value.status-upcoming {
        color: #FFC107;
        font-weight: 600;
      }

      .event-detail .value.status-completed {
        color: #90A4AE;
        font-weight: 600;
      }

      .event-detail .value.status-paused {
        color: #FF9800;
        font-weight: 600;
      }

      .event-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        padding: 1rem;
        background: rgba(102, 126, 234, 0.05);
        border-radius: 8px;
        margin-top: 0.5rem;
      }

      .stat {
        text-align: center;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--primary);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-top: 0.25rem;
      }

      .event-actions {
        padding: 1.5rem;
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 0.75rem;
      }

      .select-event {
        flex: 1;
        padding: 0.85rem;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.95rem;
      }

      .select-event:hover {
        background: #0052a3;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
      }

      .select-event:active {
        transform: translateY(0);
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        background: var(--bg-primary);
        border: 2px dashed var(--border-color);
        border-radius: 12px;
      }

      .empty-state-icon {
        font-size: 3.5rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        font-size: 1.3rem;
      }

      .empty-state p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
        line-height: 1.5;
      }

      .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 2rem;
      }

      .no-results p {
        color: var(--text-secondary);
        font-size: 1rem;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .dashboard-wrapper {
          padding: 1rem;
        }

        .dashboard-header h1 {
          font-size: 1.75rem;
        }

        .dashboard-controls {
          flex-direction: column;
          gap: 1rem;
        }

        .search-box {
          min-width: 100%;
        }

        .filter-buttons {
          width: 100%;
          flex-wrap: wrap;
        }

        .events-grid {
          grid-template-columns: 1fr;
        }

        .event-detail {
          grid-template-columns: 1fr;
        }

        .event-detail .label {
          font-size: 0.8rem;
          margin-bottom: -0.5rem;
        }
      }

      @media (max-width: 480px) {
        .dashboard-wrapper {
          padding: 0.75rem;
        }

        .dashboard-header h1 {
          font-size: 1.4rem;
          margin-bottom: 0.25rem;
        }

        .dashboard-header p {
          font-size: 0.9rem;
        }

        .event-header {
          padding: 1rem;
        }

        .event-body {
          padding: 1rem;
          gap: 0.75rem;
        }

        .event-actions {
          padding: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
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
      this.filteredEvents = this.events;
      this.renderDashboard();
    } catch (error) {
      console.error('Error loading events:', error);
      const container = document.getElementById('app');
      const wrapper = container.querySelector('.dashboard-wrapper');
      if (wrapper) {
        wrapper.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Failed to Load Events</h3>
            <p>${error.message}</p>
          </div>
        `;
      }
    }
  }

  renderDashboard() {
    const container = document.getElementById('app');
    const wrapper = container.querySelector('.dashboard-wrapper');

    if (this.events.length === 0) {
      wrapper.innerHTML = `
        <div class="dashboard-header">
          <h1>Events</h1>
          <p>No events available</p>
        </div>
        <div class="events-grid">
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <h3>No Events Yet</h3>
            <p>There are currently no events to manage. Please contact your administrator.</p>
          </div>
        </div>
      `;
      return;
    }

    wrapper.innerHTML = `
      <div class="dashboard-header">
        <h1>Events</h1>
        <p>Select an event to access operational modules</p>
      </div>

      <div class="dashboard-controls">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            id="search-input"
            placeholder="Search events by name, code, or location..."
            autocomplete="off"
          />
        </div>
        <div class="filter-buttons">
          <button class="filter-btn active" data-filter="all">All Events</button>
          <button class="filter-btn" data-filter="active">Active</button>
          <button class="filter-btn" data-filter="upcoming">Upcoming</button>
        </div>
      </div>

      <div class="events-grid" id="events-container">
        ${this.events.map(event => {
          const days = this.getEventDays(event.start_date, event.end_date);
          return `
            <div class="event-card" data-event-id="${event.id}">
              <div class="event-header">
                <div>
                  <h3>${event.name}</h3>
                </div>
                <span class="event-code">${event.code}</span>
              </div>

              <div class="event-body">
                <div class="event-detail">
                  <span class="label">📍 Location</span>
                  <span class="value">${event.location || 'N/A'}</span>
                </div>

                <div class="event-detail">
                  <span class="label">👥 Attendance</span>
                  <span class="value">${event.expected_attendance ? event.expected_attendance.toLocaleString() : 'N/A'}</span>
                </div>

                <div class="event-detail">
                  <span class="label">📅 Duration</span>
                  <span class="value">${event.start_date} → ${event.end_date}</span>
                </div>

                <div class="event-detail">
                  <span class="label">Status</span>
                  <span class="value status-${event.status}">${event.status.toUpperCase()}</span>
                </div>

                <div class="event-stats">
                  <div class="stat">
                    <div class="stat-value">${days}</div>
                    <div class="stat-label">Days</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">4</div>
                    <div class="stat-label">Modules</div>
                  </div>
                </div>
              </div>

              <div class="event-actions">
                <button class="select-event">Select Event →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Add event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.filterEvents();
      });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterEvents(e.target.dataset.filter);
      });
    });

    // Event card selection
    document.querySelectorAll('.event-card').forEach(card => {
      card.querySelector('.select-event').addEventListener('click', () => {
        const eventId = card.dataset.eventId;
        this.onEventSelected(eventId);
      });
    });
  }

  filterEvents(filter = 'all') {
    let filtered = this.events;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(e => e.status.toLowerCase() === filter);
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(this.searchTerm) ||
        e.code.toLowerCase().includes(this.searchTerm) ||
        (e.location && e.location.toLowerCase().includes(this.searchTerm))
      );
    }

    this.filteredEvents = filtered;
    this.renderFilteredEvents();
  }

  renderFilteredEvents() {
    const container = document.getElementById('events-container');

    if (this.filteredEvents.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <p>No events match your search criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredEvents.map(event => {
      const days = this.getEventDays(event.start_date, event.end_date);
      return `
        <div class="event-card" data-event-id="${event.id}">
          <div class="event-header">
            <div>
              <h3>${event.name}</h3>
            </div>
            <span class="event-code">${event.code}</span>
          </div>

          <div class="event-body">
            <div class="event-detail">
              <span class="label">📍 Location</span>
              <span class="value">${event.location || 'N/A'}</span>
            </div>

            <div class="event-detail">
              <span class="label">👥 Attendance</span>
              <span class="value">${event.expected_attendance ? event.expected_attendance.toLocaleString() : 'N/A'}</span>
            </div>

            <div class="event-detail">
              <span class="label">📅 Duration</span>
              <span class="value">${event.start_date} → ${event.end_date}</span>
            </div>

            <div class="event-detail">
              <span class="label">Status</span>
              <span class="value status-${event.status}">${event.status.toUpperCase()}</span>
            </div>

            <div class="event-stats">
              <div class="stat">
                <div class="stat-value">${days}</div>
                <div class="stat-label">Days</div>
              </div>
              <div class="stat">
                <div class="stat-value">4</div>
                <div class="stat-label">Modules</div>
              </div>
            </div>
          </div>

          <div class="event-actions">
            <button class="select-event">Select Event →</button>
          </div>
        </div>
      `;
    }).join('');

    // Re-add event listeners
    document.querySelectorAll('.event-card').forEach(card => {
      card.querySelector('.select-event').addEventListener('click', () => {
        const eventId = card.dataset.eventId;
        this.onEventSelected(eventId);
      });
    });
  }

  getEventDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
  }
}

// Dashboard Page Component
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { AddEventModal } from './add-event.js';

export class DashboardPage {
  constructor() {
    this.currentUser = null;
    this.events = [];
    this.filteredEvents = [];
    this.filter = 'all';
    this.searchQuery = '';
    this.eventSubscription = null;
  }

  async render(currentUser, onEventSelected, onLogout) {
    this.currentUser = currentUser;
    this.onEventSelected = onEventSelected;
    this.onLogout = onLogout;

    const container = document.getElementById('app');

    // Render navbar
    const navbar = new Navbar(currentUser, onLogout);

    const navbarHtml = navbar.render();

    const dashboardHtml = `
      ${navbarHtml}
      <div class="dashboard-container">
        <div class="dashboard-header">
          <div class="header-content">
            <h1>Events Management</h1>
            <p>Manage and monitor your venue events</p>
          </div>
          <button class="btn btn-primary" id="add-event-btn">
            <span>+ Add Event</span>
          </button>
        </div>

        <div class="dashboard-controls">
          <div class="search-box">
            <input
              type="text"
              id="search-input"
              placeholder="Search events..."
              class="search-input"
            />
          </div>
          <div class="filter-buttons">
            <button class="filter-btn active" data-filter="all">All Events</button>
            <button class="filter-btn" data-filter="active">Active</button>
            <button class="filter-btn" data-filter="upcoming">Upcoming</button>
          </div>
        </div>

        <div class="events-container">
          <div id="events-list" class="events-grid"></div>
          <div id="loading-message" class="loading-message" style="display: none;">
            Loading events...
          </div>
          <div id="empty-message" class="empty-message" style="display: none;">
            No events found. Click "Add Event" to create one.
          </div>
        </div>
      </div>
    `;

    container.innerHTML = dashboardHtml;

    // Add dashboard styles
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-container {
        min-height: calc(100vh - 60px);
        background: var(--bg-secondary);
        padding: 2rem;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        box-shadow: var(--shadow-md);
      }

      .header-content h1 {
        margin: 0 0 0.5rem 0;
        color: var(--primary);
        font-size: 2rem;
      }

      .header-content p {
        margin: 0;
        color: var(--text-secondary);
      }

      .dashboard-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .search-box {
        flex: 1;
        min-width: 250px;
      }

      .search-input {
        width: 100%;
        padding: 0.85rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.95rem;
        transition: all 0.3s ease;
      }

      .search-input::placeholder {
        color: var(--text-muted);
      }

      .search-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.15);
      }

      .filter-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .filter-btn {
        padding: 0.75rem 1.25rem;
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 8px;
        color: var(--text-primary);
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        white-space: nowrap;
      }

      .filter-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      .filter-btn.active {
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        border-color: transparent;
        color: white;
      }

      .events-container {
        position: relative;
      }

      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .event-card {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .event-card:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
        transform: translateY(-4px);
      }

      .event-card-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
      }

      .event-title {
        flex: 1;
      }

      .event-title h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .event-code {
        background: rgba(0, 153, 255, 0.2);
        color: var(--primary);
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }

      .event-details {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(0, 153, 255, 0.05);
        border: 1px solid var(--border-color);
        border-radius: 8px;
      }

      .event-detail {
        display: flex;
        gap: 0.75rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .event-detail-icon {
        font-size: 1.1rem;
        min-width: 20px;
      }

      .event-detail-text {
        flex: 1;
      }

      .event-stats {
        display: flex;
        justify-content: space-around;
        padding: 1rem 0;
        border-top: 1px solid var(--border-color);
      }

      .stat {
        text-align: center;
      }

      .stat-number {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
      }

      .stat-label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-top: 0.25rem;
      }

      .event-actions {
        display: flex;
        gap: 0.5rem;
      }

      .event-actions .btn {
        flex: 1;
        font-size: 0.9rem;
        padding: 0.6rem 1rem;
      }

      .loading-message,
      .empty-message {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
        font-size: 1.1rem;
      }

      @media (max-width: 768px) {
        .dashboard-container {
          padding: 1rem;
        }

        .dashboard-header {
          flex-direction: column;
          align-items: stretch;
        }

        .dashboard-header h1 {
          font-size: 1.5rem;
        }

        .dashboard-controls {
          flex-direction: column;
        }

        .search-box {
          min-width: unset;
        }

        .filter-buttons {
          flex-wrap: wrap;
        }

        .events-grid {
          grid-template-columns: 1fr;
        }

        .event-stats {
          flex-wrap: wrap;
          gap: 1rem;
        }
      }
    `;
    document.head.appendChild(style);

    // Load events and setup event listeners
    await this.loadEvents();
    this.setupEventListeners();
  }

  async loadEvents() {
    const loading = document.getElementById('loading-message');
    const empty = document.getElementById('empty-message');
    const eventsList = document.getElementById('events-list');

    loading.style.display = 'block';
    eventsList.innerHTML = '';

    try {
      // Fetch events from Supabase
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        throw error;
      }

      this.events = data || [];
      this.filterAndRenderEvents();
      loading.style.display = 'none';

      // Show empty message if no events
      if (this.events.length === 0) {
        empty.style.display = 'block';
      } else {
        empty.style.display = 'none';
      }

      // Setup real-time subscription
      this.subscribeToEvents();
    } catch (error) {
      console.error('Error loading events:', error);
      loading.style.display = 'none';
      loading.textContent = 'Error loading events. Please refresh.';
    }
  }

  subscribeToEvents() {
    // Unsubscribe from previous subscription if exists
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }

    // Subscribe to real-time changes using new Supabase syntax
    this.eventSubscription = supabase
      .channel('events-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('Event updated:', payload);
          this.loadEvents();
        }
      )
      .subscribe();
  }

  filterAndRenderEvents() {
    const eventsList = document.getElementById('events-list');
    const empty = document.getElementById('empty-message');

    // Filter by status
    let filtered = this.events;

    if (this.filter === 'active') {
      const today = new Date();
      filtered = filtered.filter(event => new Date(event.start_date) <= today);
    } else if (this.filter === 'upcoming') {
      const today = new Date();
      filtered = filtered.filter(event => new Date(event.start_date) > today);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }

    this.filteredEvents = filtered;

    // Render events
    if (filtered.length === 0) {
      eventsList.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    eventsList.innerHTML = filtered.map(event => this.createEventCardHtml(event)).join('');

    // Add click listeners to event cards
    document.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => {
        const eventId = card.dataset.eventId;
        const event = this.events.find(e => e.id === eventId);
        if (event) {
          this.onEventSelected(event);
        }
      });
    });
  }

  createEventCardHtml(event) {
    const eventDate = new Date(event.start_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Generate event code
    const eventCode = event.code || (event.event_type ? event.event_type.substring(0, 1).toUpperCase() + event.start_date.substring(5, 7) + event.start_date.substring(8, 10) : 'EVENT');

    return `
      <div class="event-card" data-event-id="${event.id}">
        <div class="event-card-header">
          <div class="event-title">
            <h3>${event.name}</h3>
          </div>
          <span class="event-code">${eventCode}</span>
        </div>

        <div class="event-details">
          <div class="event-detail">
            <span class="event-detail-icon">📍</span>
            <span class="event-detail-text">${event.location}</span>
          </div>
          <div class="event-detail">
            <span class="event-detail-icon">📅</span>
            <span class="event-detail-text">${formattedDate}</span>
          </div>
          ${event.event_type ? `
            <div class="event-detail">
              <span class="event-detail-icon">🏷️</span>
              <span class="event-detail-text">${event.event_type}</span>
            </div>
          ` : ''}
        </div>

        <div class="event-stats">
          <div class="stat">
            <span class="stat-number">0</span>
            <span class="stat-label">Medical</span>
          </div>
          <div class="stat">
            <span class="stat-number">0</span>
            <span class="stat-label">Security</span>
          </div>
          <div class="stat">
            <span class="stat-number">0</span>
            <span class="stat-label">Safety</span>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Add Event button
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => {
        const modal = new AddEventModal();
        modal.render(
          (newEvent) => {
            // Refresh events list after creation
            this.loadEvents();
          },
          () => {
            // Modal cancelled
            console.log('Event creation cancelled');
          }
        );
      });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter;
        this.filterAndRenderEvents();
      });
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.filterAndRenderEvents();
      });
    }
  }

  destroy() {
    // Cleanup
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
  }
}

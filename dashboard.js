// Dashboard Page Component
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';

export class DashboardPage {
  constructor() {
    this.events = [];
    this.selectedEvent = null;
    this.currentUser = null;
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
        <div class="dashboard-content">
          <h2>Loading events...</h2>
        </div>
      </div>
    `;

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
        <div class="empty-state">
          <p>No events available</p>
        </div>
      `;
      return;
    }

    dashboardContent.innerHTML = `
      <div class="dashboard-header">
        <h1>Events</h1>
        <p>Select an event to manage</p>
      </div>

      <div class="events-grid">
        ${this.events.map(event => `
          <div class="event-card" data-event-id="${event.id}">
            <div class="event-header">
              <h3>${event.name}</h3>
              <span class="event-code">${event.code}</span>
            </div>
            <div class="event-body">
              <div class="event-detail">
                <span class="label">Location:</span>
                <span class="value">${event.location || 'N/A'}</span>
              </div>
              <div class="event-detail">
                <span class="label">Expected Attendance:</span>
                <span class="value">${event.expected_attendance ? event.expected_attendance.toLocaleString() : 'N/A'}</span>
              </div>
              <div class="event-detail">
                <span class="label">Dates:</span>
                <span class="value">${event.start_date} to ${event.end_date}</span>
              </div>
              <div class="event-detail">
                <span class="label">Status:</span>
                <span class="value status-${event.status}">${event.status.toUpperCase()}</span>
              </div>
            </div>
            <div class="event-actions">
              <button class="btn btn-primary select-event">Select Event</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add event listeners
    document.querySelectorAll('.event-card').forEach(card => {
      card.querySelector('.select-event').addEventListener('click', () => {
        const eventId = card.dataset.eventId;
        this.onEventSelected(eventId);
      });
    });
  }
}

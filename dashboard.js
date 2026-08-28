import { supabaseApi } from '../services/supabase.js';

export default class DashboardPage {
  constructor() {
    this.selectedEvent = null;
    this.events = [];
    this.incidents = [];
    this.venues = [];
  }

  async loadEvents() {
    this.events = await supabaseApi.getEvents();
    return this.events;
  }

  async loadEventDetails(eventId) {
    this.selectedEvent = await supabaseApi.getEventById(eventId);
    this.incidents = await supabaseApi.getIncidentsByEvent(eventId);
    this.venues = await supabaseApi.getVenuesByEvent(eventId);
  }

  getSeverityColor(severity) {
    const colors = {
      'critical': '#b31b1b',
      'high': '#ff8c00',
      'medium': '#ffc107',
      'low': '#0066cc'
    };
    return colors[severity] || '#666';
  }

  render() {
    const container = document.createElement('div');
    container.className = 'dashboard-container';

    const contentArea = document.createElement('div');
    contentArea.className = 'dashboard-content';

    // Loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.textContent = 'Loading events...';
    contentArea.appendChild(loadingDiv);

    // Load events and render
    this.loadEvents().then(() => {
      loadingDiv.remove();

      if (this.events.length === 0) {
        const noEventsDiv = document.createElement('div');
        noEventsDiv.className = 'empty-state';
        noEventsDiv.innerHTML = '<p>No events found. Create your first event in Supabase.</p>';
        contentArea.appendChild(noEventsDiv);
        return;
      }

      // Event selection grid
      const eventsSection = document.createElement('section');
      eventsSection.className = 'section';

      const eventsTitle = document.createElement('h2');
      eventsTitle.textContent = 'Available Events';
      eventsSection.appendChild(eventsTitle);

      const eventsGrid = document.createElement('div');
      eventsGrid.className = 'events-grid';

      this.events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.style.cursor = 'pointer';

        const eventName = document.createElement('h3');
        eventName.textContent = event.name;

        const eventCode = document.createElement('p');
        eventCode.className = 'text-muted';
        eventCode.textContent = `Code: ${event.code}`;

        const eventDate = document.createElement('p');
        eventDate.className = 'text-muted';
        const startDate = new Date(event.start_date).toLocaleDateString();
        eventDate.textContent = `Start: ${startDate}`;

        eventCard.appendChild(eventName);
        eventCard.appendChild(eventCode);
        eventCard.appendChild(eventDate);

        eventCard.addEventListener('click', async () => {
          await this.loadEventDetails(event.id);
          this.renderEventDetails(contentArea);
        });

        eventsGrid.appendChild(eventCard);
      });

      eventsSection.appendChild(eventsGrid);
      contentArea.appendChild(eventsSection);
    });

    container.appendChild(contentArea);
    return container;
  }

  renderEventDetails(container) {
    // Clear and rebuild
    container.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Back to Events';
    backBtn.style.marginBottom = '20px';
    backBtn.addEventListener('click', () => {
      container.innerHTML = '';
      this.render().childNodes.forEach(node => container.appendChild(node.cloneNode(true)));
    });
    container.appendChild(backBtn);

    // Event header
    const eventHeader = document.createElement('section');
    eventHeader.className = 'section';

    const eventTitle = document.createElement('h1');
    eventTitle.textContent = this.selectedEvent.name;
    eventHeader.appendChild(eventTitle);

    const eventStats = document.createElement('div');
    eventStats.className = 'stats-grid';

    const statCards = [
      { label: 'Status', value: this.selectedEvent.status || 'N/A' },
      { label: 'Venues', value: this.venues.length },
      { label: 'Incidents', value: this.incidents.length }
    ];

    statCards.forEach(stat => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `<div class="stat-value">${stat.value}</div><div class="stat-label">${stat.label}</div>`;
      eventStats.appendChild(card);
    });

    eventHeader.appendChild(eventStats);
    container.appendChild(eventHeader);

    // Venues section
    if (this.venues.length > 0) {
      const venuesSection = document.createElement('section');
      venuesSection.className = 'section';

      const venuesTitle = document.createElement('h2');
      venuesTitle.textContent = 'Venues';
      venuesSection.appendChild(venuesTitle);

      const venuesGrid = document.createElement('div');
      venuesGrid.className = 'venues-grid';

      this.venues.forEach(venue => {
        const venueCard = document.createElement('div');
        venueCard.className = 'venue-card';
        venueCard.innerHTML = `
          <h3>${venue.name}</h3>
          <p class="text-muted">Capacity: ${venue.capacity}</p>
          <p class="text-muted">Status: ${venue.status}</p>
        `;
        venuesGrid.appendChild(venueCard);
      });

      venuesSection.appendChild(venuesGrid);
      container.appendChild(venuesSection);
    }

    // Incidents section
    if (this.incidents.length > 0) {
      const incidentsSection = document.createElement('section');
      incidentsSection.className = 'section';

      const incidentsTitle = document.createElement('h2');
      incidentsTitle.textContent = 'Recent Incidents';
      incidentsSection.appendChild(incidentsTitle);

      const incidentsList = document.createElement('div');
      incidentsList.className = 'incidents-list';

      this.incidents.slice(0, 10).forEach(incident => {
        const incidentItem = document.createElement('div');
        incidentItem.className = 'incident-item';

        const severityBadge = document.createElement('span');
        severityBadge.className = 'severity-badge';
        severityBadge.textContent = (incident.severity || 'low').toUpperCase();
        severityBadge.style.backgroundColor = this.getSeverityColor(incident.severity);

        const incidentTitle = document.createElement('h4');
        incidentTitle.textContent = incident.title || 'Untitled Incident';

        const incidentCategory = document.createElement('p');
        incidentCategory.className = 'text-muted';
        incidentCategory.textContent = incident.incident_category?.name || 'Uncategorized';

        const incidentTime = document.createElement('p');
        incidentTime.className = 'text-muted';
        const time = new Date(incident.created_at).toLocaleString();
        incidentTime.textContent = time;

        incidentItem.appendChild(severityBadge);
        incidentItem.appendChild(incidentTitle);
        incidentItem.appendChild(incidentCategory);
        incidentItem.appendChild(incidentTime);

        incidentsList.appendChild(incidentItem);
      });

      incidentsSection.appendChild(incidentsList);
      container.appendChild(incidentsSection);
    }
  }
}

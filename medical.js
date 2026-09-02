// Medical Operations Module - Dashboard Page
import { supabase, supabaseApi } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';

export class MedicalPage {
  constructor() {
    this.currentEvent = null;
    this.medicalIncidents = [];
    this.medicalResources = [];
    this.selectedIncident = null;
    this.unsubscribe = null;
    this.medicalCategoryId = null;
  }

  async render(eventId, onBack, currentUser, onOpenClubSettings) {
    this.currentEvent = eventId;
    this.onBack = onBack;
    const container = document.getElementById('app');

    // Fetch the Medical incident category ID
    await this.fetchMedicalCategoryId();

    const navbar = new Navbar(currentUser, () => {}, null, onOpenClubSettings);
    const navbarHtml = navbar.render();

    const bodyHtml = `
      <div class="medical-dashboard">
        <div class="medical-header">
          <div class="medical-header-top">
            <h1>Medical Operations</h1>
            <button class="btn btn-secondary btn-small" id="back-btn-medical">← Back to Dashboard</button>
          </div>
          <div class="medical-header-stats">
            <div class="stat-card critical">
              <div class="stat-value" id="critical-count">0</div>
              <div class="stat-label">Critical</div>
            </div>
            <div class="stat-card high">
              <div class="stat-value" id="high-count">0</div>
              <div class="stat-label">High Priority</div>
            </div>
            <div class="stat-card medium">
              <div class="stat-value" id="medium-count">0</div>
              <div class="stat-label">Medium</div>
            </div>
            <div class="stat-card low">
              <div class="stat-value" id="low-count">0</div>
              <div class="stat-label">Low</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="resources-count">0</div>
              <div class="stat-label">Resources Available</div>
            </div>
          </div>
        </div>

        <div class="medical-content">
          <div class="medical-main">
            <div class="incidents-section">
              <div class="section-header">
                <h2>Medical Incidents</h2>
                <button class="btn btn-primary" id="new-incident-btn">+ New Incident</button>
              </div>
              <div class="medical-incidents-list" id="incidents-container">
                <div class="loading">Loading incidents...</div>
              </div>
            </div>
          </div>

          <div class="medical-sidebar">
            <div class="resources-section">
              <h3>Medical Resources</h3>
              <div class="resources-list" id="resources-container">
                <div class="loading">Loading resources...</div>
              </div>
            </div>
            <div class="response-times-section">
              <h3>Response Metrics</h3>
              <div class="metrics-container" id="metrics-container">
                <div class="metric">
                  <span class="metric-label">Avg Response Time</span>
                  <span class="metric-value" id="avg-response">--</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Resolved Today</span>
                  <span class="metric-value" id="resolved-today">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="incident-detail-modal" id="incident-modal" style="display: none !important;">
          <div class="modal-content">
            <button class="modal-close" id="close-modal">&times;</button>
            <div id="detail-container"></div>
          </div>
        </div>

        <div class="new-incident-modal" id="new-incident-modal" style="display: none !important;">
          <div class="modal-content">
            <button class="modal-close" id="close-new-modal">&times;</button>
            <h2>Report Medical Incident</h2>
            <form id="new-incident-form">
              <div class="form-group">
                <label>Patient Name</label>
                <input type="text" id="patient-name" required />
              </div>
              <div class="form-group">
                <label>Patient Age</label>
                <input type="number" id="patient-age" required />
              </div>
              <div class="form-group">
                <label>Triage Level</label>
                <select id="triage-level" required>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium" selected>Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div class="form-group">
                <label>Symptoms</label>
                <textarea id="symptoms" required rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Location (Venue/Zone)</label>
                <input type="text" id="incident-location" required />
              </div>
              <div class="form-group">
                <label>Assign to Medical Staff</label>
                <select id="assigned-staff">
                  <option value="">Unassigned</option>
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-incident">Cancel</button>
                <button type="submit" class="btn btn-primary">Report Incident</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = wrapWithShell(navbarHtml, bodyHtml);

    // Load data
    await this.loadMedicalIncidents();
    await this.loadMedicalResources();

    // Setup event listeners
    this.setupEventListeners();

    // Subscribe to real-time updates
    this.subscribeToIncidents();
  }

  async fetchMedicalCategoryId() {
    try {
      const { data, error } = await supabase
        .from('incident_categories')
        .select('id')
        .eq('domain', 'medical')
        .limit(1)
        .single();

      if (data) {
        this.medicalCategoryId = data.id;
      }
    } catch (error) {
      console.error('Error fetching medical category:', error);
      // Continue anyway - will show error when trying to create incident
    }
  }

  async loadMedicalIncidents() {
    try {
      const { data, error } = await supabase
        .from('medical_incidents')
        .select(`
          id,
          incident_id,
          medical_type,
          severity,
          patient_name,
          patient_age,
          triage_level,
          symptoms,
          vital_signs,
          assigned_to_user_id,
          response_time,
          resolved_at,
          treatment_notes,
          created_at,
          incidents!inner(id, title, description, venue_id, zone_id, status, created_at)
        `)
        .eq('incidents.event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.medicalIncidents = data || [];
      this.renderIncidents();
      this.updateStats();
    } catch (error) {
      console.error('Error loading medical incidents:', error);
      document.getElementById('incidents-container').innerHTML =
        `<div class="error">Failed to load incidents: ${error.message}</div>`;
    }
  }

  async loadMedicalResources() {
    try {
      const { data, error } = await supabase
        .from('medical_resources')
        .select('*')
        .eq('event_id', this.currentEvent)
        .eq('status', 'available');

      if (error) throw error;

      this.medicalResources = data || [];
      this.renderResources();
    } catch (error) {
      console.error('Error loading medical resources:', error);
    }
  }

  renderIncidents() {
    const container = document.getElementById('incidents-container');

    if (this.medicalIncidents.length === 0) {
      container.innerHTML = `<div class="empty-state">No medical incidents reported</div>`;
      return;
    }

    container.innerHTML = this.medicalIncidents.map(incident => `
      <div class="medical-incident-card triage-${incident.triage_level || 'medium'}" data-incident-id="${incident.id}">
        <div class="card-header">
          <div class="triage-badge triage-${incident.triage_level || 'medium'}">
            ${(incident.triage_level || 'medium').toUpperCase()}
          </div>
          <div class="incident-status ${incident.incidents.status}">
            ${incident.incidents.status.toUpperCase()}
          </div>
        </div>

        <div class="card-body">
          <h3>${incident.patient_name || 'Unknown Patient'}</h3>
          <div class="incident-details">
            <div class="detail-row">
              <span class="label">Age:</span>
              <span class="value">${incident.patient_age || '--'} years</span>
            </div>
            <div class="detail-row">
              <span class="label">Symptoms:</span>
              <span class="value">${incident.symptoms || 'Not recorded'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Reported:</span>
              <span class="value">${new Date(incident.created_at).toLocaleTimeString()}</span>
            </div>
            ${incident.response_time ? `
              <div class="detail-row">
                <span class="label">Response Time:</span>
                <span class="value">${incident.response_time}</span>
              </div>
            ` : ''}
            ${incident.resolved_at ? `
              <div class="detail-row">
                <span class="label">Resolved:</span>
                <span class="value">${new Date(incident.resolved_at).toLocaleTimeString()}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-primary view-incident" data-incident-id="${incident.id}">View Details</button>
          ${incident.incidents.status === 'open' ? `
            <button class="btn btn-sm btn-success mark-resolved" data-incident-id="${incident.id}">Mark Resolved</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  renderResources() {
    const container = document.getElementById('resources-container');

    if (this.medicalResources.length === 0) {
      container.innerHTML = `<div class="empty-state">No available resources</div>`;
      return;
    }

    container.innerHTML = this.medicalResources.map(resource => `
      <div class="resource-card">
        <div class="resource-type">${resource.resource_type}</div>
        <div class="resource-info">
          <div class="info-row">
            <span>${resource.description || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Location:</span>
            <span>${resource.location || 'Unknown'}</span>
          </div>
          ${resource.contact_person ? `
            <div class="info-row">
              <span class="label">Contact:</span>
              <span>${resource.contact_person}</span>
            </div>
          ` : ''}
          <div class="resource-status">
            <span class="status-badge status-${resource.status}">${resource.status}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Update resources count
    document.getElementById('resources-count').textContent = this.medicalResources.length;
  }

  updateStats() {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    this.medicalIncidents.forEach(incident => {
      const triage = incident.triage_level || 'medium';
      stats[triage]++;
    });

    document.getElementById('critical-count').textContent = stats.critical;
    document.getElementById('high-count').textContent = stats.high;
    document.getElementById('medium-count').textContent = stats.medium;
    document.getElementById('low-count').textContent = stats.low;

    // Calculate resolved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = this.medicalIncidents.filter(i => {
      if (!i.resolved_at) return false;
      const resolved = new Date(i.resolved_at);
      resolved.setHours(0, 0, 0, 0);
      return resolved.getTime() === today.getTime();
    }).length;

    document.getElementById('resolved-today').textContent = resolvedToday;
  }

  showIncidentDetail(incidentId) {
    const incident = this.medicalIncidents.find(i => i.id === incidentId);
    if (!incident) return;

    const modal = document.getElementById('incident-modal');
    const detailContainer = document.getElementById('detail-container');

    detailContainer.innerHTML = `
      <div class="incident-detail">
        <h2>Medical Incident Details</h2>

        <div class="detail-section">
          <h3>Patient Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Name</label>
              <p>${incident.patient_name || 'Not recorded'}</p>
            </div>
            <div class="info-item">
              <label>Age</label>
              <p>${incident.patient_age || 'Not recorded'} years</p>
            </div>
            <div class="info-item">
              <label>Triage Level</label>
              <p><span class="triage-badge triage-${incident.triage_level || 'medium'}">${(incident.triage_level || 'medium').toUpperCase()}</span></p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Medical Details</h3>
          <div class="info-grid">
            <div class="info-item full-width">
              <label>Symptoms</label>
              <p>${incident.symptoms || 'Not recorded'}</p>
            </div>
            ${incident.vital_signs ? `
              <div class="info-item full-width">
                <label>Vital Signs</label>
                <pre>${JSON.stringify(incident.vital_signs, null, 2)}</pre>
              </div>
            ` : ''}
            ${incident.treatment_notes ? `
              <div class="info-item full-width">
                <label>Treatment Notes</label>
                <p>${incident.treatment_notes}</p>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="detail-section">
          <h3>Response Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Status</label>
              <p class="status-${incident.incidents.status}">${incident.incidents.status.toUpperCase()}</p>
            </div>
            <div class="info-item">
              <label>Reported</label>
              <p>${new Date(incident.created_at).toLocaleString()}</p>
            </div>
            ${incident.response_time ? `
              <div class="info-item">
                <label>Response Time</label>
                <p>${incident.response_time}</p>
              </div>
            ` : ''}
            ${incident.resolved_at ? `
              <div class="info-item">
                <label>Resolved</label>
                <p>${new Date(incident.resolved_at).toLocaleString()}</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn-medical');
    if (backBtn && this.onBack) {
      backBtn.addEventListener('click', () => {
        this.onBack();
      });
    }

    // New incident button
    document.getElementById('new-incident-btn').addEventListener('click', () => {
      document.getElementById('new-incident-modal').style.display = 'flex';
    });

    // Close modals
    document.getElementById('close-modal').addEventListener('click', () => {
      document.getElementById('incident-modal').style.display = 'none';
    });

    document.getElementById('close-new-modal').addEventListener('click', () => {
      document.getElementById('new-incident-modal').style.display = 'none';
    });

    document.getElementById('cancel-incident').addEventListener('click', () => {
      document.getElementById('new-incident-modal').style.display = 'none';
    });

    // View incident details
    document.querySelectorAll('.view-incident').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.showIncidentDetail(e.target.dataset.incidentId);
      });
    });

    // Mark as resolved
    document.querySelectorAll('.mark-resolved').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.markIncidentResolved(e.target.dataset.incidentId);
      });
    });

    // New incident form submission
    document.getElementById('new-incident-form').addEventListener('submit', (e) => {
      this.handleNewIncident(e);
    });

    // Close modal on background click
    document.getElementById('incident-modal').addEventListener('click', (e) => {
      if (e.target.id === 'incident-modal') {
        document.getElementById('incident-modal').style.display = 'none';
      }
    });

    document.getElementById('new-incident-modal').addEventListener('click', (e) => {
      if (e.target.id === 'new-incident-modal') {
        document.getElementById('new-incident-modal').style.display = 'none';
      }
    });
  }

  async handleNewIncident(e) {
    e.preventDefault();

    const patientName = document.getElementById('patient-name').value;
    const patientAge = parseInt(document.getElementById('patient-age').value);
    const triageLevel = document.getElementById('triage-level').value;
    const symptoms = document.getElementById('symptoms').value;
    const location = document.getElementById('incident-location').value;
    const assignedStaffId = document.getElementById('assigned-staff').value;

    try {
      // Check if we have the medical category ID
      if (!this.medicalCategoryId) {
        throw new Error('Medical incident category not found. Please contact administrator.');
      }

      // First create the incident
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert([
          {
            event_id: this.currentEvent,
            incident_category_id: this.medicalCategoryId,
            title: `Medical: ${patientName}`,
            description: symptoms,
            severity: triageLevel,
            status: 'open'
          }
        ])
        .select()
        .single();

      if (incidentError) throw incidentError;

      // Then create the medical incident
      const { error: medicalError } = await supabase
        .from('medical_incidents')
        .insert([
          {
            incident_id: incident.id,
            patient_name: patientName,
            patient_age: patientAge,
            triage_level: triageLevel,
            symptoms: symptoms,
            assigned_to_user_id: assignedStaffId || null,
            medical_type: 'reported'
          }
        ]);

      if (medicalError) throw medicalError;

      // Reset form and close modal
      document.getElementById('new-incident-form').reset();
      document.getElementById('new-incident-modal').style.display = 'none';

      // Reload incidents
      await this.loadMedicalIncidents();

      // Show success message
      alert('Medical incident reported successfully');
    } catch (error) {
      console.error('Error creating incident:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async markIncidentResolved(incidentId) {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: 'resolved' })
        .eq('id', incidentId);

      if (error) throw error;

      await this.loadMedicalIncidents();
      alert('Incident marked as resolved');
    } catch (error) {
      console.error('Error updating incident:', error);
      alert(`Error: ${error.message}`);
    }
  }

  subscribeToIncidents() {
    // Subscribe to real-time changes
    this.unsubscribe = supabase
      .channel(`medical-incidents-${this.currentEvent}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_incidents'
        },
        (payload) => {
          console.log('Medical incident update:', payload);
          this.loadMedicalIncidents();
        }
      )
      .subscribe();
  }

  destroy() {
    if (this.unsubscribe && typeof this.unsubscribe.unsubscribe === 'function') {
      this.unsubscribe.unsubscribe();
    }
  }
}

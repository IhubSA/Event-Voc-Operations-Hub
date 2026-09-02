// Medical Operations Module - Dashboard Page
import { supabase, supabaseApi } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';

export class MedicalPage {
  constructor() {
    this.currentEvent = null;
    this.medicalIncidents = [];
    this.medicalResources = [];
    this.medicalProviders = [];
    this.selectedIncident = null;
    this.unsubscribe = null;
    this.medicalCategoryId = null;
    this.onOpenVendors = null;
    this.editingResourceId = null;
  }

  async render(eventId, onBack, currentUser, onOpenClubSettings, onOpenVendors) {
    this.currentEvent = eventId;
    this.onBack = onBack;
    this.onOpenVendors = onOpenVendors || null;
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
              <div class="resources-section-header">
                <h3>Medical Resources</h3>
                <button type="button" class="btn btn-sm btn-primary" id="add-resource-btn">+ Add Resource</button>
              </div>
              <div class="resources-list" id="resources-container">
                <div class="loading">Loading resources...</div>
              </div>
            </div>
            <div class="resources-section providers-section">
              <h3>Medical Service Providers</h3>
              <div class="resources-list" id="providers-container">
                <div class="loading">Loading providers...</div>
              </div>
              ${this.onOpenVendors ? '<button type="button" class="btn btn-sm btn-secondary provider-manage-btn" id="manage-medical-vendors-btn">Manage in Vendors →</button>' : ''}
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

        <div class="new-incident-modal" id="resource-modal" style="display: none !important;">
          <div class="modal-content">
            <button class="modal-close" id="close-resource-modal">&times;</button>
            <h2 id="resource-modal-title">Add Medical Resource</h2>
            <form id="resource-form">
              <div class="form-group">
                <label>Resource Type</label>
                <select id="resource-type" required>
                  <option value="">Select a type</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="First Aid Vehicle">First Aid Vehicle</option>
                  <option value="First Aid Post">First Aid Post / Station</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Paramedic">Paramedic</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Medical Equipment">Medical Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Quantity</label>
                  <input type="number" id="resource-quantity" min="1" value="1" required />
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select id="resource-status" required>
                    <option value="available">Available</option>
                    <option value="in-use">In Use</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Location</label>
                <input type="text" id="resource-location" placeholder="e.g. Main Gate, Zone 3" />
              </div>
              <div class="form-group">
                <label>Description / Notes</label>
                <textarea id="resource-description" rows="2" placeholder="Any extra detail about this resource"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Contact Person</label>
                  <input type="text" id="resource-contact-person" />
                </div>
                <div class="form-group">
                  <label>Contact Phone</label>
                  <input type="tel" id="resource-contact-phone" />
                </div>
              </div>
              <div id="resource-form-message" class="add-message"></div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-resource">Cancel</button>
                <button type="submit" class="btn btn-primary" id="save-resource-btn">Add Resource</button>
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
    await this.loadMedicalProviders();

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
      // Load every resource regardless of status -- staff need to see and
      // manage in-use/unavailable ones too, not just what's free right now.
      const { data, error } = await supabase
        .from('medical_resources')
        .select('*')
        .eq('event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.medicalResources = data || [];
      this.renderResources();
    } catch (error) {
      console.error('Error loading medical resources:', error);
    }
  }

  // Medical vendors (ambulance services, doctors, first-aid providers etc.)
  // registered through the Vendors module for this event -- approved ones
  // are the actual service providers on site, so they belong here too.
  async loadMedicalProviders() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('event_id', this.currentEvent)
        .eq('category', 'medical')
        .order('business_name', { ascending: true });

      if (error) throw error;

      this.medicalProviders = data || [];
      this.renderProviders();
    } catch (error) {
      console.error('Error loading medical service providers:', error);
      const container = document.getElementById('providers-container');
      if (container) container.innerHTML = `<div class="empty-state">Failed to load service providers.</div>`;
    }
  }

  renderProviders() {
    const container = document.getElementById('providers-container');
    if (!container) return;

    if (this.medicalProviders.length === 0) {
      container.innerHTML = `<div class="empty-state">No medical service providers registered yet. Add one from the Vendors module.</div>`;
      return;
    }

    container.innerHTML = this.medicalProviders.map(vendor => `
      <div class="resource-card">
        <div class="resource-type">${escapeHtmlMedical(vendor.business_name)}</div>
        <div class="resource-info">
          ${vendor.contact_name ? `
            <div class="info-row">
              <span class="label">Contact:</span>
              <span>${escapeHtmlMedical(vendor.contact_name)}</span>
            </div>
          ` : ''}
          ${vendor.contact_phone ? `
            <div class="info-row">
              <span class="label">Phone:</span>
              <span>${escapeHtmlMedical(vendor.contact_phone)}</span>
            </div>
          ` : ''}
          ${vendor.contact_email ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span>${escapeHtmlMedical(vendor.contact_email)}</span>
            </div>
          ` : ''}
          <div class="resource-status">
            <span class="status-badge status-${vendor.status}">${vendor.status}</span>
          </div>
        </div>
      </div>
    `).join('');
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
      container.innerHTML = `<div class="empty-state">No resources logged yet. Click "+ Add Resource" to add ambulances, personnel, equipment etc.</div>`;
      return;
    }

    container.innerHTML = this.medicalResources.map(resource => `
      <div class="resource-card">
        <div class="resource-card-header">
          <div class="resource-type">${escapeHtmlMedical(resource.resource_type)}<span class="resource-quantity">×${resource.quantity || 1}</span></div>
          <div class="resource-card-actions">
            <button class="btn btn-secondary" data-edit-resource="${resource.id}">Edit</button>
            <button class="btn btn-danger" data-delete-resource="${resource.id}">Delete</button>
          </div>
        </div>
        <div class="resource-info">
          ${resource.description ? `
            <div class="info-row">
              <span>${escapeHtmlMedical(resource.description)}</span>
            </div>
          ` : ''}
          <div class="info-row">
            <span class="label">Location:</span>
            <span>${escapeHtmlMedical(resource.location || 'Unknown')}</span>
          </div>
          ${resource.contact_person ? `
            <div class="info-row">
              <span class="label">Contact:</span>
              <span>${escapeHtmlMedical(resource.contact_person)}${resource.contact_phone ? ` (${escapeHtmlMedical(resource.contact_phone)})` : ''}</span>
            </div>
          ` : ''}
          <div class="resource-status">
            <span class="status-badge status-${resource.status}">${resource.status}</span>
          </div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('[data-edit-resource]').forEach(btn => {
      btn.addEventListener('click', () => this.openResourceModal(btn.dataset.editResource));
    });
    document.querySelectorAll('[data-delete-resource]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteResource(btn.dataset.deleteResource));
    });

    // "Resources Available" = total quantity of resources currently marked available
    const availableQty = this.medicalResources
      .filter(r => r.status === 'available')
      .reduce((sum, r) => sum + (r.quantity || 1), 0);
    document.getElementById('resources-count').textContent = availableQty;
  }

  openResourceModal(resourceId) {
    this.editingResourceId = resourceId;
    const modal = document.getElementById('resource-modal');
    const title = document.getElementById('resource-modal-title');
    const saveBtn = document.getElementById('save-resource-btn');
    const messageDiv = document.getElementById('resource-form-message');
    const form = document.getElementById('resource-form');

    form.reset();
    messageDiv.textContent = '';
    messageDiv.className = 'add-message';

    if (resourceId) {
      const resource = this.medicalResources.find(r => r.id === resourceId);
      if (!resource) return;

      title.textContent = 'Edit Medical Resource';
      saveBtn.textContent = 'Save Changes';
      document.getElementById('resource-type').value = resource.resource_type || '';
      document.getElementById('resource-quantity').value = resource.quantity || 1;
      document.getElementById('resource-status').value = resource.status || 'available';
      document.getElementById('resource-location').value = resource.location || '';
      document.getElementById('resource-description').value = resource.description || '';
      document.getElementById('resource-contact-person').value = resource.contact_person || '';
      document.getElementById('resource-contact-phone').value = resource.contact_phone || '';
    } else {
      title.textContent = 'Add Medical Resource';
      saveBtn.textContent = 'Add Resource';
      document.getElementById('resource-quantity').value = 1;
      document.getElementById('resource-status').value = 'available';
    }

    modal.style.display = 'flex';
  }

  async handleResourceSubmit() {
    const messageDiv = document.getElementById('resource-form-message');
    const saveBtn = document.getElementById('save-resource-btn');

    messageDiv.textContent = '';
    messageDiv.className = 'add-message';

    const resourceType = document.getElementById('resource-type').value;
    const quantity = parseInt(document.getElementById('resource-quantity').value, 10);

    if (!resourceType || !quantity || quantity < 1) {
      messageDiv.className = 'add-message error';
      messageDiv.textContent = 'Please select a resource type and a valid quantity.';
      return;
    }

    const data = {
      event_id: this.currentEvent,
      resource_type: resourceType,
      quantity,
      status: document.getElementById('resource-status').value,
      location: document.getElementById('resource-location').value.trim() || null,
      description: document.getElementById('resource-description').value.trim() || null,
      contact_person: document.getElementById('resource-contact-person').value.trim() || null,
      contact_phone: document.getElementById('resource-contact-phone').value.trim() || null
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (this.editingResourceId) {
        const { error } = await supabase
          .from('medical_resources')
          .update(data)
          .eq('id', this.editingResourceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_resources')
          .insert([data]);
        if (error) throw error;
      }

      document.getElementById('resource-modal').style.display = 'none';
      await this.loadMedicalResources();
    } catch (error) {
      console.error('Error saving medical resource:', error);
      messageDiv.className = 'add-message error';
      messageDiv.textContent = error.message || 'Failed to save resource. Please try again.';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = this.editingResourceId ? 'Save Changes' : 'Add Resource';
    }
  }

  async deleteResource(resourceId) {
    if (!confirm('Delete this medical resource?')) return;

    try {
      const { error } = await supabase
        .from('medical_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      await this.loadMedicalResources();
    } catch (error) {
      console.error('Error deleting medical resource:', error);
      alert('Failed to delete resource.');
    }
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

    // Manage medical service providers in the Vendors module
    const manageVendorsBtn = document.getElementById('manage-medical-vendors-btn');
    if (manageVendorsBtn && this.onOpenVendors) {
      manageVendorsBtn.addEventListener('click', () => {
        this.onOpenVendors('medical');
      });
    }

    // Add/Edit Resource modal
    document.getElementById('add-resource-btn').addEventListener('click', () => {
      this.openResourceModal(null);
    });

    document.getElementById('close-resource-modal').addEventListener('click', () => {
      document.getElementById('resource-modal').style.display = 'none';
    });

    document.getElementById('cancel-resource').addEventListener('click', () => {
      document.getElementById('resource-modal').style.display = 'none';
    });

    document.getElementById('resource-modal').addEventListener('click', (e) => {
      if (e.target.id === 'resource-modal') {
        document.getElementById('resource-modal').style.display = 'none';
      }
    });

    document.getElementById('resource-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleResourceSubmit();
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

function escapeHtmlMedical(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

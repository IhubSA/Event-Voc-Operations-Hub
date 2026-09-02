// Security Module - Dashboard Page
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';

export class SecurityPage {
  constructor() {
    this.currentEvent = null;
    this.securityIncidents = [];
    this.securityCheckpoints = [];
    this.securityResources = [];
    this.securityProviders = [];
    this.selectedIncident = null;
    this.unsubscribe = null;
    this.securityCategoryId = null;
    this.overallThreatLevel = 'green';
    this.onOpenVendors = null;
    this.editingResourceId = null;
  }

  async render(eventId, onBack, currentUser, onOpenClubSettings, onOpenVendors) {
    this.currentEvent = eventId;
    this.onBack = onBack;
    this.onOpenVendors = onOpenVendors || null;
    const container = document.getElementById('app');

    // Fetch the Security incident category ID
    await this.fetchSecurityCategoryId();

    const navbar = new Navbar(currentUser, () => {}, null, onOpenClubSettings);
    const navbarHtml = navbar.render();

    const bodyHtml = `
      <div class="security-dashboard">
        <div class="security-header">
          <div class="security-header-top">
            <h1>Security Operations</h1>
            <button class="btn btn-secondary btn-small" id="back-btn-security">← Back to Dashboard</button>
          </div>
          <div class="threat-level-indicator" id="threat-indicator">
            <div class="threat-badge threat-green">🟢 GREEN</div>
            <span>Overall Threat Level</span>
          </div>
          <div class="security-header-stats">
            <div class="stat-card critical">
              <div class="stat-value" id="critical-count">0</div>
              <div class="stat-label">Critical Threats</div>
            </div>
            <div class="stat-card high">
              <div class="stat-value" id="high-count">0</div>
              <div class="stat-label">High Risk</div>
            </div>
            <div class="stat-card medium">
              <div class="stat-value" id="medium-count">0</div>
              <div class="stat-label">Medium Risk</div>
            </div>
            <div class="stat-card low">
              <div class="stat-value" id="low-count">0</div>
              <div class="stat-label">Low Risk</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="checkpoints-count">0</div>
              <div class="stat-label">Checkpoints Active</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="security-resources-count">0</div>
              <div class="stat-label">Resources Available</div>
            </div>
          </div>
        </div>

        <div class="security-content">
          <div class="security-main">
            <div class="incidents-section">
              <div class="section-header">
                <h2>Security Incidents</h2>
                <button class="btn btn-primary" id="new-incident-btn">+ New Incident</button>
              </div>
              <div class="security-incidents-list" id="incidents-container">
                <div class="loading">Loading incidents...</div>
              </div>
            </div>
          </div>

          <div class="security-sidebar">
            <div class="checkpoints-section">
              <h3>Security Checkpoints</h3>
              <div class="checkpoints-list" id="checkpoints-container">
                <div class="loading">Loading checkpoints...</div>
              </div>
            </div>
            <div class="checkpoints-section">
              <div class="resources-section-header">
                <h3>Security Resources</h3>
                <button type="button" class="btn btn-sm btn-primary" id="add-resource-btn">+ Add Resource</button>
              </div>
              <div class="checkpoints-list" id="security-resources-container">
                <div class="loading">Loading resources...</div>
              </div>
            </div>
            <div class="checkpoints-section providers-section">
              <h3>Contracted Security Providers</h3>
              <div class="checkpoints-list" id="security-providers-container">
                <div class="loading">Loading providers...</div>
              </div>
              ${this.onOpenVendors ? '<button type="button" class="btn btn-sm btn-secondary provider-manage-btn" id="manage-security-vendors-btn">Manage in Vendors →</button>' : ''}
            </div>
            <div class="investigation-metrics">
              <h3>Investigation Status</h3>
              <div class="metrics-container">
                <div class="metric">
                  <span class="metric-label">Open Investigations</span>
                  <span class="metric-value" id="open-investigations">0</span>
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
            <h2>Report Security Incident</h2>
            <form id="new-incident-form">
              <div class="form-group">
                <label>Incident Type</label>
                <select id="incident-type" required>
                  <option value="unauthorized_entry">Unauthorized Entry</option>
                  <option value="theft">Theft</option>
                  <option value="assault">Assault</option>
                  <option value="trespassing">Trespassing</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="access_violation">Access Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Threat Level</label>
                <select id="threat-level" required>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="description" required rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Suspect Description</label>
                <textarea id="suspect-description" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Location (Checkpoint/Zone)</label>
                <input type="text" id="incident-location" required />
              </div>
              <div class="form-group">
                <label>Assign to Security Officer</label>
                <select id="assigned-officer">
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
            <h2 id="resource-modal-title">Add Security Resource</h2>
            <form id="resource-form">
              <div class="form-group">
                <label>Resource Type</label>
                <select id="resource-type" required>
                  <option value="">Select a type</option>
                  <option value="Security Vehicle">Security Vehicle</option>
                  <option value="Security Personnel">Security Personnel (Guards)</option>
                  <option value="K9 Unit">K9 Unit</option>
                  <option value="CCTV/Surveillance">CCTV / Surveillance Equipment</option>
                  <option value="Communication Equipment">Communication Equipment</option>
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
    await this.loadSecurityIncidents();
    await this.loadSecurityCheckpoints();
    await this.loadSecurityResources();
    await this.loadSecurityProviders();

    // Setup event listeners
    this.setupEventListeners();

    // Subscribe to real-time updates
    this.subscribeToIncidents();
  }

  async fetchSecurityCategoryId() {
    try {
      const { data, error } = await supabase
        .from('incident_categories')
        .select('id')
        .eq('domain', 'security')
        .limit(1)
        .single();

      if (data) {
        this.securityCategoryId = data.id;
      }
    } catch (error) {
      console.error('Error fetching security category:', error);
    }
  }

  async loadSecurityIncidents() {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .select(`
          id,
          incident_id,
          incident_type,
          suspect_description,
          evidence,
          investigation_notes,
          assigned_security_officer_id,
          resolution_method,
          created_at,
          updated_at,
          incidents!inner(id, title, description, threat_level, security_classification, investigation_status, status, created_at, venue_id, zone_id)
        `)
        .eq('incidents.event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.securityIncidents = data || [];
      this.calculateThreatLevel();
      this.renderIncidents();
      this.updateStats();
    } catch (error) {
      console.error('Error loading security incidents:', error);
      document.getElementById('incidents-container').innerHTML =
        `<div class="error">Failed to load incidents: ${error.message}</div>`;
    }
  }

  async loadSecurityCheckpoints() {
    try {
      const { data, error } = await supabase
        .from('security_checkpoints')
        .select('*')
        .eq('event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.securityCheckpoints = data || [];
      this.renderCheckpoints();
    } catch (error) {
      console.error('Error loading security checkpoints:', error);
    }
  }

  // Security vendors (guarding/patrol companies etc.) registered through
  // the Vendors module for this event -- approved ones are the actual
  // contracted providers on site, so they belong here too.
  async loadSecurityProviders() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('event_id', this.currentEvent)
        .eq('category', 'security')
        .order('business_name', { ascending: true });

      if (error) throw error;

      this.securityProviders = data || [];
      this.renderSecurityProviders();
    } catch (error) {
      console.error('Error loading security service providers:', error);
      const container = document.getElementById('security-providers-container');
      if (container) container.innerHTML = `<div class="empty-state">Failed to load service providers.</div>`;
    }
  }

  renderSecurityProviders() {
    const container = document.getElementById('security-providers-container');
    if (!container) return;

    if (this.securityProviders.length === 0) {
      container.innerHTML = `<div class="empty-state">No security providers registered yet. Add one from the Vendors module.</div>`;
      return;
    }

    container.innerHTML = this.securityProviders.map(vendor => `
      <div class="checkpoint-item">
        <div class="checkpoint-status">${escapeHtmlSecurity(vendor.business_name)}</div>
        <div class="checkpoint-info">
          ${vendor.contact_name ? `
            <div class="info-row">
              <span class="label">Contact:</span>
              <span>${escapeHtmlSecurity(vendor.contact_name)}</span>
            </div>
          ` : ''}
          ${vendor.contact_phone ? `
            <div class="info-row">
              <span class="label">Phone:</span>
              <span>${escapeHtmlSecurity(vendor.contact_phone)}</span>
            </div>
          ` : ''}
          ${vendor.contact_email ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span>${escapeHtmlSecurity(vendor.contact_email)}</span>
            </div>
          ` : ''}
          <div class="checkpoint-status-badge">
            <span class="status-badge status-${vendor.status}">${vendor.status}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  calculateThreatLevel() {
    let maxThreat = 'green';
    const threatLevels = { green: 0, yellow: 1, orange: 2, red: 3 };

    this.securityIncidents.forEach(incident => {
      const level = incident.incidents.threat_level || 'green';
      if (threatLevels[level] > threatLevels[maxThreat]) {
        maxThreat = level;
      }
    });

    this.overallThreatLevel = maxThreat;
  }

  renderIncidents() {
    const container = document.getElementById('incidents-container');

    if (this.securityIncidents.length === 0) {
      container.innerHTML = `<div class="empty-state">No security incidents reported</div>`;
      return;
    }

    container.innerHTML = this.securityIncidents.map(incident => `
      <div class="security-incident-card threat-${incident.incidents.threat_level || 'green'}" data-incident-id="${incident.id}">
        <div class="card-header">
          <div class="threat-badge threat-${incident.incidents.threat_level || 'green'}">
            ${this.getThreatEmoji(incident.incidents.threat_level || 'green')} ${(incident.incidents.threat_level || 'green').toUpperCase()}
          </div>
          <div class="incident-status ${incident.incidents.status}">
            ${incident.incidents.status.toUpperCase()}
          </div>
        </div>

        <div class="card-body">
          <h3>${incident.incident_type.replace(/_/g, ' ').toUpperCase()}</h3>
          <div class="incident-details">
            <div class="detail-row">
              <span class="label">Description:</span>
              <span class="value">${incident.incidents.description || 'Not recorded'}</span>
            </div>
            ${incident.suspect_description ? `
              <div class="detail-row">
                <span class="label">Suspect:</span>
                <span class="value">${incident.suspect_description}</span>
              </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Investigation:</span>
              <span class="value">${incident.incidents.investigation_status || 'pending'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Reported:</span>
              <span class="value">${new Date(incident.created_at).toLocaleTimeString()}</span>
            </div>
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

  renderCheckpoints() {
    const container = document.getElementById('checkpoints-container');

    if (this.securityCheckpoints.length === 0) {
      container.innerHTML = `<div class="empty-state">No checkpoints configured</div>`;
      return;
    }

    container.innerHTML = this.securityCheckpoints.map(checkpoint => `
      <div class="checkpoint-card">
        <div class="checkpoint-location">${checkpoint.location}</div>
        <div class="checkpoint-info">
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="status-badge status-${checkpoint.status}">${checkpoint.status}</span>
          </div>
          <div class="info-row">
            <span class="label">Personnel:</span>
            <span>${checkpoint.personnel_count} staff</span>
          </div>
          <div class="info-row">
            <span class="label">Screened:</span>
            <span>${checkpoint.people_screened} people</span>
          </div>
          <div class="info-row">
            <span class="label">Incidents:</span>
            <span>${checkpoint.incidents_count}</span>
          </div>
        </div>
      </div>
    `).join('');

    document.getElementById('checkpoints-count').textContent = this.securityCheckpoints.length;
  }

  // Security resources (vehicles, guard headcounts, K9 units, equipment
  // etc.) -- separate from checkpoints, which track a physical post rather
  // than the pool of people/vehicles/gear available to staff them.
  async loadSecurityResources() {
    try {
      const { data, error } = await supabase
        .from('security_resources')
        .select('*')
        .eq('event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.securityResources = data || [];
      this.renderSecurityResources();
    } catch (error) {
      console.error('Error loading security resources:', error);
      const container = document.getElementById('security-resources-container');
      if (container) container.innerHTML = `<div class="empty-state">Failed to load resources.</div>`;
    }
  }

  renderSecurityResources() {
    const container = document.getElementById('security-resources-container');
    if (!container) return;

    if (this.securityResources.length === 0) {
      container.innerHTML = `<div class="empty-state">No resources logged yet. Click "+ Add Resource" to add vehicles, personnel, equipment etc.</div>`;
    } else {
      container.innerHTML = this.securityResources.map(resource => `
        <div class="checkpoint-item">
          <div class="resource-card-header">
            <div class="checkpoint-status">${escapeHtmlSecurity(resource.resource_type)}<span class="resource-quantity">×${resource.quantity || 1}</span></div>
            <div class="resource-card-actions">
              <button class="btn btn-secondary" data-edit-resource="${resource.id}">Edit</button>
              <button class="btn btn-danger" data-delete-resource="${resource.id}">Delete</button>
            </div>
          </div>
          <div class="checkpoint-info">
            ${resource.description ? `
              <div class="info-row">
                <span>${escapeHtmlSecurity(resource.description)}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Location:</span>
              <span>${escapeHtmlSecurity(resource.location || 'Unknown')}</span>
            </div>
            ${resource.contact_person ? `
              <div class="info-row">
                <span class="label">Contact:</span>
                <span>${escapeHtmlSecurity(resource.contact_person)}${resource.contact_phone ? ` (${escapeHtmlSecurity(resource.contact_phone)})` : ''}</span>
              </div>
            ` : ''}
            <div class="checkpoint-status-badge">
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
    }

    const availableQty = this.securityResources
      .filter(r => r.status === 'available')
      .reduce((sum, r) => sum + (r.quantity || 1), 0);
    document.getElementById('security-resources-count').textContent = availableQty;
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
      const resource = this.securityResources.find(r => r.id === resourceId);
      if (!resource) return;

      title.textContent = 'Edit Security Resource';
      saveBtn.textContent = 'Save Changes';
      document.getElementById('resource-type').value = resource.resource_type || '';
      document.getElementById('resource-quantity').value = resource.quantity || 1;
      document.getElementById('resource-status').value = resource.status || 'available';
      document.getElementById('resource-location').value = resource.location || '';
      document.getElementById('resource-description').value = resource.description || '';
      document.getElementById('resource-contact-person').value = resource.contact_person || '';
      document.getElementById('resource-contact-phone').value = resource.contact_phone || '';
    } else {
      title.textContent = 'Add Security Resource';
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
          .from('security_resources')
          .update(data)
          .eq('id', this.editingResourceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('security_resources')
          .insert([data]);
        if (error) throw error;
      }

      document.getElementById('resource-modal').style.display = 'none';
      await this.loadSecurityResources();
    } catch (error) {
      console.error('Error saving security resource:', error);
      messageDiv.className = 'add-message error';
      messageDiv.textContent = error.message || 'Failed to save resource. Please try again.';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = this.editingResourceId ? 'Save Changes' : 'Add Resource';
    }
  }

  async deleteResource(resourceId) {
    if (!confirm('Delete this security resource?')) return;

    try {
      const { error } = await supabase
        .from('security_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      await this.loadSecurityResources();
    } catch (error) {
      console.error('Error deleting security resource:', error);
      alert('Failed to delete resource.');
    }
  }

  getThreatEmoji(level) {
    const emojis = {
      'green': '🟢',
      'yellow': '🟡',
      'orange': '🟠',
      'red': '🔴'
    };
    return emojis[level] || '🟢';
  }

  updateStats() {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    this.securityIncidents.forEach(incident => {
      const threat = incident.incidents.threat_level || 'green';
      if (threat === 'red') stats.critical++;
      else if (threat === 'orange') stats.high++;
      else if (threat === 'yellow') stats.medium++;
      else stats.low++;
    });

    document.getElementById('critical-count').textContent = stats.critical;
    document.getElementById('high-count').textContent = stats.high;
    document.getElementById('medium-count').textContent = stats.medium;
    document.getElementById('low-count').textContent = stats.low;

    // Update threat indicator
    const threatIndicator = document.getElementById('threat-indicator');
    threatIndicator.innerHTML = `
      <div class="threat-badge threat-${this.overallThreatLevel}">${this.getThreatEmoji(this.overallThreatLevel)} ${this.overallThreatLevel.toUpperCase()}</div>
      <span>Overall Threat Level</span>
    `;

    // Calculate open investigations
    const openInvestigations = this.securityIncidents.filter(i => i.incidents.investigation_status === 'open').length;
    document.getElementById('open-investigations').textContent = openInvestigations;

    // Calculate resolved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = this.securityIncidents.filter(i => {
      if (i.incidents.status !== 'resolved') return false;
      const resolved = new Date(i.updated_at);
      resolved.setHours(0, 0, 0, 0);
      return resolved.getTime() === today.getTime();
    }).length;

    document.getElementById('resolved-today').textContent = resolvedToday;
  }

  showIncidentDetail(incidentId) {
    const incident = this.securityIncidents.find(i => i.id === incidentId);
    if (!incident) return;

    const modal = document.getElementById('incident-modal');
    const detailContainer = document.getElementById('detail-container');

    detailContainer.innerHTML = `
      <div class="incident-detail">
        <h2>Security Incident Details</h2>

        <div class="detail-section">
          <h3>Incident Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Type</label>
              <p>${incident.incident_type.replace(/_/g, ' ').toUpperCase()}</p>
            </div>
            <div class="info-item">
              <label>Threat Level</label>
              <p><span class="threat-badge threat-${incident.incidents.threat_level || 'green'}">${this.getThreatEmoji(incident.incidents.threat_level || 'green')} ${(incident.incidents.threat_level || 'green').toUpperCase()}</span></p>
            </div>
            <div class="info-item">
              <label>Classification</label>
              <p>${incident.incidents.security_classification || 'Not classified'}</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Description</h3>
          <p>${incident.incidents.description || 'Not recorded'}</p>
        </div>

        ${incident.suspect_description ? `
          <div class="detail-section">
            <h3>Suspect Description</h3>
            <p>${incident.suspect_description}</p>
          </div>
        ` : ''}

        <div class="detail-section">
          <h3>Investigation</h3>
          <div class="info-grid">
            <div class="info-item full-width">
              <label>Status</label>
              <p class="status-${incident.incidents.investigation_status}">${(incident.incidents.investigation_status || 'pending').toUpperCase()}</p>
            </div>
            ${incident.evidence ? `
              <div class="info-item full-width">
                <label>Evidence</label>
                <p>${incident.evidence}</p>
              </div>
            ` : ''}
            ${incident.investigation_notes ? `
              <div class="info-item full-width">
                <label>Investigation Notes</label>
                <p>${incident.investigation_notes}</p>
              </div>
            ` : ''}
            ${incident.resolution_method ? `
              <div class="info-item full-width">
                <label>Resolution Method</label>
                <p>${incident.resolution_method}</p>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="detail-section">
          <h3>Timeline</h3>
          <div class="timeline">
            <div class="timeline-item">
              <span class="timeline-label">Reported</span>
              <span class="timeline-time">${new Date(incident.created_at).toLocaleString()}</span>
            </div>
            ${incident.updated_at !== incident.created_at ? `
              <div class="timeline-item">
                <span class="timeline-label">Last Updated</span>
                <span class="timeline-time">${new Date(incident.updated_at).toLocaleString()}</span>
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
    const backBtn = document.getElementById('back-btn-security');
    if (backBtn && this.onBack) {
      backBtn.addEventListener('click', () => {
        this.onBack();
      });
    }

    document.getElementById('new-incident-btn').addEventListener('click', () => {
      document.getElementById('new-incident-modal').style.display = 'flex';
    });

    // Manage security providers in the Vendors module
    const manageVendorsBtn = document.getElementById('manage-security-vendors-btn');
    if (manageVendorsBtn && this.onOpenVendors) {
      manageVendorsBtn.addEventListener('click', () => {
        this.onOpenVendors('security');
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

    document.getElementById('close-modal').addEventListener('click', () => {
      document.getElementById('incident-modal').style.display = 'none';
    });

    document.getElementById('close-new-modal').addEventListener('click', () => {
      document.getElementById('new-incident-modal').style.display = 'none';
    });

    document.getElementById('cancel-incident').addEventListener('click', () => {
      document.getElementById('new-incident-modal').style.display = 'none';
    });

    document.querySelectorAll('.view-incident').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.showIncidentDetail(e.target.dataset.incidentId);
      });
    });

    document.querySelectorAll('.mark-resolved').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.markIncidentResolved(e.target.dataset.incidentId);
      });
    });

    document.getElementById('new-incident-form').addEventListener('submit', (e) => {
      this.handleNewIncident(e);
    });

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

    const incidentType = document.getElementById('incident-type').value;
    const threatLevel = document.getElementById('threat-level').value;
    const description = document.getElementById('description').value;
    const suspectDescription = document.getElementById('suspect-description').value;
    const location = document.getElementById('incident-location').value;
    const assignedOfficerId = document.getElementById('assigned-officer').value;

    try {
      if (!this.securityCategoryId) {
        throw new Error('Security incident category not found. Please contact administrator.');
      }

      // Create the incident
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert([
          {
            event_id: this.currentEvent,
            incident_category_id: this.securityCategoryId,
            title: `Security: ${incidentType.replace(/_/g, ' ')}`,
            description: description,
            severity: threatLevel,
            threat_level: threatLevel,
            status: 'open'
          }
        ])
        .select()
        .single();

      if (incidentError) throw incidentError;

      // Create the security incident
      const { error: securityError } = await supabase
        .from('security_incidents')
        .insert([
          {
            incident_id: incident.id,
            incident_type: incidentType,
            suspect_description: suspectDescription,
            assigned_security_officer_id: assignedOfficerId || null
          }
        ]);

      if (securityError) throw securityError;

      document.getElementById('new-incident-form').reset();
      document.getElementById('new-incident-modal').style.display = 'none';

      await this.loadSecurityIncidents();

      alert('Security incident reported successfully');
    } catch (error) {
      console.error('Error creating incident:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async markIncidentResolved(incidentId) {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: 'resolved', investigation_status: 'closed' })
        .eq('id', incidentId);

      if (error) throw error;

      await this.loadSecurityIncidents();
      alert('Incident marked as resolved');
    } catch (error) {
      console.error('Error updating incident:', error);
      alert(`Error: ${error.message}`);
    }
  }

  subscribeToIncidents() {
    this.unsubscribe = supabase
      .channel(`security-incidents-${this.currentEvent}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_incidents'
        },
        (payload) => {
          console.log('Security incident update:', payload);
          this.loadSecurityIncidents();
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

function escapeHtmlSecurity(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

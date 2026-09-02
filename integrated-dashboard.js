// Integrated Operations Dashboard
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';

export class IntegratedDashboard {
  constructor() {
    this.currentEvent = null;
    this.currentUser = null;
    this.medicalIncidents = [];
    this.securityIncidents = [];
    this.safetyHazards = [];
    this.staffList = [];
    this.participantsList = [];
    this.routes = [];
    this.subscriptions = [];
  }

  async render(currentUser, currentEvent, onModuleSelect, onBack, onOpenClubSettings) {
    this.currentUser = currentUser;
    this.currentEvent = currentEvent;
    this.onModuleSelect = onModuleSelect;
    this.onBack = onBack;

    const container = document.getElementById('app');

    // Render navbar
    const navbar = new Navbar(currentUser, () => {
      // Logout will be handled by app.js
    }, null, onOpenClubSettings);

    const navbarHtml = navbar.render();

    // Create dashboard container
    const isEventEnded = currentEvent.status === 'completed' || currentEvent.status === 'ended';
    const dashboardHtml = `
      <div class="integrated-dashboard ${isEventEnded ? 'event-ended' : ''}">
        ${isEventEnded ? `
          <div class="event-ended-banner">
            <span>🏁 This event has been ended and is now archived</span>
          </div>
        ` : ''}

        <div class="dashboard-header">
          <div class="header-left">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <h1>${currentEvent.name}</h1>
              ${isEventEnded ? `<span class="status-badge-ended">ENDED</span>` : ''}
            </div>
            <div class="header-meta">
              <span>📍 ${currentEvent.location}</span>
              <span>📅 ${new Date(currentEvent.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div class="header-buttons">
            <button class="btn btn-secondary" id="settings-btn" ${isEventEnded ? 'disabled' : ''}>⚙️ Event Settings</button>
            <button class="btn btn-secondary" id="back-btn">← Back to Events</button>
          </div>
        </div>

        <div class="metrics-section">
          <div class="metric-card medical-card">
            <div class="metric-header">
              <h3>🏥 Medical Operations</h3>
              <span class="metric-count" id="medical-total">0</span>
            </div>
            <div class="triage-breakdown">
              <div class="triage-item critical">
                <span class="triage-label">Critical</span>
                <span class="triage-count" id="medical-critical">0</span>
              </div>
              <div class="triage-item high">
                <span class="triage-label">High</span>
                <span class="triage-count" id="medical-high">0</span>
              </div>
              <div class="triage-item medium">
                <span class="triage-label">Medium</span>
                <span class="triage-count" id="medical-medium">0</span>
              </div>
              <div class="triage-item low">
                <span class="triage-label">Low</span>
                <span class="triage-count" id="medical-low">0</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" data-module="medical">Open Module</button>
          </div>

          <div class="metric-card security-card">
            <div class="metric-header">
              <h3>🔒 Security</h3>
              <span class="metric-count" id="security-total">0</span>
            </div>
            <div class="threat-breakdown">
              <div class="threat-item red">
                <span class="threat-label">Red</span>
                <span class="threat-count" id="security-red">0</span>
              </div>
              <div class="threat-item orange">
                <span class="threat-label">Orange</span>
                <span class="threat-count" id="security-orange">0</span>
              </div>
              <div class="threat-item yellow">
                <span class="threat-label">Yellow</span>
                <span class="threat-count" id="security-yellow">0</span>
              </div>
              <div class="threat-item green">
                <span class="threat-label">Green</span>
                <span class="threat-count" id="security-green">0</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" data-module="security">Open Module</button>
          </div>

          <div class="metric-card safety-card">
            <div class="metric-header">
              <h3>⚠️ Safety Compliance</h3>
              <span class="compliance-score" id="compliance-score">100%</span>
            </div>
            <div class="hazard-breakdown">
              <div class="hazard-item critical">
                <span class="hazard-label">Critical</span>
                <span class="hazard-count" id="safety-critical">0</span>
              </div>
              <div class="hazard-item high">
                <span class="hazard-label">High</span>
                <span class="hazard-count" id="safety-high">0</span>
              </div>
              <div class="hazard-item medium">
                <span class="hazard-label">Medium</span>
                <span class="hazard-count" id="safety-medium">0</span>
              </div>
              <div class="hazard-item low">
                <span class="hazard-label">Low</span>
                <span class="hazard-count" id="safety-low">0</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" data-module="safety">Open Module</button>
          </div>

          <div class="metric-card staff-card">
            <div class="metric-header">
              <h3>👥 Staff Management</h3>
              <span class="metric-count" id="staff-total">0</span>
            </div>
            <div class="staff-breakdown">
              <div class="staff-item">
                <span class="staff-label">Directors</span>
                <span class="staff-count" id="staff-directors">0</span>
              </div>
              <div class="staff-item">
                <span class="staff-label">Officers</span>
                <span class="staff-count" id="staff-officers">0</span>
              </div>
              <div class="staff-item">
                <span class="staff-label">Coordinators</span>
                <span class="staff-count" id="staff-coordinators">0</span>
              </div>
              <div class="staff-item">
                <span class="staff-label">Checked In</span>
                <span class="staff-count" id="staff-checkedin">0</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" data-module="staff">Manage Staff</button>
          </div>

          <div class="metric-card participants-card">
            <div class="metric-header">
              <h3>🏃 Participants</h3>
              <span class="metric-count" id="participants-total">0</span>
            </div>
            <div class="participants-breakdown">
              <div class="participant-item">
                <span class="participant-label">Registered</span>
                <span class="participant-count" id="participants-registered">0</span>
              </div>
              <div class="participant-item">
                <span class="participant-label">Checked In</span>
                <span class="participant-count" id="participants-checked-in">0</span>
              </div>
              <div class="participant-item">
                <span class="participant-label">Completed</span>
                <span class="participant-count" id="participants-completed">0</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" data-module="participants">Manage</button>
          </div>

          <div class="metric-card vendors-card">
            <div class="metric-header">
              <h3>🏪 Vendors</h3>
            </div>
            <p class="vendors-card-desc">Food, security, medical &amp; other service providers</p>
            <button class="btn btn-sm btn-primary" data-module="vendors">Manage</button>
          </div>
        </div>

        <div class="routes-section">
          <div class="metric-card routes-card">
            <div class="metric-header">
              <h3>🗺️ Route Mapping</h3>
              <span class="metric-count" id="routes-total">0</span>
            </div>
            <div class="routes-breakdown">
              <div class="route-item">
                <span class="route-label">Staff Routes</span>
                <span class="route-count" id="routes-staff">0</span>
              </div>
              <div class="route-item">
                <span class="route-label">Vehicle Routes</span>
                <span class="route-count" id="routes-vehicle">0</span>
              </div>
              <div class="route-item">
                <span class="route-label">Evacuation Routes</span>
                <span class="route-count" id="routes-evacuation">0</span>
              </div>
              <div class="route-item">
                <span class="route-label">Race Routes</span>
                <span class="route-count" id="routes-race">0</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" data-module="route-map">Open Routes</button>
          </div>

          <div class="metric-card resources-card">
            <div class="metric-header">
              <h3>📍 Route Resources</h3>
              <span class="metric-count" id="resources-total">0</span>
            </div>
            <div class="resources-breakdown">
              <div class="resource-item">
                <span class="resource-emoji">👮</span>
                <span class="resource-label">Marshals</span>
                <span class="resource-count" id="resources-marshals">0</span>
              </div>
              <div class="resource-item">
                <span class="resource-emoji">🚔</span>
                <span class="resource-label">Security</span>
                <span class="resource-count" id="resources-security">0</span>
              </div>
              <div class="resource-item">
                <span class="resource-emoji">💧</span>
                <span class="resource-label">Water</span>
                <span class="resource-count" id="resources-water">0</span>
              </div>
              <div class="resource-item">
                <span class="resource-emoji">🏥</span>
                <span class="resource-label">Medical</span>
                <span class="resource-count" id="resources-medical">0</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" data-module="route-map">Open Routes</button>
          </div>
        </div>

        <div class="alerts-section" id="alerts-section" style="display: none;">
          <h2>⚡ Critical Alerts</h2>
          <div class="alerts-list" id="alerts-list"></div>
        </div>

        <div class="timeline-section">
          <h2>📊 Recent Activity</h2>
          <div class="unified-timeline" id="unified-timeline">
            <div class="timeline-empty">No recent activity</div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = wrapWithShell(navbarHtml, dashboardHtml);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .integrated-dashboard {
        min-height: calc(100vh - 60px);
        background: var(--bg-secondary);
        padding: 2rem;
      }

      .integrated-dashboard.event-ended {
        opacity: 0.85;
      }

      .event-ended-banner {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 82, 82, 0.1));
        border: 2px solid #FF9800;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        text-align: center;
        font-size: 1.1rem;
        font-weight: 600;
        color: #FFB74D;
        box-shadow: 0 4px 16px rgba(255, 152, 0, 0.15);
      }

      .status-badge-ended {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #FF9800, #FFB74D);
        color: white;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
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

      .header-left h1 {
        margin: 0 0 0.5rem 0;
        color: var(--primary);
        font-size: 2rem;
      }

      .header-meta {
        display: flex;
        gap: 1.5rem;
        font-size: 0.95rem;
        color: var(--text-secondary);
      }

      .header-buttons {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .header-buttons .btn {
        white-space: nowrap;
      }

      .header-buttons .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .header-buttons .btn:disabled:hover {
        transform: none;
        box-shadow: var(--shadow-md);
      }

      .metrics-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .routes-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .metric-card {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: var(--shadow-md);
        transition: all 0.3s ease;
      }

      .metric-card:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }

      .participants-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        margin: 1rem 0;
      }

      .participant-item {
        background: rgba(0, 153, 255, 0.05);
        padding: 0.75rem;
        border-radius: 8px;
        border-left: 3px solid var(--primary);
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .participant-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }

      .participant-count {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border-color);
      }

      .vendors-card-desc {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin: 0 0 1.25rem 0;
        line-height: 1.4;
      }

      .metric-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .metric-count {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary);
      }

      .compliance-score {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--success);
      }

      .triage-breakdown,
      .threat-breakdown,
      .hazard-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .triage-item,
      .threat-item,
      .hazard-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
      }

      .triage-item.critical,
      .threat-item.red,
      .hazard-item.critical {
        background: rgba(255, 82, 82, 0.15);
        border: 1px solid rgba(255, 82, 82, 0.3);
      }

      .triage-item.high,
      .threat-item.orange,
      .hazard-item.high {
        background: rgba(255, 152, 0, 0.15);
        border: 1px solid rgba(255, 152, 0, 0.3);
      }

      .triage-item.medium,
      .threat-item.yellow,
      .hazard-item.medium {
        background: rgba(255, 193, 7, 0.15);
        border: 1px solid rgba(255, 193, 7, 0.3);
      }

      .triage-item.low,
      .threat-item.green,
      .hazard-item.low {
        background: rgba(76, 175, 80, 0.15);
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      .triage-label,
      .threat-label,
      .hazard-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .triage-count,
      .threat-count,
      .hazard-count {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .routes-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .route-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 8px;
        background: rgba(0, 153, 255, 0.08);
        border: 1px solid rgba(0, 153, 255, 0.3);
      }

      .route-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .route-count {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
      }

      .resources-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .resource-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 8px;
        background: rgba(156, 39, 176, 0.08);
        border: 1px solid rgba(156, 39, 176, 0.3);
      }

      .resource-emoji {
        font-size: 1.5rem;
        min-width: 24px;
      }

      .resource-label {
        flex: 1;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .resource-count {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--primary);
      }

      .metric-card .btn {
        width: 100%;
        margin-top: 1rem;
      }

      .alerts-section {
        background: var(--bg-primary);
        border: 2px solid rgba(255, 82, 82, 0.3);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: var(--shadow-md);
      }

      .alerts-section h2 {
        margin: 0 0 1rem 0;
        color: var(--critical);
        font-size: 1.25rem;
      }

      .alerts-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .alert-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255, 82, 82, 0.1);
        border-left: 4px solid var(--critical);
        border-radius: 6px;
      }

      .alert-icon {
        font-size: 1.5rem;
        min-width: 24px;
      }

      .alert-content {
        flex: 1;
      }

      .alert-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }

      .alert-detail {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .timeline-section {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: var(--shadow-md);
      }

      .timeline-section h2 {
        margin: 0 0 1.5rem 0;
        color: var(--primary);
        font-size: 1.25rem;
      }

      .unified-timeline {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 400px;
        overflow-y: auto;
      }

      .timeline-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: rgba(0, 153, 255, 0.05);
        border-left: 4px solid var(--primary);
        border-radius: 6px;
        transition: all 0.2s ease;
      }

      .timeline-item:hover {
        background: rgba(0, 153, 255, 0.1);
      }

      .timeline-icon {
        font-size: 1.5rem;
        min-width: 24px;
      }

      .timeline-content {
        flex: 1;
      }

      .timeline-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }

      .timeline-detail {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }

      .timeline-time {
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .timeline-empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
      }

      @media (max-width: 768px) {
        .integrated-dashboard {
          padding: 1rem;
        }

        .dashboard-header {
          flex-direction: column;
          align-items: stretch;
        }

        .metrics-section {
          grid-template-columns: 1fr;
        }

        .header-meta {
          flex-direction: column;
          gap: 0.5rem;
        }
      }
    `;
    document.head.appendChild(style);

    // Load data and setup event listeners
    await this.loadAllData();
    this.setupEventListeners();
  }

  async loadAllData() {
    try {
      // Fetch all data in parallel
      await Promise.all([
        this.loadMedicalIncidents(),
        this.loadSecurityIncidents(),
        this.loadSafetyHazards(),
        this.loadStaff(),
        this.loadParticipants(),
        this.loadRoutes()
      ]);

      this.updateMetrics();
      this.displayAlerts();
      this.displayTimeline();
      this.subscribeToChanges();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  async loadMedicalIncidents() {
    try {
      const { data, error } = await supabase
        .from('medical_incidents')
        .select('*')
        .eq('event_id', this.currentEvent.id);

      if (error) throw error;
      this.medicalIncidents = data || [];
    } catch (error) {
      console.error('Error loading medical incidents:', error);
      this.medicalIncidents = [];
    }
  }

  async loadSecurityIncidents() {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('event_id', this.currentEvent.id);

      if (error) throw error;
      this.securityIncidents = data || [];
    } catch (error) {
      console.error('Error loading security incidents:', error);
      this.securityIncidents = [];
    }
  }

  async loadSafetyHazards() {
    try {
      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .eq('event_id', this.currentEvent.id);

      if (error) throw error;
      this.safetyHazards = data || [];
    } catch (error) {
      console.error('Error loading safety hazards:', error);
      this.safetyHazards = [];
    }
  }

  async loadStaff() {
    try {
      const { data, error } = await supabase
        .from('event_staff')
        .select(`
          *,
          staff_roles (
            id,
            role
          ),
          staff_checkin (
            id,
            check_in_time,
            check_out_time
          )
        `)
        .eq('event_id', this.currentEvent.id);

      if (error) throw error;
      this.staffList = data || [];
    } catch (error) {
      console.error('Error loading staff:', error);
      this.staffList = [];
    }
  }

  async loadParticipants() {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', this.currentEvent.id);

      if (error) throw error;
      this.participantsList = data || [];
    } catch (error) {
      console.error('Error loading participants:', error);
      this.participantsList = [];
    }
  }

  async loadRoutes() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('event_id', this.currentEvent.id);

      if (error) throw error;
      this.routes = data || [];
    } catch (error) {
      console.error('Error loading routes:', error);
      this.routes = [];
    }
  }

  updateMetrics() {
    // Medical metrics
    const medicalTriageMap = {
      'Critical': 0,
      'High': 0,
      'Medium': 0,
      'Low': 0
    };

    this.medicalIncidents.forEach(incident => {
      const level = incident.triage_level || 'Low';
      if (medicalTriageMap.hasOwnProperty(level)) {
        medicalTriageMap[level]++;
      }
    });

    document.getElementById('medical-total').textContent = this.medicalIncidents.length;
    document.getElementById('medical-critical').textContent = medicalTriageMap['Critical'];
    document.getElementById('medical-high').textContent = medicalTriageMap['High'];
    document.getElementById('medical-medium').textContent = medicalTriageMap['Medium'];
    document.getElementById('medical-low').textContent = medicalTriageMap['Low'];

    // Security metrics
    const threatLevelMap = {
      'Red': 0,
      'Orange': 0,
      'Yellow': 0,
      'Green': 0
    };

    this.securityIncidents.forEach(incident => {
      const level = incident.threat_level || 'Green';
      if (threatLevelMap.hasOwnProperty(level)) {
        threatLevelMap[level]++;
      }
    });

    document.getElementById('security-total').textContent = this.securityIncidents.length;
    document.getElementById('security-red').textContent = threatLevelMap['Red'];
    document.getElementById('security-orange').textContent = threatLevelMap['Orange'];
    document.getElementById('security-yellow').textContent = threatLevelMap['Yellow'];
    document.getElementById('security-green').textContent = threatLevelMap['Green'];

    // Safety metrics and compliance score
    const severityMap = {
      'Critical': 0,
      'High': 0,
      'Medium': 0,
      'Low': 0
    };

    this.safetyHazards.forEach(hazard => {
      const severity = hazard.severity || 'Low';
      if (severityMap.hasOwnProperty(severity)) {
        severityMap[severity]++;
      }
    });

    document.getElementById('safety-critical').textContent = severityMap['Critical'];
    document.getElementById('safety-high').textContent = severityMap['High'];
    document.getElementById('safety-medium').textContent = severityMap['Medium'];
    document.getElementById('safety-low').textContent = severityMap['Low'];

    // Calculate compliance score (100 - penalties)
    const complianceScore = Math.max(0, 100 - (severityMap['Critical'] * 10 + severityMap['High'] * 5 + severityMap['Medium'] * 2));
    document.getElementById('compliance-score').textContent = complianceScore + '%';

    // Staff metrics
    let directors = 0;
    let officers = 0;
    let coordinators = 0;
    let checkedIn = 0;

    this.staffList.forEach(staff => {
      // Count staff by role
      if (staff.staff_roles) {
        staff.staff_roles.forEach(role => {
          if (role.role === 'Event Director') directors++;
          if (role.role === 'Event Safety Officer') officers++;
          if (role.role === 'Event Coordinator') coordinators++;
        });
      }

      // Count checked in staff (has check_in records with check_in_time)
      if (staff.staff_checkin && staff.staff_checkin.length > 0) {
        const lastCheckin = staff.staff_checkin[staff.staff_checkin.length - 1];
        if (lastCheckin.check_in_time && !lastCheckin.check_out_time) {
          checkedIn++;
        }
      }
    });

    document.getElementById('staff-total').textContent = this.staffList.length;
    document.getElementById('staff-directors').textContent = directors;
    document.getElementById('staff-officers').textContent = officers;
    document.getElementById('staff-coordinators').textContent = coordinators;
    document.getElementById('staff-checkedin').textContent = checkedIn;

    // Participant metrics
    const totalParticipants = this.participantsList.length;
    const checkedInParticipants = this.participantsList.filter(p => p.status === 'checked_in').length;
    const completedParticipants = this.participantsList.filter(p => p.status === 'completed').length;

    document.getElementById('participants-total').textContent = totalParticipants;
    document.getElementById('participants-registered').textContent = totalParticipants;
    document.getElementById('participants-checked-in').textContent = checkedInParticipants;
    document.getElementById('participants-completed').textContent = completedParticipants;

    // Route metrics
    const routeTypeMap = {
      'staff_route': 0,
      'vehicle_route': 0,
      'evacuation_route': 0,
      'race_route': 0
    };

    this.routes.forEach(route => {
      const type = route.type || 'staff_route';
      if (routeTypeMap.hasOwnProperty(type)) {
        routeTypeMap[type]++;
      }
    });

    const totalRoutes = this.routes.length;
    document.getElementById('routes-total').textContent = totalRoutes;
    document.getElementById('routes-staff').textContent = routeTypeMap['staff_route'];
    document.getElementById('routes-vehicle').textContent = routeTypeMap['vehicle_route'];
    document.getElementById('routes-evacuation').textContent = routeTypeMap['evacuation_route'];
    document.getElementById('routes-race').textContent = routeTypeMap['race_route'];

    // Route resources metrics
    let totalMarshal = 0;
    let totalSecurity = 0;
    let totalWater = 0;
    let totalMedical = 0;

    this.routes.forEach(route => {
      // Count marshals
      if (route.marshals && Array.isArray(route.marshals)) {
        totalMarshal += route.marshals.length;
      }
      // Count security vehicles
      if (route.security_vehicles && Array.isArray(route.security_vehicles)) {
        totalSecurity += route.security_vehicles.length;
      }
      // Count water tables
      if (route.water_tables && Array.isArray(route.water_tables)) {
        totalWater += route.water_tables.length;
      }
      // Count medical stations
      if (route.medical_stations && Array.isArray(route.medical_stations)) {
        totalMedical += route.medical_stations.length;
      }
    });

    const totalResources = totalMarshal + totalSecurity + totalWater + totalMedical;
    document.getElementById('resources-total').textContent = totalResources;
    document.getElementById('resources-marshals').textContent = totalMarshal;
    document.getElementById('resources-security').textContent = totalSecurity;
    document.getElementById('resources-water').textContent = totalWater;
    document.getElementById('resources-medical').textContent = totalMedical;
  }

  displayAlerts() {
    const criticalItems = [
      ...this.medicalIncidents.filter(i => i.triage_level === 'Critical').map(i => ({
        type: 'medical',
        title: i.description || 'Critical Medical Incident',
        detail: `Triage: ${i.triage_level}`,
        icon: '🏥',
        timestamp: i.created_at
      })),
      ...this.securityIncidents.filter(i => i.threat_level === 'Red').map(i => ({
        type: 'security',
        title: i.description || 'Critical Security Incident',
        detail: `Threat Level: ${i.threat_level}`,
        icon: '🔒',
        timestamp: i.created_at
      })),
      ...this.safetyHazards.filter(h => h.severity === 'Critical').map(h => ({
        type: 'safety',
        title: h.hazard_description || 'Critical Hazard',
        detail: `Severity: ${h.severity}`,
        icon: '⚠️',
        timestamp: h.created_at
      }))
    ];

    const alertsSection = document.getElementById('alerts-section');
    const alertsList = document.getElementById('alerts-list');

    if (criticalItems.length > 0) {
      alertsSection.style.display = 'block';
      alertsList.innerHTML = criticalItems.map(alert => `
        <div class="alert-item">
          <div class="alert-icon">${alert.icon}</div>
          <div class="alert-content">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-detail">${alert.detail}</div>
          </div>
        </div>
      `).join('');
    } else {
      alertsSection.style.display = 'none';
    }
  }

  displayTimeline() {
    const timelineItems = [
      ...this.medicalIncidents.map(i => ({
        type: 'medical',
        icon: '🏥',
        title: i.description || 'Medical Incident',
        detail: `Triage: ${i.triage_level}`,
        timestamp: i.created_at
      })),
      ...this.securityIncidents.map(i => ({
        type: 'security',
        icon: '🔒',
        title: i.description || 'Security Incident',
        detail: `Threat: ${i.threat_level}`,
        timestamp: i.created_at
      })),
      ...this.safetyHazards.map(h => ({
        type: 'safety',
        icon: '⚠️',
        title: h.hazard_description || 'Safety Hazard',
        detail: `Severity: ${h.severity}`,
        timestamp: h.created_at
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    const timeline = document.getElementById('unified-timeline');

    if (timelineItems.length === 0) {
      timeline.innerHTML = '<div class="timeline-empty">No recent activity</div>';
    } else {
      timeline.innerHTML = timelineItems.map(item => {
        const time = new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const date = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `
          <div class="timeline-item">
            <div class="timeline-icon">${item.icon}</div>
            <div class="timeline-content">
              <div class="timeline-title">${item.title}</div>
              <div class="timeline-detail">${item.detail}</div>
              <div class="timeline-time">${date} at ${time}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  subscribeToChanges() {
    // Subscribe to medical incidents
    const medicalSub = supabase
      .channel(`medical-${this.currentEvent.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'medical_incidents', filter: `event_id=eq.${this.currentEvent.id}` },
        () => this.loadAllData()
      )
      .subscribe();

    // Subscribe to security incidents
    const securitySub = supabase
      .channel(`security-${this.currentEvent.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'security_incidents', filter: `event_id=eq.${this.currentEvent.id}` },
        () => this.loadAllData()
      )
      .subscribe();

    // Subscribe to safety hazards
    const safetySub = supabase
      .channel(`safety-${this.currentEvent.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'hazards', filter: `event_id=eq.${this.currentEvent.id}` },
        () => this.loadAllData()
      )
      .subscribe();

    this.subscriptions = [medicalSub, securitySub, safetySub];
  }

  setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.onModuleSelect('settings');
      });
    }

    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.onBack());
    }

    // Module buttons
    document.querySelectorAll('[data-module]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const module = e.target.dataset.module;
        this.onModuleSelect(module);
      });
    });
  }

  destroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

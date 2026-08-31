// Safety Compliance Module - Dashboard Page
import { supabase } from './supabase.js';

export class SafetyPage {
  constructor() {
    this.currentEvent = null;
    this.hazards = [];
    this.inspections = [];
    this.complianceChecklists = [];
    this.selectedHazard = null;
    this.unsubscribe = null;
  }

  async render(eventId, onBack) {
    this.currentEvent = eventId;
    this.onBack = onBack;
    const container = document.getElementById('app');

    container.innerHTML = `
      <div class="safety-dashboard">
        <div class="safety-header">
          <div class="safety-header-top">
            <h1>Safety & Compliance</h1>
            <button class="btn btn-secondary btn-small" id="back-btn-safety">← Back to Dashboard</button>
          </div>
          <div class="compliance-score-indicator" id="compliance-indicator">
            <div class="compliance-score">--</div>
            <span>Overall Compliance Score</span>
          </div>
          <div class="safety-header-stats">
            <div class="stat-card critical">
              <div class="stat-value" id="critical-count">0</div>
              <div class="stat-label">Critical Hazards</div>
            </div>
            <div class="stat-card high">
              <div class="stat-value" id="high-count">0</div>
              <div class="stat-label">High Severity</div>
            </div>
            <div class="stat-card medium">
              <div class="stat-value" id="medium-count">0</div>
              <div class="stat-label">Medium Severity</div>
            </div>
            <div class="stat-card low">
              <div class="stat-value" id="low-count">0</div>
              <div class="stat-label">Low Severity</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="inspections-count">0</div>
              <div class="stat-label">Inspections</div>
            </div>
          </div>
        </div>

        <div class="safety-content">
          <div class="safety-main">
            <div class="hazards-section">
              <div class="section-header">
                <h2>Identified Hazards</h2>
                <button class="btn btn-primary" id="new-hazard-btn">+ Report Hazard</button>
              </div>
              <div class="hazards-list" id="hazards-container">
                <div class="loading">Loading hazards...</div>
              </div>
            </div>

            <div class="inspections-section">
              <div class="section-header">
                <h2>Safety Inspections</h2>
                <button class="btn btn-primary" id="new-inspection-btn">+ New Inspection</button>
              </div>
              <div class="inspections-list" id="inspections-container">
                <div class="loading">Loading inspections...</div>
              </div>
            </div>
          </div>

          <div class="safety-sidebar">
            <div class="hazard-heatmap">
              <h3>Hazard Distribution</h3>
              <div class="heatmap-container" id="heatmap-container">
                <div class="heatmap-item">
                  <span class="heatmap-label">Critical</span>
                  <div class="heatmap-bar critical" style="width: 0%"></div>
                </div>
                <div class="heatmap-item">
                  <span class="heatmap-label">High</span>
                  <div class="heatmap-bar high" style="width: 0%"></div>
                </div>
                <div class="heatmap-item">
                  <span class="heatmap-label">Medium</span>
                  <div class="heatmap-bar medium" style="width: 0%"></div>
                </div>
                <div class="heatmap-item">
                  <span class="heatmap-label">Low</span>
                  <div class="heatmap-bar low" style="width: 0%"></div>
                </div>
              </div>
            </div>

            <div class="compliance-checklist">
              <h3>Compliance Status</h3>
              <div class="compliance-items">
                <div class="compliance-item">
                  <span class="check-box"></span>
                  <span>Pre-event Inspection</span>
                </div>
                <div class="compliance-item">
                  <span class="check-box"></span>
                  <span>Hazard Assessment</span>
                </div>
                <div class="compliance-item">
                  <span class="check-box"></span>
                  <span>Mitigation Plans</span>
                </div>
                <div class="compliance-item">
                  <span class="check-box"></span>
                  <span>Inspector Sign-off</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="hazard-detail-modal" id="hazard-modal" style="display: none !important;">
          <div class="modal-content">
            <button class="modal-close" id="close-modal">&times;</button>
            <div id="detail-container"></div>
          </div>
        </div>

        <div class="new-hazard-modal" id="new-hazard-modal" style="display: none !important;">
          <div class="modal-content">
            <button class="modal-close" id="close-new-modal">&times;</button>
            <h2>Report Safety Hazard</h2>
            <form id="new-hazard-form">
              <div class="form-group">
                <label>Hazard Type</label>
                <input type="text" id="hazard-type" required placeholder="e.g., Electrical, Structural" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="hazard-description" required rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Severity Level</label>
                <select id="severity-level" required>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium" selected>🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div class="form-group">
                <label>Location</label>
                <input type="text" id="hazard-location" required placeholder="Venue/Zone" />
              </div>
              <div class="form-group">
                <label>Mitigation Plan</label>
                <textarea id="mitigation-plan" rows="3" placeholder="How will this hazard be mitigated?"></textarea>
              </div>
              <div class="form-group">
                <label>Assign to Staff Member</label>
                <select id="assigned-staff">
                  <option value="">Unassigned</option>
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-hazard">Cancel</button>
                <button type="submit" class="btn btn-primary">Report Hazard</button>
              </div>
            </form>
          </div>
        </div>

        <div class="new-inspection-modal" id="new-inspection-modal" style="display: none !important;">
          <div class="modal-content">
            <button class="modal-close" id="close-inspection-modal">&times;</button>
            <h2>Conduct Safety Inspection</h2>
            <form id="new-inspection-form">
              <div class="form-group">
                <label>Inspection Type</label>
                <select id="inspection-type" required>
                  <option value="pre_event">Pre-Event</option>
                  <option value="operational">Operational</option>
                  <option value="post_event">Post-Event</option>
                </select>
              </div>
              <div class="form-group">
                <label>Location</label>
                <input type="text" id="inspection-location" required />
              </div>
              <div class="form-group">
                <label>Findings</label>
                <textarea id="inspection-findings" required rows="4"></textarea>
              </div>
              <div class="form-group">
                <label>Compliance Status</label>
                <select id="compliance-status" required>
                  <option value="pass">✅ Pass</option>
                  <option value="fail">❌ Fail</option>
                  <option value="conditional">⚠️ Conditional Pass</option>
                </select>
              </div>
              <div class="form-group">
                <label>Inspector Name</label>
                <input type="text" id="inspector-name" required />
              </div>
              <div class="form-group">
                <label>Follow-up Date (if needed)</label>
                <input type="date" id="follow-up-date" />
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-inspection">Cancel</button>
                <button type="submit" class="btn btn-primary">Submit Inspection</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Load data
    await this.loadHazards();
    await this.loadInspections();

    // Setup event listeners
    this.setupEventListeners();

    // Subscribe to real-time updates
    this.subscribeToHazards();
  }

  async loadHazards() {
    try {
      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .eq('event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.hazards = data || [];
      this.renderHazards();
      this.updateStats();
      this.updateHeatmap();
    } catch (error) {
      console.error('Error loading hazards:', error);
      document.getElementById('hazards-container').innerHTML =
        `<div class="error">Failed to load hazards: ${error.message}</div>`;
    }
  }

  async loadInspections() {
    try {
      const { data, error } = await supabase
        .from('safety_inspections')
        .select('*')
        .eq('event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.inspections = data || [];
      this.renderInspections();
    } catch (error) {
      console.error('Error loading inspections:', error);
      document.getElementById('inspections-container').innerHTML =
        `<div class="error">Failed to load inspections: ${error.message}</div>`;
    }
  }

  renderHazards() {
    const container = document.getElementById('hazards-container');

    if (this.hazards.length === 0) {
      container.innerHTML = `<div class="empty-state">No hazards reported</div>`;
      return;
    }

    container.innerHTML = this.hazards.map(hazard => `
      <div class="hazard-card severity-${hazard.severity || 'medium'}" data-hazard-id="${hazard.id}">
        <div class="card-header">
          <div class="severity-badge severity-${hazard.severity || 'medium'}">
            ${this.getSeverityEmoji(hazard.severity || 'medium')} ${(hazard.severity || 'medium').toUpperCase()}
          </div>
          <div class="hazard-status ${hazard.status}">
            ${hazard.status.toUpperCase()}
          </div>
        </div>

        <div class="card-body">
          <h3>${hazard.hazard_type}</h3>
          <div class="hazard-details">
            <div class="detail-row">
              <span class="label">Description:</span>
              <span class="value">${hazard.description || 'Not recorded'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">${hazard.location_coordinates ? 'GPS Coordinates' : hazard.hazard_type}</span>
            </div>
            ${hazard.mitigation_plan ? `
              <div class="detail-row">
                <span class="label">Mitigation:</span>
                <span class="value">${hazard.mitigation_plan}</span>
              </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Reported:</span>
              <span class="value">${new Date(hazard.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-primary view-hazard" data-hazard-id="${hazard.id}">View Details</button>
          ${hazard.status === 'open' ? `
            <button class="btn btn-sm btn-success mark-resolved" data-hazard-id="${hazard.id}">Mark Resolved</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  renderInspections() {
    const container = document.getElementById('inspections-container');

    if (this.inspections.length === 0) {
      container.innerHTML = `<div class="empty-state">No inspections conducted</div>`;
      return;
    }

    container.innerHTML = this.inspections.map(inspection => `
      <div class="inspection-card status-${inspection.pass_fail || 'pending'}">
        <div class="inspection-header">
          <div class="inspection-type">${inspection.inspection_type ? inspection.inspection_type.replace(/_/g, ' ').toUpperCase() : 'INSPECTION'}</div>
          <div class="pass-fail-badge pass-fail-${inspection.pass_fail || 'pending'}">
            ${inspection.pass_fail === 'pass' ? '✅ PASS' : inspection.pass_fail === 'fail' ? '❌ FAIL' : '⚠️ CONDITIONAL'}
          </div>
        </div>

        <div class="inspection-body">
          <div class="inspection-info">
            <div class="info-row">
              <span class="label">Location:</span>
              <span>${inspection.location || 'Not specified'}</span>
            </div>
            <div class="info-row">
              <span class="label">Inspector:</span>
              <span>${inspection.inspector_signature || 'Not signed'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span>${new Date(inspection.created_at).toLocaleDateString()}</span>
            </div>
            ${inspection.follow_up_date ? `
              <div class="info-row">
                <span class="label">Follow-up:</span>
                <span>${inspection.follow_up_date}</span>
              </div>
            ` : ''}
          </div>
          <div class="inspection-summary">
            ${inspection.findings ? inspection.findings.substring(0, 100) + '...' : 'No findings recorded'}
          </div>
        </div>
      </div>
    `).join('');

    document.getElementById('inspections-count').textContent = this.inspections.length;
  }

  getSeverityEmoji(severity) {
    const emojis = {
      'critical': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢'
    };
    return emojis[severity] || '🟡';
  }

  updateStats() {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    this.hazards.forEach(hazard => {
      const severity = hazard.severity || 'medium';
      stats[severity]++;
    });

    document.getElementById('critical-count').textContent = stats.critical;
    document.getElementById('high-count').textContent = stats.high;
    document.getElementById('medium-count').textContent = stats.medium;
    document.getElementById('low-count').textContent = stats.low;
  }

  updateHeatmap() {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    this.hazards.forEach(hazard => {
      const severity = hazard.severity || 'medium';
      stats[severity]++;
    });

    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    const maxValue = Math.max(...Object.values(stats), 1);

    Object.entries(stats).forEach(([severity, count]) => {
      const percentage = (count / maxValue) * 100;
      const bar = document.querySelector(`.heatmap-bar.${severity}`);
      if (bar) {
        bar.style.width = `${percentage}%`;
      }
    });

    // Calculate compliance score
    const criticalPenalty = stats.critical * 10;
    const highPenalty = stats.high * 5;
    const mediumPenalty = stats.medium * 2;
    const complianceScore = Math.max(0, 100 - criticalPenalty - highPenalty - mediumPenalty);

    document.querySelector('.compliance-score').textContent = Math.round(complianceScore) + '%';
  }

  showHazardDetail(hazardId) {
    const hazard = this.hazards.find(h => h.id === hazardId);
    if (!hazard) return;

    const modal = document.getElementById('hazard-modal');
    const detailContainer = document.getElementById('detail-container');

    detailContainer.innerHTML = `
      <div class="hazard-detail">
        <h2>Hazard Details</h2>

        <div class="detail-section">
          <h3>Hazard Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Type</label>
              <p>${hazard.hazard_type}</p>
            </div>
            <div class="info-item">
              <label>Severity</label>
              <p><span class="severity-badge severity-${hazard.severity || 'medium'}">${this.getSeverityEmoji(hazard.severity || 'medium')} ${(hazard.severity || 'medium').toUpperCase()}</span></p>
            </div>
            <div class="info-item">
              <label>Status</label>
              <p class="status-${hazard.status}">${hazard.status.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Description</h3>
          <p>${hazard.description || 'Not recorded'}</p>
        </div>

        ${hazard.mitigation_plan ? `
          <div class="detail-section">
            <h3>Mitigation Plan</h3>
            <p>${hazard.mitigation_plan}</p>
          </div>
        ` : ''}

        <div class="detail-section">
          <h3>Timeline</h3>
          <div class="timeline">
            <div class="timeline-item">
              <span class="timeline-label">Reported</span>
              <span class="timeline-time">${new Date(hazard.created_at).toLocaleString()}</span>
            </div>
            ${hazard.resolved_at ? `
              <div class="timeline-item">
                <span class="timeline-label">Resolved</span>
                <span class="timeline-time">${new Date(hazard.resolved_at).toLocaleString()}</span>
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
    const backBtn = document.getElementById('back-btn-safety');
    if (backBtn && this.onBack) {
      backBtn.addEventListener('click', () => {
        this.onBack();
      });
    }

    document.getElementById('new-hazard-btn').addEventListener('click', () => {
      document.getElementById('new-hazard-modal').style.display = 'flex';
    });

    document.getElementById('new-inspection-btn').addEventListener('click', () => {
      document.getElementById('new-inspection-modal').style.display = 'flex';
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      document.getElementById('hazard-modal').style.display = 'none';
    });

    document.getElementById('close-new-modal').addEventListener('click', () => {
      document.getElementById('new-hazard-modal').style.display = 'none';
    });

    document.getElementById('close-inspection-modal').addEventListener('click', () => {
      document.getElementById('new-inspection-modal').style.display = 'none';
    });

    document.getElementById('cancel-hazard').addEventListener('click', () => {
      document.getElementById('new-hazard-modal').style.display = 'none';
    });

    document.getElementById('cancel-inspection').addEventListener('click', () => {
      document.getElementById('new-inspection-modal').style.display = 'none';
    });

    document.querySelectorAll('.view-hazard').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.showHazardDetail(e.target.dataset.hazardId);
      });
    });

    document.querySelectorAll('.mark-resolved').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.markHazardResolved(e.target.dataset.hazardId);
      });
    });

    document.getElementById('new-hazard-form').addEventListener('submit', (e) => {
      this.handleNewHazard(e);
    });

    document.getElementById('new-inspection-form').addEventListener('submit', (e) => {
      this.handleNewInspection(e);
    });

    document.getElementById('hazard-modal').addEventListener('click', (e) => {
      if (e.target.id === 'hazard-modal') {
        document.getElementById('hazard-modal').style.display = 'none';
      }
    });

    document.getElementById('new-hazard-modal').addEventListener('click', (e) => {
      if (e.target.id === 'new-hazard-modal') {
        document.getElementById('new-hazard-modal').style.display = 'none';
      }
    });

    document.getElementById('new-inspection-modal').addEventListener('click', (e) => {
      if (e.target.id === 'new-inspection-modal') {
        document.getElementById('new-inspection-modal').style.display = 'none';
      }
    });
  }

  async handleNewHazard(e) {
    e.preventDefault();

    const hazardType = document.getElementById('hazard-type').value;
    const description = document.getElementById('hazard-description').value;
    const severity = document.getElementById('severity-level').value;
    const location = document.getElementById('hazard-location').value;
    const mitigationPlan = document.getElementById('mitigation-plan').value;
    const assignedStaffId = document.getElementById('assigned-staff').value;

    try {
      const { error } = await supabase
        .from('hazards')
        .insert([
          {
            event_id: this.currentEvent,
            hazard_type: hazardType,
            description: description,
            severity: severity,
            mitigation_plan: mitigationPlan,
            status: 'open',
            assigned_to_user_id: assignedStaffId || null
          }
        ]);

      if (error) throw error;

      document.getElementById('new-hazard-form').reset();
      document.getElementById('new-hazard-modal').style.display = 'none';

      await this.loadHazards();

      alert('Hazard reported successfully');
    } catch (error) {
      console.error('Error creating hazard:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async handleNewInspection(e) {
    e.preventDefault();

    const inspectionType = document.getElementById('inspection-type').value;
    const location = document.getElementById('inspection-location').value;
    const findings = document.getElementById('inspection-findings').value;
    const complianceStatus = document.getElementById('compliance-status').value;
    const inspectorName = document.getElementById('inspector-name').value;
    const followUpDate = document.getElementById('follow-up-date').value;

    try {
      const { error } = await supabase
        .from('safety_inspections')
        .insert([
          {
            event_id: this.currentEvent,
            inspection_type: inspectionType,
            findings: findings,
            compliance_status: complianceStatus,
            pass_fail: complianceStatus === 'pass' ? 'pass' : complianceStatus === 'fail' ? 'fail' : 'conditional',
            inspector_signature: inspectorName,
            follow_up_date: followUpDate || null
          }
        ]);

      if (error) throw error;

      document.getElementById('new-inspection-form').reset();
      document.getElementById('new-inspection-modal').style.display = 'none';

      await this.loadInspections();

      alert('Inspection submitted successfully');
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async markHazardResolved(hazardId) {
    try {
      const { error } = await supabase
        .from('hazards')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', hazardId);

      if (error) throw error;

      await this.loadHazards();
      alert('Hazard marked as resolved');
    } catch (error) {
      console.error('Error updating hazard:', error);
      alert(`Error: ${error.message}`);
    }
  }

  subscribeToHazards() {
    this.unsubscribe = supabase
      .channel(`safety-hazards-${this.currentEvent}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hazards'
        },
        (payload) => {
          console.log('Hazard update:', payload);
          this.loadHazards();
        }
      )
      .subscribe();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

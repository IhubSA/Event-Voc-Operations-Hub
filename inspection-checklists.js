// Structured Safety Inspection Checklists
// Template-driven checklists with live compliance scoring, critical-item gating,
// and a saved history of completed inspections per event.
import { supabase } from './supabase.js';

export const CHECKLIST_TEMPLATES = {
  venue_structural: {
    label: 'Venue & Structural Safety',
    icon: '🏗️',
    items: [
      { id: 'vs1', text: 'Structural integrity of stages, platforms & temporary structures verified', critical: true },
      { id: 'vs2', text: 'Marquees/tents properly anchored and rated for expected wind conditions', critical: true },
      { id: 'vs3', text: 'Electrical installations inspected and certified safe', critical: true },
      { id: 'vs4', text: 'Fire extinguishers present, accessible, and in date', critical: true },
      { id: 'vs5', text: 'Emergency exits clearly marked, unobstructed, and adequate in number', critical: true },
      { id: 'vs6', text: 'Structural engineer sign-off obtained for temporary structures (if applicable)', critical: false },
      { id: 'vs7', text: 'Ground / surface conditions suitable and free of trip hazards', critical: false },
      { id: 'vs8', text: 'Lighting adequate for all operational areas, including after dark', critical: false },
      { id: 'vs9', text: 'Fencing and barriers secure and appropriate for crowd control', critical: false },
      { id: 'vs10', text: 'Generators and fuel storage safely positioned away from crowds', critical: true }
    ]
  },
  crowd_access_management: {
    label: 'Crowd & Access Management',
    icon: '🚧',
    items: [
      { id: 'ca1', text: 'Venue capacity limits defined and communicated to all staff', critical: true },
      { id: 'ca2', text: 'Entry and exit points clearly signed and adequately staffed', critical: true },
      { id: 'ca3', text: 'Crowd flow / layout reviewed for bottleneck and crush risks', critical: true },
      { id: 'ca4', text: 'Queue management systems in place at entry points', critical: false },
      { id: 'ca5', text: 'Accreditation / ticketing / registration system operational', critical: false },
      { id: 'ca6', text: 'Crowd density monitoring plan in place', critical: false },
      { id: 'ca7', text: 'Accessible routes identified and unobstructed', critical: false },
      { id: 'ca8', text: 'Public address system tested and operational for announcements', critical: false },
      { id: 'ca9', text: 'Directional, facility and emergency route signage in place', critical: false }
    ]
  },
  emergency_medical: {
    label: 'Emergency & Medical Preparedness',
    icon: '🚑',
    items: [
      { id: 'em1', text: 'Medical posts established per event medical plan', critical: true },
      { id: 'em2', text: 'Sufficient qualified medical personnel on site for expected attendance', critical: true },
      { id: 'em3', text: 'Ambulance access routes identified and kept clear', critical: true },
      { id: 'em4', text: 'Emergency evacuation plan documented and briefed to staff', critical: true },
      { id: 'em5', text: 'Assembly points identified and communicated', critical: false },
      { id: 'em6', text: 'Emergency contact numbers displayed and distributed to key staff', critical: false },
      { id: 'em7', text: 'First aid kits stocked and positioned at key locations', critical: false },
      { id: 'em8', text: 'Defibrillators (AEDs) available and staff trained in use', critical: false },
      { id: 'em9', text: 'Severe weather contingency plan in place', critical: false }
    ]
  },
  vendor_health: {
    label: 'Vendor & Health Compliance',
    icon: '🍽️',
    items: [
      { id: 'vh1', text: 'All food vendors hold valid Certificates of Acceptability', critical: true },
      { id: 'vh2', text: 'Liquor license obtained where alcohol is served', critical: true },
      { id: 'vh3', text: 'Adequate ablution / toilet facilities provided for expected attendance', critical: false },
      { id: 'vh4', text: 'Waste management and removal plan in place', critical: false },
      { id: 'vh5', text: 'Vendor gas (LPG) installations inspected and safe', critical: true },
      { id: 'vh6', text: 'Potable water supply confirmed adequate', critical: false },
      { id: 'vh7', text: 'Vendor placement reviewed for fire / safety clearances', critical: false }
    ]
  },
  security_readiness: {
    label: 'Security Readiness',
    icon: '🛡️',
    items: [
      { id: 'sr1', text: 'Registered / compliant security service provider confirmed', critical: true },
      { id: 'sr2', text: 'Security personnel briefed on event-specific risks and procedures', critical: true },
      { id: 'sr3', text: 'Access control measures in place at all entry points', critical: true },
      { id: 'sr4', text: 'Communication systems tested between security, medical & event control', critical: false },
      { id: 'sr5', text: 'CCTV / surveillance coverage confirmed operational (if applicable)', critical: false },
      { id: 'sr6', text: 'Bag search / prohibited items policy communicated and enforced', critical: false },
      { id: 'sr7', text: 'Incident reporting procedure briefed to all security staff', critical: false },
      { id: 'sr8', text: 'Coordination confirmed with local police / external security services', critical: false }
    ]
  }
};

export class InspectionChecklists {
  constructor() {
    this.eventId = null;
    this.checklists = [];
    this.currentTemplate = null;
    this.currentItemState = {};
  }

  async render(eventId, onBack) {
    this.eventId = eventId;
    this.onBack = onBack;
    this.view = 'list';
    const container = document.getElementById('app');
    container.innerHTML = `<div id="ic-root"></div>`;
    this.addStyles();
    await this.loadChecklists();
    this.renderList();
  }

  async loadChecklists() {
    try {
      const { data, error } = await supabase
        .from('compliance_checklists')
        .select('*')
        .eq('event_id', this.eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.checklists = data || [];
    } catch (error) {
      console.error('Error loading checklists:', error);
      this.checklists = [];
    }
  }

  // ---------- LIST VIEW ----------
  renderList() {
    this.view = 'list';
    const root = document.getElementById('ic-root');

    const templateCards = Object.entries(CHECKLIST_TEMPLATES).map(([key, tpl]) => `
      <button class="ic-template-card" data-template="${key}">
        <span class="ic-template-icon">${tpl.icon}</span>
        <span class="ic-template-label">${tpl.label}</span>
        <span class="ic-template-count">${tpl.items.length} checkpoints</span>
      </button>
    `).join('');

    const historyRows = this.checklists.length === 0
      ? `<div class="ic-empty">No inspection checklists completed yet for this event</div>`
      : this.checklists.map(c => {
          const tpl = CHECKLIST_TEMPLATES[c.checklist_type];
          const score = c.compliance_score ?? 0;
          const statusClass = score >= 90 ? 'pass' : score >= 70 ? 'conditional' : 'fail';
          const statusLabel = score >= 90 ? 'PASS' : score >= 70 ? 'CONDITIONAL' : 'FAIL';
          return `
            <div class="ic-history-card" data-id="${c.id}">
              <div class="ic-history-icon">${tpl?.icon || '📋'}</div>
              <div class="ic-history-info">
                <h4>${tpl?.label || c.checklist_type}</h4>
                <p>${c.completion_date ? new Date(c.completion_date).toLocaleDateString() : new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <div class="ic-history-score">
                <span class="ic-score-num">${score}%</span>
                <span class="ic-status-badge status-${statusClass}">${statusLabel}</span>
              </div>
              <button class="btn btn-small btn-secondary ic-view-btn" data-id="${c.id}">View</button>
            </div>
          `;
        }).join('');

    root.innerHTML = `
      <div class="ic-container">
        <div class="ic-header">
          <h1>📋 Safety Inspection Checklists</h1>
          <button class="btn btn-secondary" id="ic-back-btn">← Back to Safety & Compliance</button>
        </div>

        <div class="ic-section">
          <h2>Start a New Inspection</h2>
          <div class="ic-template-grid">${templateCards}</div>
        </div>

        <div class="ic-section">
          <h2>Inspection History</h2>
          <div class="ic-history-list">${historyRows}</div>
        </div>
      </div>
    `;

    document.getElementById('ic-back-btn').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    root.querySelectorAll('.ic-template-card').forEach(btn => {
      btn.addEventListener('click', () => this.renderForm(btn.dataset.template));
    });

    root.querySelectorAll('.ic-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const checklist = this.checklists.find(c => c.id === btn.dataset.id);
        if (checklist) this.renderForm(checklist.checklist_type, checklist);
      });
    });
  }

  // ---------- FORM VIEW ----------
  renderForm(templateKey, existingChecklist = null) {
    this.view = 'form';
    this.currentTemplate = templateKey;
    this.editingChecklistId = existingChecklist?.id || null;
    const tpl = CHECKLIST_TEMPLATES[templateKey];
    const root = document.getElementById('ic-root');
    const readOnly = false; // allow re-editing/updating a completed checklist

    // Initialize item state
    this.currentItemState = {};
    if (existingChecklist?.items) {
      existingChecklist.items.forEach(item => {
        this.currentItemState[item.id] = { status: item.status || 'pending', notes: item.notes || '' };
      });
    } else {
      tpl.items.forEach(item => {
        this.currentItemState[item.id] = { status: 'pending', notes: '' };
      });
    }

    root.innerHTML = `
      <div class="ic-container">
        <div class="ic-header">
          <h1>${tpl.icon} ${tpl.label}</h1>
          <button class="btn btn-secondary" id="ic-form-back-btn">← Back to Checklists</button>
        </div>

        <div class="ic-form-layout">
          <div class="ic-checklist-items">
            ${tpl.items.map((item, idx) => `
              <div class="ic-item-card" data-item-id="${item.id}">
                <div class="ic-item-top">
                  <span class="ic-item-num">${idx + 1}</span>
                  <span class="ic-item-text">${item.text}</span>
                  ${item.critical ? '<span class="ic-critical-tag">CRITICAL</span>' : ''}
                </div>
                <div class="ic-item-controls">
                  <div class="ic-status-buttons" data-item-id="${item.id}">
                    <button type="button" class="ic-status-btn status-pass" data-status="pass">✅ Pass</button>
                    <button type="button" class="ic-status-btn status-fail" data-status="fail">❌ Fail</button>
                    <button type="button" class="ic-status-btn status-na" data-status="na">➖ N/A</button>
                  </div>
                  <input type="text" class="ic-item-notes" data-item-id="${item.id}" placeholder="Notes (optional)" value="${(this.currentItemState[item.id].notes || '').replace(/"/g, '&quot;')}" />
                </div>
              </div>
            `).join('')}
          </div>

          <div class="ic-form-sidebar">
            <div class="ic-score-card">
              <h3>Compliance Score</h3>
              <div class="ic-big-score" id="ic-big-score">0%</div>
              <div class="ic-overall-badge" id="ic-overall-badge">NOT STARTED</div>
              <div class="ic-progress-stats" id="ic-progress-stats"></div>
            </div>

            <div class="ic-details-card">
              <h3>Inspection Details</h3>
              <div class="form-group">
                <label>Location / Zone</label>
                <input type="text" id="ic-location" placeholder="e.g., Main Stage, Zone A" value="${existingChecklist?.location || ''}" />
              </div>
              <div class="form-group">
                <label>Inspector Name</label>
                <input type="text" id="ic-inspector" placeholder="Full name" />
              </div>
              <button class="btn btn-primary btn-full" id="ic-save-btn">💾 Save Inspection</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ic-form-back-btn').addEventListener('click', () => this.renderList());

    // Set initial button states
    tpl.items.forEach(item => {
      const state = this.currentItemState[item.id];
      if (state.status !== 'pending') {
        this.setItemStatusUI(item.id, state.status);
      }
    });

    // Status button clicks
    root.querySelectorAll('.ic-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.closest('.ic-status-buttons').dataset.itemId;
        const status = btn.dataset.status;
        this.currentItemState[itemId].status = status;
        this.setItemStatusUI(itemId, status);
        this.updateScore();
      });
    });

    // Notes input
    root.querySelectorAll('.ic-item-notes').forEach(input => {
      input.addEventListener('input', () => {
        this.currentItemState[input.dataset.itemId].notes = input.value;
      });
    });

    document.getElementById('ic-save-btn').addEventListener('click', () => this.saveChecklist());

    this.updateScore();
  }

  setItemStatusUI(itemId, status) {
    const card = document.querySelector(`.ic-item-card[data-item-id="${itemId}"]`);
    if (!card) return;
    card.classList.remove('item-pass', 'item-fail', 'item-na');
    card.classList.add(`item-${status}`);
    card.querySelectorAll('.ic-status-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.status === status);
    });
  }

  updateScore() {
    const tpl = CHECKLIST_TEMPLATES[this.currentTemplate];
    let passCount = 0, failCount = 0, naCount = 0, pendingCount = 0;
    let criticalFailed = false;

    tpl.items.forEach(item => {
      const status = this.currentItemState[item.id].status;
      if (status === 'pass') passCount++;
      else if (status === 'fail') {
        failCount++;
        if (item.critical) criticalFailed = true;
      } else if (status === 'na') naCount++;
      else pendingCount++;
    });

    const scoredItems = passCount + failCount; // exclude N/A and pending from denominator
    const score = scoredItems > 0 ? Math.round((passCount / scoredItems) * 100) : 0;

    const scoreEl = document.getElementById('ic-big-score');
    const badgeEl = document.getElementById('ic-overall-badge');
    const statsEl = document.getElementById('ic-progress-stats');

    if (scoreEl) scoreEl.textContent = `${score}%`;

    let overallStatus = 'NOT STARTED';
    let badgeClass = 'pending';
    if (pendingCount === 0) {
      if (criticalFailed) {
        overallStatus = 'FAIL — CRITICAL ITEM';
        badgeClass = 'fail';
      } else if (score >= 90) {
        overallStatus = 'PASS';
        badgeClass = 'pass';
      } else if (score >= 70) {
        overallStatus = 'CONDITIONAL';
        badgeClass = 'conditional';
      } else {
        overallStatus = 'FAIL';
        badgeClass = 'fail';
      }
    } else if (criticalFailed) {
      overallStatus = 'FAIL — CRITICAL ITEM';
      badgeClass = 'fail';
    }

    if (badgeEl) {
      badgeEl.textContent = overallStatus;
      badgeEl.className = `ic-overall-badge badge-${badgeClass}`;
    }

    if (statsEl) {
      statsEl.innerHTML = `
        <div class="ic-stat-row"><span>✅ Pass</span><strong>${passCount}</strong></div>
        <div class="ic-stat-row"><span>❌ Fail</span><strong>${failCount}</strong></div>
        <div class="ic-stat-row"><span>➖ N/A</span><strong>${naCount}</strong></div>
        <div class="ic-stat-row"><span>⏳ Pending</span><strong>${pendingCount}</strong></div>
      `;
    }

    this._lastScore = score;
    this._lastCriticalFailed = criticalFailed;
    this._lastPendingCount = pendingCount;
  }

  async saveChecklist() {
    const tpl = CHECKLIST_TEMPLATES[this.currentTemplate];
    const location = document.getElementById('ic-location').value;
    const inspector = document.getElementById('ic-inspector').value;

    if (this._lastPendingCount > 0) {
      if (!confirm(`${this._lastPendingCount} item(s) are still unmarked. Save anyway?`)) return;
    }

    const items = tpl.items.map(item => ({
      id: item.id,
      text: item.text,
      critical: item.critical,
      status: this.currentItemState[item.id].status,
      notes: this.currentItemState[item.id].notes
    }));

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        event_id: this.eventId,
        checklist_type: this.currentTemplate,
        items,
        compliance_score: this._lastScore,
        completion_date: new Date().toISOString(),
        signed_by_user_id: user?.id || null,
        location: location || null,
        inspector_name: inspector || null,
        updated_at: new Date().toISOString()
      };

      let error;
      if (this.editingChecklistId) {
        ({ error } = await supabase
          .from('compliance_checklists')
          .update(payload)
          .eq('id', this.editingChecklistId));
      } else {
        ({ error } = await supabase
          .from('compliance_checklists')
          .insert([payload]));
      }

      if (error) throw error;

      this.showToast(`✓ Inspection saved — ${this._lastScore}% compliant`, 'success');
      await this.loadChecklists();
      setTimeout(() => this.renderList(), 800);
    } catch (error) {
      console.error('Error saving checklist:', error);
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  showToast(text, type) {
    const message = document.createElement('div');
    message.className = `ic-toast toast-${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => message.classList.add('show'), 10);
    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }

  addStyles() {
    if (document.getElementById('ic-styles')) return;
    const style = document.createElement('style');
    style.id = 'ic-styles';
    style.textContent = `
      .ic-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #0F1419 0%, #1A2332 100%);
        padding: 2rem;
        color: #FFFFFF;
      }

      .ic-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        padding: 1.5rem 2rem;
        border: 2px solid #0099FF;
        border-radius: 12px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }

      .ic-header h1 { margin: 0; color: #0099FF; font-size: 1.6rem; }

      .ic-section { max-width: 1200px; margin: 0 auto 2.5rem auto; }

      .ic-section h2 {
        color: #00A8E8;
        font-size: 1.3rem;
        margin-bottom: 1.2rem;
      }

      .ic-template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.2rem;
      }

      .ic-template-card {
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        border: 2px solid #334455;
        border-radius: 12px;
        padding: 1.8rem 1.2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #FFFFFF;
        font-family: inherit;
      }

      .ic-template-card:hover {
        border-color: #0099FF;
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(0,153,255,0.2);
      }

      .ic-template-icon { font-size: 2.2rem; }
      .ic-template-label { font-weight: 700; text-align: center; color: #0099FF; }
      .ic-template-count { font-size: 0.8rem; color: #78909C; }

      .ic-history-list { display: flex; flex-direction: column; gap: 1rem; }

      .ic-empty {
        text-align: center;
        padding: 3rem;
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        border: 2px dashed #334455;
        border-radius: 12px;
        color: #78909C;
      }

      .ic-history-card {
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        border: 2px solid #334455;
        border-radius: 10px;
        padding: 1.2rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.2rem;
        transition: all 0.3s ease;
      }

      .ic-history-card:hover { border-color: #0099FF; }

      .ic-history-icon { font-size: 1.8rem; }
      .ic-history-info { flex: 1; }
      .ic-history-info h4 { margin: 0 0 0.2rem 0; color: #FFFFFF; }
      .ic-history-info p { margin: 0; font-size: 0.85rem; color: #78909C; }

      .ic-history-score { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
      .ic-score-num { font-size: 1.3rem; font-weight: 700; color: #0099FF; }

      .ic-status-badge {
        padding: 0.25rem 0.7rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.3px;
      }

      .ic-status-badge.status-pass { background: rgba(76,175,80,0.2); color: #4CAF50; }
      .ic-status-badge.status-conditional { background: rgba(255,152,0,0.2); color: #FF9800; }
      .ic-status-badge.status-fail { background: rgba(255,82,82,0.2); color: #FF6B6B; }

      /* Form view */
      .ic-form-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        align-items: start;
      }

      .ic-checklist-items { display: flex; flex-direction: column; gap: 1rem; }

      .ic-item-card {
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        border: 2px solid #334455;
        border-radius: 10px;
        padding: 1.2rem 1.5rem;
        transition: all 0.3s ease;
      }

      .ic-item-card.item-pass { border-color: #4CAF50; }
      .ic-item-card.item-fail { border-color: #FF6B6B; }
      .ic-item-card.item-na { border-color: #78909C; opacity: 0.7; }

      .ic-item-top {
        display: flex;
        align-items: flex-start;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }

      .ic-item-num {
        background: rgba(0,153,255,0.15);
        color: #0099FF;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .ic-item-text { flex: 1; font-size: 0.95rem; line-height: 1.5; }

      .ic-critical-tag {
        background: rgba(255,82,82,0.2);
        color: #FF6B6B;
        border: 1px solid #FF6B6B;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.2rem 0.5rem;
        border-radius: 10px;
        white-space: nowrap;
        letter-spacing: 0.3px;
      }

      .ic-item-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .ic-status-buttons { display: flex; gap: 0.5rem; }

      .ic-status-btn {
        padding: 0.5rem 1rem;
        border: 2px solid #334455;
        border-radius: 8px;
        background: rgba(255,255,255,0.05);
        color: #B0BEC5;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .ic-status-btn:hover { border-color: #0099FF; }

      .ic-status-btn.status-pass.active { background: rgba(76,175,80,0.2); border-color: #4CAF50; color: #4CAF50; }
      .ic-status-btn.status-fail.active { background: rgba(255,82,82,0.2); border-color: #FF6B6B; color: #FF6B6B; }
      .ic-status-btn.status-na.active { background: rgba(120,144,156,0.2); border-color: #78909C; color: #B0BEC5; }

      .ic-item-notes {
        flex: 1;
        min-width: 180px;
        padding: 0.55rem 0.8rem;
        border: 2px solid #334455;
        border-radius: 8px;
        background: rgba(255,255,255,0.05);
        color: #FFFFFF;
        font-size: 0.85rem;
        font-family: inherit;
      }

      .ic-item-notes:focus {
        outline: none;
        border-color: #0099FF;
      }

      .ic-form-sidebar {
        position: sticky;
        top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .ic-score-card, .ic-details-card {
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        border: 2px solid #334455;
        border-radius: 12px;
        padding: 1.8rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }

      .ic-score-card h3, .ic-details-card h3 {
        margin: 0 0 1rem 0;
        color: #0099FF;
        text-align: center;
      }

      .ic-details-card h3 { text-align: left; }

      .ic-big-score {
        font-size: 3rem;
        font-weight: 700;
        text-align: center;
        color: #FFFFFF;
        margin-bottom: 0.5rem;
      }

      .ic-overall-badge {
        display: block;
        text-align: center;
        padding: 0.6rem;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.85rem;
        letter-spacing: 0.3px;
        margin-bottom: 1.2rem;
      }

      .ic-overall-badge.badge-pending { background: rgba(120,144,156,0.15); color: #78909C; border: 1px solid #78909C; }
      .ic-overall-badge.badge-pass { background: rgba(76,175,80,0.2); color: #4CAF50; border: 1px solid #4CAF50; }
      .ic-overall-badge.badge-conditional { background: rgba(255,152,0,0.2); color: #FF9800; border: 1px solid #FF9800; }
      .ic-overall-badge.badge-fail { background: rgba(255,82,82,0.2); color: #FF6B6B; border: 1px solid #FF6B6B; }

      .ic-progress-stats { display: flex; flex-direction: column; gap: 0.4rem; }

      .ic-stat-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: #B0BEC5;
        padding: 0.4rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .ic-stat-row strong { color: #FFFFFF; }

      .ic-details-card .form-group { margin-bottom: 1rem; }

      .ic-details-card label {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        color: #B0BEC5;
        text-transform: uppercase;
        margin-bottom: 0.4rem;
      }

      .ic-details-card input {
        width: 100%;
        padding: 0.7rem;
        border: 2px solid #334455;
        border-radius: 8px;
        background: rgba(255,255,255,0.05);
        color: #FFFFFF;
        font-family: inherit;
      }

      .ic-details-card input:focus { outline: none; border-color: #0099FF; }

      .btn-full { width: 100%; margin-top: 0.5rem; }

      .btn {
        padding: 0.75rem 1.5rem;
        border: 2px solid transparent;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .btn-primary {
        background: linear-gradient(135deg, #0099FF, #00A8E8);
        color: white;
        box-shadow: 0 4px 16px rgba(0,153,255,0.2);
      }

      .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,153,255,0.3); }

      .btn-secondary {
        background: rgba(255,255,255,0.1);
        color: #FFFFFF;
        border-color: #334455;
      }

      .btn-secondary:hover { background: rgba(0,168,232,0.15); border-color: #0099FF; color: #0099FF; }

      .btn-small { padding: 0.5rem 1rem; font-size: 0.8rem; }

      .ic-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1.2rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 3000;
        transform: translateY(120%);
        transition: transform 0.3s ease;
        border-left: 4px solid;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      }

      .ic-toast.show { transform: translateY(0); }
      .ic-toast.toast-success { background: rgba(76,175,80,0.15); color: #4CAF50; border-left-color: #4CAF50; }
      .ic-toast.toast-error { background: rgba(255,82,82,0.15); color: #FFB3B3; border-left-color: #FF6B6B; }

      @media (max-width: 1024px) {
        .ic-form-layout { grid-template-columns: 1fr; }
        .ic-form-sidebar { position: static; }
      }

      @media (max-width: 768px) {
        .ic-container { padding: 1rem; }
        .ic-header { flex-direction: column; gap: 1rem; text-align: center; }
        .ic-history-card { flex-wrap: wrap; }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {}
}

// Event Risk Categorization Calculator
// Weighted risk scoring based on event safety & security best practice factors
// (attendance, crowd dynamics, historic incidents, security coverage, environment, etc.)
import { supabase } from './supabase.js';

// Weight table — each factor contributes points toward a 0-151 raw score,
// which is converted to a percentage and mapped to LOW / MEDIUM / HIGH.
const WEIGHTS = {
  attendance: [
    { max: 499, points: 0 },
    { max: 2000, points: 5 },
    { max: 5000, points: 10 },
    { max: 10000, points: 18 },
    { max: 20000, points: 25 },
    { max: Infinity, points: 30 }
  ],
  vip_attendance: 10,
  historic_incidents: { none: 0, minor: 5, moderate: 12, severe: 20 },
  crime_trend_concern: 8,
  liquor_sales: 8,
  competitive_rivalry_level: { none: 0, low: 3, moderate: 8, high: 15 },
  weather_risk: { low: 0, moderate: 4, high: 8, severe: 12 },
  police_security_availability: { full: 0, partial: 6, limited: 12, none: 18 },
  venue_not_certified: 10,
  multi_day_event: 3,
  night_event: 4,
  no_previous_experience: 5,
  no_safety_officer: 8
};

const MAX_SCORE = 30 + 10 + 20 + 8 + 8 + 15 + 12 + 18 + 10 + 3 + 4 + 5 + 8; // 151

export class RiskCategorization {
  constructor() {
    this.eventId = null;
    this.assessment = null;
    this.eventData = null;
    this.eventStaff = [];
  }

  async render(eventId, onBack) {
    this.eventId = eventId;
    this.onBack = onBack;
    const container = document.getElementById('app');

    container.innerHTML = `
      <div class="riskcat-container">
        <div class="riskcat-header">
          <h1>🎯 Event Risk Categorization</h1>
          <button class="btn btn-secondary" id="riskcat-back-btn">← Back to Safety & Compliance</button>
        </div>

        <div class="riskcat-layout">
          <form id="riskcat-form" class="riskcat-form">

            <div class="riskcat-card">
              <h2>Event Profile</h2>
              <div class="form-row">
                <div class="form-group">
                  <label>Expected Attendance</label>
                  <input type="number" id="rc-attendance" min="0" placeholder="e.g., 5000" />
                </div>
                <div class="form-group">
                  <label>Venue Certified Safe Capacity</label>
                  <input type="number" id="rc-capacity" min="0" placeholder="e.g., 8000" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-vip" />
                  <label for="rc-vip">VIP / VVIP attendance expected</label>
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-multiday" />
                  <label for="rc-multiday">Multi-day event</label>
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-night" />
                  <label for="rc-night">Includes night-time hours</label>
                </div>
              </div>
              <div class="form-group" id="rc-vip-details-wrap" style="display:none;">
                <label>VIP Details</label>
                <input type="text" id="rc-vip-details" placeholder="Names / roles (optional)" />
              </div>
            </div>

            <div class="riskcat-card">
              <h2>Historical &amp; Crime Factors</h2>
              <div class="form-row">
                <div class="form-group">
                  <label>Historic Incidents at Similar Events</label>
                  <select id="rc-historic">
                    <option value="none">None recorded</option>
                    <option value="minor">Minor incidents</option>
                    <option value="moderate">Moderate incidents</option>
                    <option value="severe">Severe incidents</option>
                  </select>
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-crime" />
                  <label for="rc-crime">Relevant crime trend / concern for this area</label>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-experience" checked />
                  <label for="rc-experience">Organiser has prior experience running similar events</label>
                </div>
              </div>
            </div>

            <div class="riskcat-card">
              <h2>Crowd Dynamics</h2>
              <div class="form-row">
                <div class="form-group">
                  <label>Competitive Rivalry / Tension Level</label>
                  <select id="rc-rivalry">
                    <option value="none">None (non-competitive event)</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-liquor" />
                  <label for="rc-liquor">Alcohol will be sold / consumed on site</label>
                </div>
              </div>
            </div>

            <div class="riskcat-card">
              <h2>Environmental &amp; Operational Readiness</h2>
              <div class="form-row">
                <div class="form-group">
                  <label>Anticipated Weather Risk</label>
                  <select id="rc-weather">
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Police / Security Service Availability</label>
                  <select id="rc-security">
                    <option value="full">Full coverage confirmed</option>
                    <option value="partial">Partial coverage</option>
                    <option value="limited">Limited coverage</option>
                    <option value="none">Not yet confirmed</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-certified" checked />
                  <label for="rc-certified">Venue holds a valid safety / grading certificate</label>
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="rc-safety-officer" />
                  <label for="rc-safety-officer">Event Safety Officer appointed</label>
                </div>
              </div>
              <div class="form-group" id="rc-safety-officer-name-wrap" style="display:none;">
                <label>Event Safety Officer</label>
                <select id="rc-safety-officer-select">
                  <option value="">Select from Staff Management...</option>
                </select>
                <input type="text" id="rc-safety-officer-name" placeholder="Full name" style="display:none; margin-top: 0.6rem;" />
              </div>
            </div>

            <div class="riskcat-card">
              <h2>Additional Notes</h2>
              <div class="form-group">
                <textarea id="rc-notes" rows="4" placeholder="Any other factors relevant to this event's risk profile..."></textarea>
              </div>
              <div class="form-group">
                <label>Assessed By</label>
                <input type="text" id="rc-assessor" placeholder="Full name" />
              </div>
            </div>

            <div class="riskcat-actions">
              <button type="button" class="btn btn-secondary" id="rc-save-draft">💾 Save as Draft</button>
              <button type="submit" class="btn btn-primary" id="rc-submit">✅ Save &amp; Finalize Assessment</button>
            </div>
          </form>

          <div class="riskcat-sidebar">
            <div class="riskcat-score-card">
              <h3>Risk Categorization</h3>
              <div class="score-ring-wrap">
                <div class="score-ring" id="rc-score-ring">
                  <span id="rc-score-value">0%</span>
                </div>
              </div>
              <div class="risk-category-badge" id="rc-category-badge">LOW RISK</div>
              <div class="score-breakdown" id="rc-breakdown"></div>
            </div>

            <div class="riskcat-info-card">
              <h3>How Scoring Works</h3>
              <ul>
                <li>Each factor contributes weighted points based on its impact on event safety risk</li>
                <li><strong>0–25%:</strong> Low Risk — standard planning applies</li>
                <li><strong>26–50%:</strong> Medium Risk — enhanced safety planning recommended</li>
                <li><strong>51%+:</strong> High Risk — full safety, security & medical plan required, consider formal risk categorization sign-off</li>
                <li>The score updates live as you complete the form</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
    await this.loadEvent();
    await this.loadEventStaff();
    await this.loadAssessment();
    this.setupEventListeners();
    this.calculateAndRender();
  }

  async loadEvent() {
    try {
      const { data } = await supabase.from('events').select('*').eq('id', this.eventId).single();
      this.eventData = data;
      if (data?.expected_attendance) {
        document.getElementById('rc-attendance').value = data.expected_attendance;
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  }

  async loadEventStaff() {
    try {
      const { data, error } = await supabase
        .from('event_staff')
        .select(`
          id,
          name,
          staff_roles ( role )
        `)
        .eq('event_id', this.eventId)
        .order('name', { ascending: true });

      if (error) throw error;

      this.eventStaff = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        roles: (s.staff_roles || []).map(r => r.role)
      }));

      this.populateSafetyOfficerDropdown();
    } catch (error) {
      console.error('Error loading event staff:', error);
      this.eventStaff = [];
    }
  }

  populateSafetyOfficerDropdown() {
    const select = document.getElementById('rc-safety-officer-select');
    if (!select) return;

    const safetyOfficers = this.eventStaff.filter(s => s.roles.includes('Event Safety Officer'));
    const otherStaff = this.eventStaff.filter(s => !s.roles.includes('Event Safety Officer'));

    let optionsHtml = '<option value="">Select from Staff Management...</option>';

    if (safetyOfficers.length > 0) {
      optionsHtml += `<optgroup label="Tagged as Event Safety Officer">
        ${safetyOfficers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </optgroup>`;
    }

    if (otherStaff.length > 0) {
      optionsHtml += `<optgroup label="Other Staff">
        ${otherStaff.map(s => `<option value="${s.id}">${s.name}${s.roles.length ? ' — ' + s.roles.join(', ') : ''}</option>`).join('')}
      </optgroup>`;
    }

    if (this.eventStaff.length === 0) {
      optionsHtml += `<option value="" disabled>No staff loaded yet — add staff in Staff Management</option>`;
    }

    optionsHtml += '<option value="__other__">Other (enter name manually)</option>';

    select.innerHTML = optionsHtml;
  }

  async loadAssessment() {
    try {
      const { data, error } = await supabase
        .from('event_risk_categorization')
        .select('*')
        .eq('event_id', this.eventId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      this.assessment = data;
      document.getElementById('rc-attendance').value = data.expected_attendance ?? '';
      document.getElementById('rc-capacity').value = data.venue_capacity ?? '';
      document.getElementById('rc-vip').checked = !!data.vip_attendance;
      document.getElementById('rc-vip-details').value = data.vip_details ?? '';
      document.getElementById('rc-multiday').checked = !!data.multi_day_event;
      document.getElementById('rc-night').checked = !!data.night_event;
      document.getElementById('rc-historic').value = data.historic_incidents ?? 'none';
      document.getElementById('rc-crime').checked = !!data.crime_trend_concern;
      document.getElementById('rc-experience').checked = data.previous_similar_experience !== false;
      document.getElementById('rc-rivalry').value = data.competitive_rivalry_level ?? 'none';
      document.getElementById('rc-liquor').checked = !!data.liquor_sales;
      document.getElementById('rc-weather').value = data.weather_risk ?? 'low';
      document.getElementById('rc-security').value = data.police_security_availability ?? 'full';
      document.getElementById('rc-certified').checked = data.venue_safety_certified !== false;
      document.getElementById('rc-safety-officer').checked = !!data.event_safety_officer_appointed;

      const officerSelect = document.getElementById('rc-safety-officer-select');
      const officerNameInput = document.getElementById('rc-safety-officer-name');
      if (data.event_safety_officer_staff_id && this.eventStaff.some(s => s.id === data.event_safety_officer_staff_id)) {
        officerSelect.value = data.event_safety_officer_staff_id;
        officerNameInput.style.display = 'none';
        officerNameInput.value = data.event_safety_officer_name ?? '';
      } else if (data.event_safety_officer_name) {
        officerSelect.value = '__other__';
        officerNameInput.style.display = 'block';
        officerNameInput.value = data.event_safety_officer_name;
      } else {
        officerSelect.value = '';
        officerNameInput.style.display = 'none';
        officerNameInput.value = '';
      }

      document.getElementById('rc-notes').value = data.additional_notes ?? '';
      document.getElementById('rc-assessor').value = data.assessed_by_name ?? '';

      document.getElementById('rc-vip-details-wrap').style.display = data.vip_attendance ? 'block' : 'none';
      document.getElementById('rc-safety-officer-name-wrap').style.display = data.event_safety_officer_appointed ? 'block' : 'none';
    } catch (error) {
      console.error('Error loading risk assessment:', error);
    }
  }

  getFormValues() {
    return {
      expected_attendance: parseInt(document.getElementById('rc-attendance').value) || 0,
      venue_capacity: parseInt(document.getElementById('rc-capacity').value) || null,
      vip_attendance: document.getElementById('rc-vip').checked,
      vip_details: document.getElementById('rc-vip-details').value || null,
      multi_day_event: document.getElementById('rc-multiday').checked,
      night_event: document.getElementById('rc-night').checked,
      historic_incidents: document.getElementById('rc-historic').value,
      crime_trend_concern: document.getElementById('rc-crime').checked,
      previous_similar_experience: document.getElementById('rc-experience').checked,
      competitive_rivalry_level: document.getElementById('rc-rivalry').value,
      liquor_sales: document.getElementById('rc-liquor').checked,
      weather_risk: document.getElementById('rc-weather').value,
      police_security_availability: document.getElementById('rc-security').value,
      venue_safety_certified: document.getElementById('rc-certified').checked,
      event_safety_officer_appointed: document.getElementById('rc-safety-officer').checked,
      ...this.getSafetyOfficerValues(),
      additional_notes: document.getElementById('rc-notes').value || null,
      assessed_by_name: document.getElementById('rc-assessor').value || null
    };
  }

  getSafetyOfficerValues() {
    const select = document.getElementById('rc-safety-officer-select');
    const manualInput = document.getElementById('rc-safety-officer-name');
    const selected = select?.value || '';

    if (selected === '__other__') {
      return { event_safety_officer_name: manualInput.value || null, event_safety_officer_staff_id: null };
    }

    if (selected) {
      const staffMember = this.eventStaff.find(s => s.id === selected);
      return {
        event_safety_officer_name: staffMember?.name || null,
        event_safety_officer_staff_id: selected
      };
    }

    return { event_safety_officer_name: null, event_safety_officer_staff_id: null };
  }

  calculateScore(values) {
    const breakdown = [];
    let score = 0;

    // Attendance
    const tier = WEIGHTS.attendance.find(t => values.expected_attendance <= t.max);
    const attPts = tier ? tier.points : 0;
    score += attPts;
    if (attPts > 0) breakdown.push({ label: `Expected attendance (${values.expected_attendance.toLocaleString()})`, points: attPts });

    // VIP
    if (values.vip_attendance) {
      score += WEIGHTS.vip_attendance;
      breakdown.push({ label: 'VIP / VVIP attendance', points: WEIGHTS.vip_attendance });
    }

    // Historic incidents
    const histPts = WEIGHTS.historic_incidents[values.historic_incidents] || 0;
    score += histPts;
    if (histPts > 0) breakdown.push({ label: `Historic incidents: ${values.historic_incidents}`, points: histPts });

    // Crime trend
    if (values.crime_trend_concern) {
      score += WEIGHTS.crime_trend_concern;
      breakdown.push({ label: 'Local crime trend concern', points: WEIGHTS.crime_trend_concern });
    }

    // Liquor
    if (values.liquor_sales) {
      score += WEIGHTS.liquor_sales;
      breakdown.push({ label: 'Alcohol sales / consumption', points: WEIGHTS.liquor_sales });
    }

    // Rivalry
    const rivPts = WEIGHTS.competitive_rivalry_level[values.competitive_rivalry_level] || 0;
    score += rivPts;
    if (rivPts > 0) breakdown.push({ label: `Crowd rivalry/tension: ${values.competitive_rivalry_level}`, points: rivPts });

    // Weather
    const weatherPts = WEIGHTS.weather_risk[values.weather_risk] || 0;
    score += weatherPts;
    if (weatherPts > 0) breakdown.push({ label: `Weather risk: ${values.weather_risk}`, points: weatherPts });

    // Security availability
    const secPts = WEIGHTS.police_security_availability[values.police_security_availability] || 0;
    score += secPts;
    if (secPts > 0) breakdown.push({ label: `Security coverage: ${values.police_security_availability}`, points: secPts });

    // Venue not certified
    if (!values.venue_safety_certified) {
      score += WEIGHTS.venue_not_certified;
      breakdown.push({ label: 'Venue lacks valid safety certificate', points: WEIGHTS.venue_not_certified });
    }

    // Multi-day
    if (values.multi_day_event) {
      score += WEIGHTS.multi_day_event;
      breakdown.push({ label: 'Multi-day event', points: WEIGHTS.multi_day_event });
    }

    // Night
    if (values.night_event) {
      score += WEIGHTS.night_event;
      breakdown.push({ label: 'Includes night-time hours', points: WEIGHTS.night_event });
    }

    // No experience
    if (!values.previous_similar_experience) {
      score += WEIGHTS.no_previous_experience;
      breakdown.push({ label: 'No prior similar event experience', points: WEIGHTS.no_previous_experience });
    }

    // No safety officer
    if (!values.event_safety_officer_appointed) {
      score += WEIGHTS.no_safety_officer;
      breakdown.push({ label: 'No Event Safety Officer appointed', points: WEIGHTS.no_safety_officer });
    }

    const percentage = Math.round((score / MAX_SCORE) * 100);
    let category = 'low';
    if (percentage > 50) category = 'high';
    else if (percentage > 25) category = 'medium';

    return { rawScore: score, percentage, category, breakdown };
  }

  calculateAndRender() {
    const values = this.getFormValues();
    const result = this.calculateScore(values);

    const scoreValue = document.getElementById('rc-score-value');
    const ring = document.getElementById('rc-score-ring');
    const badge = document.getElementById('rc-category-badge');
    const breakdownEl = document.getElementById('rc-breakdown');

    scoreValue.textContent = `${result.percentage}%`;
    ring.className = `score-ring risk-${result.category}`;
    ring.style.setProperty('--score-deg', `${(result.percentage / 100) * 360}deg`);

    badge.textContent = `${result.category.toUpperCase()} RISK`;
    badge.className = `risk-category-badge risk-${result.category}`;

    if (result.breakdown.length === 0) {
      breakdownEl.innerHTML = '<p class="no-factors">No elevated risk factors identified yet</p>';
    } else {
      breakdownEl.innerHTML = `
        <div class="breakdown-title">Contributing Factors</div>
        ${result.breakdown
          .sort((a, b) => b.points - a.points)
          .map(f => `
            <div class="breakdown-item">
              <span class="breakdown-label">${f.label}</span>
              <span class="breakdown-points">+${f.points}</span>
            </div>
          `).join('')}
      `;
    }

    this._lastResult = result;
    this._lastValues = values;
  }

  setupEventListeners() {
    document.getElementById('riskcat-back-btn').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    // Live recalculation on any input change
    const form = document.getElementById('riskcat-form');
    form.addEventListener('input', () => this.calculateAndRender());
    form.addEventListener('change', () => this.calculateAndRender());

    document.getElementById('rc-vip').addEventListener('change', (e) => {
      document.getElementById('rc-vip-details-wrap').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('rc-safety-officer').addEventListener('change', (e) => {
      document.getElementById('rc-safety-officer-name-wrap').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('rc-safety-officer-select').addEventListener('change', (e) => {
      const manualInput = document.getElementById('rc-safety-officer-name');
      if (e.target.value === '__other__') {
        manualInput.style.display = 'block';
        manualInput.value = '';
        manualInput.focus();
      } else {
        manualInput.style.display = 'none';
        manualInput.value = '';
      }
    });

    document.getElementById('rc-save-draft').addEventListener('click', () => {
      this.saveAssessment('draft');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAssessment('submitted');
    });
  }

  async saveAssessment(status) {
    const values = this.getFormValues();
    const result = this.calculateScore(values);

    const payload = {
      event_id: this.eventId,
      ...values,
      risk_score: result.percentage,
      risk_category: result.category,
      status,
      assessment_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      payload.assessed_by = user?.id || null;

      const { error } = await supabase
        .from('event_risk_categorization')
        .upsert(payload, { onConflict: 'event_id' });

      if (error) throw error;

      this.showToast(
        status === 'submitted'
          ? `✓ Risk assessment finalized: ${result.category.toUpperCase()} RISK (${result.percentage}%)`
          : '✓ Draft saved',
        'success'
      );
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  showToast(text, type) {
    const message = document.createElement('div');
    message.className = `riskcat-toast toast-${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => message.classList.add('show'), 10);
    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => message.remove(), 300);
    }, 3500);
  }

  addStyles() {
    if (document.getElementById('riskcat-styles')) return;
    const style = document.createElement('style');
    style.id = 'riskcat-styles';
    style.textContent = `
      .riskcat-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #0F1419 0%, #1A2332 100%);
        padding: 2rem;
        color: #FFFFFF;
      }

      .riskcat-header {
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

      .riskcat-header h1 {
        margin: 0;
        color: #0099FF;
        font-size: 1.8rem;
      }

      .riskcat-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        align-items: start;
      }

      .riskcat-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .riskcat-card {
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        border: 2px solid #334455;
        border-radius: 12px;
        padding: 1.8rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }

      .riskcat-card h2 {
        margin: 0 0 1.2rem 0;
        color: #00A8E8;
        font-size: 1.2rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.2rem;
        margin-bottom: 1rem;
      }

      .form-row:last-child { margin-bottom: 0; }

      .form-group { display: flex; flex-direction: column; gap: 0.5rem; }

      .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #B0BEC5;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .form-group input[type="text"],
      .form-group input[type="number"],
      .form-group select,
      .form-group textarea {
        padding: 0.7rem;
        border: 2px solid #334455;
        border-radius: 8px;
        background: rgba(255,255,255,0.05);
        color: #FFFFFF;
        font-size: 0.95rem;
        font-family: inherit;
        transition: all 0.3s ease;
      }

      .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
        outline: none;
        border-color: #0099FF;
        box-shadow: 0 0 0 3px rgba(0,153,255,0.15);
      }

      .checkbox-group {
        flex-direction: row;
        align-items: center;
        gap: 0.7rem;
      }

      .checkbox-group input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #0099FF;
      }

      .checkbox-group label {
        text-transform: none;
        font-weight: 500;
        font-size: 0.95rem;
        color: #FFFFFF;
        cursor: pointer;
      }

      .riskcat-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }

      .riskcat-sidebar {
        position: sticky;
        top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .riskcat-score-card, .riskcat-info-card {
        background: linear-gradient(135deg, #1A2332, #2A3F5F);
        border: 2px solid #334455;
        border-radius: 12px;
        padding: 1.8rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }

      .riskcat-score-card h3, .riskcat-info-card h3 {
        margin: 0 0 1.2rem 0;
        color: #0099FF;
        text-align: center;
      }

      .riskcat-info-card h3 { text-align: left; }

      .score-ring-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 1.2rem;
      }

      .score-ring {
        width: 160px;
        height: 160px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        --score-deg: 0deg;
        background: conic-gradient(var(--ring-color, #4CAF50) var(--score-deg), rgba(255,255,255,0.08) var(--score-deg));
        transition: background 0.4s ease;
        position: relative;
      }

      .score-ring::before {
        content: '';
        position: absolute;
        width: 128px;
        height: 128px;
        border-radius: 50%;
        background: #1A2332;
      }

      .score-ring span {
        position: relative;
        z-index: 1;
        font-size: 2rem;
        font-weight: 700;
        color: #FFFFFF;
      }

      .score-ring.risk-low { --ring-color: #4CAF50; }
      .score-ring.risk-medium { --ring-color: #FF9800; }
      .score-ring.risk-high { --ring-color: #FF5252; }

      .risk-category-badge {
        display: block;
        text-align: center;
        padding: 0.7rem;
        border-radius: 8px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-bottom: 1.5rem;
      }

      .risk-category-badge.risk-low {
        background: rgba(76,175,80,0.2);
        color: #4CAF50;
        border: 1px solid #4CAF50;
      }

      .risk-category-badge.risk-medium {
        background: rgba(255,152,0,0.2);
        color: #FF9800;
        border: 1px solid #FF9800;
      }

      .risk-category-badge.risk-high {
        background: rgba(255,82,82,0.2);
        color: #FF6B6B;
        border: 1px solid #FF6B6B;
      }

      .breakdown-title {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #78909C;
        letter-spacing: 0.5px;
        margin-bottom: 0.7rem;
      }

      .breakdown-item {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        font-size: 0.85rem;
      }

      .breakdown-label { color: #B0BEC5; }
      .breakdown-points { color: #FF9800; font-weight: 700; white-space: nowrap; }

      .no-factors {
        text-align: center;
        color: #78909C;
        font-size: 0.9rem;
        padding: 1rem 0;
      }

      .riskcat-info-card ul {
        margin: 0;
        padding-left: 1.2rem;
        color: #B0BEC5;
        font-size: 0.88rem;
        line-height: 1.7;
      }

      .riskcat-info-card li { margin-bottom: 0.5rem; }
      .riskcat-info-card strong { color: #00A8E8; }

      .riskcat-toast {
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

      .riskcat-toast.show { transform: translateY(0); }

      .riskcat-toast.toast-success {
        background: rgba(76,175,80,0.15);
        color: #4CAF50;
        border-left-color: #4CAF50;
      }

      .riskcat-toast.toast-error {
        background: rgba(255,82,82,0.15);
        color: #FFB3B3;
        border-left-color: #FF6B6B;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: 2px solid transparent;
        border-radius: 8px;
        font-size: 0.95rem;
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

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0,153,255,0.3);
      }

      .btn-secondary {
        background: rgba(255,255,255,0.1);
        color: #FFFFFF;
        border-color: #334455;
      }

      .btn-secondary:hover {
        background: rgba(0,168,232,0.15);
        border-color: #0099FF;
        color: #0099FF;
      }

      @media (max-width: 1024px) {
        .riskcat-layout { grid-template-columns: 1fr; }
        .riskcat-sidebar { position: static; }
      }

      @media (max-width: 768px) {
        .riskcat-container { padding: 1rem; }
        .riskcat-header { flex-direction: column; gap: 1rem; align-items: stretch; text-align: center; }
        .riskcat-actions { flex-direction: column; }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {}
}

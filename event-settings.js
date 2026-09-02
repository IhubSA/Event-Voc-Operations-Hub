// Event Settings Manager
// Allows organizers to configure registration and bib number sequences
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell, getOrgId } from './org-branding.js';

export class EventSettings {
  constructor() {
    this.eventId = null;
    this.settings = null;
    this.isSaving = false;
    this.registrationOpen = false;
  }

  async render(eventId, onBack, currentUser, onOpenClubSettings) {
    this.eventId = eventId;

    const container = document.getElementById('app');

    const navbar = new Navbar(currentUser, () => {}, null, onOpenClubSettings);
    const navbarHtml = navbar.render();

    const html = `
      <div class="settings-container">
        <div class="settings-header">
          <h1>⚙️ Event Settings</h1>
          <button class="btn btn-secondary" id="back-settings-btn">← Back</button>
        </div>

        <div class="settings-content">
          <div class="settings-card">
            <h2>🌐 Public Registration</h2>
            <p class="setting-description">Let participants sign themselves up for this race with a public link — no login required.</p>

            <div class="form-group checkbox-group">
              <input type="checkbox" id="registration-open-toggle" />
              <label for="registration-open-toggle">Open this event for public self-registration</label>
            </div>

            <div id="registration-link-box" class="setting-preview" style="display:none;">
              <strong>Public link:</strong>
              <div class="reg-link-row">
                <input type="text" id="registration-link-input" class="setting-input" readonly />
                <button type="button" class="btn btn-secondary btn-sm" id="copy-registration-link-btn">📋 Copy</button>
              </div>
              <p class="setting-description" style="margin-top:0.75rem;">This one link lists every race your club currently has open for registration — share it once and reuse it for future races.</p>
            </div>
          </div>

          <div class="settings-card">
            <h2>Registration Number Format</h2>
            <p class="setting-description">Customize how registration numbers are formatted and numbered</p>

            <div class="form-group">
              <label for="reg-prefix">Prefix (e.g., REG, ENTRY, RUN)</label>
              <input type="text" id="reg-prefix" class="setting-input" maxlength="10" placeholder="REG" />
            </div>

            <div class="form-group">
              <label for="reg-start">Starting Number</label>
              <input type="number" id="reg-start" class="setting-input" min="1" value="1" placeholder="1" />
            </div>

            <div class="setting-preview">
              <strong>Preview:</strong> <span id="reg-preview">REG-001</span>
            </div>
          </div>

          <div class="settings-card">
            <h2>Bib Number Format</h2>
            <p class="setting-description">Customize how bib numbers are formatted and numbered</p>

            <div class="form-group">
              <label for="bib-prefix">Prefix (e.g., BIB, BIB#, RACE)</label>
              <input type="text" id="bib-prefix" class="setting-input" maxlength="10" placeholder="BIB" />
            </div>

            <div class="form-group">
              <label for="bib-start">Starting Number</label>
              <input type="number" id="bib-start" class="setting-input" min="1" value="1" placeholder="1" />
            </div>

            <div class="form-group checkbox-group">
              <input type="checkbox" id="auto-assign-bibs" />
              <label for="auto-assign-bibs">Auto-assign bib numbers to new registrations</label>
            </div>

            <div class="setting-preview">
              <strong>Preview:</strong> <span id="bib-preview">BIB-001</span>
            </div>
          </div>

          <div class="settings-actions">
            <button class="btn btn-primary" id="save-settings-btn">💾 Save Settings</button>
            <button class="btn btn-secondary" id="reset-counters-btn">🔄 Reset Counters</button>
            <button class="btn btn-success" id="bulk-assign-btn">📋 Bulk Assign Bibs to Unassigned</button>
          </div>

          <div id="settings-message" class="settings-message"></div>
        </div>

        <div class="settings-info">
          <h3>How It Works</h3>
          <ul>
            <li><strong>Registration Numbers:</strong> Auto-generated for every new participant registration (public or manual)</li>
            <li><strong>Bib Numbers:</strong> Can be auto-assigned during registration or assigned later via "Bulk Assign" button</li>
            <li><strong>Reset Counters:</strong> Resets numbering back to the starting number (useful if you need to restart)</li>
            <li><strong>Bulk Assign:</strong> Assign bib numbers to all participants who don't have one yet</li>
            <li>Numbers are padded to 3 digits: REG-001, REG-002, REG-100, REG-1000, etc.</li>
          </ul>
        </div>

        <div class="settings-danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <p class="danger-description">These actions are irreversible. Please use with caution.</p>

          <div class="danger-actions">
            <div class="danger-action">
              <div class="danger-info">
                <h4>End Event</h4>
                <p>Mark this event as completed. The event will be archived and no longer active.</p>
              </div>
              <button class="btn btn-warning" id="end-event-btn">🏁 End Event</button>
            </div>

            <div class="danger-action">
              <div class="danger-info">
                <h4>Delete Event</h4>
                <p>Permanently delete this event and all associated data. This cannot be undone.</p>
              </div>
              <button class="btn btn-danger" id="delete-event-btn">🗑️ Delete Event</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = wrapWithShell(navbarHtml, html);
    this.addStyles();
    await this.loadSettings();
    this.setupEventListeners(onBack);
  }

  async loadSettings() {
    try {
      // Public registration flag lives on the event itself
      const { data: eventRow, error: eventError } = await supabase
        .from('events')
        .select('registration_open')
        .eq('id', this.eventId)
        .single();

      if (eventError) throw eventError;
      this.registrationOpen = eventRow?.registration_open || false;

      // Try to get existing settings
      let { data: settings, error } = await supabase
        .from('event_settings')
        .select('*')
        .eq('event_id', this.eventId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no settings exist, create defaults
      if (!settings) {
        const { data: newSettings, error: createError } = await supabase
          .from('event_settings')
          .insert([{
            event_id: this.eventId,
            registration_prefix: 'REG',
            registration_start_number: 1,
            registration_current_number: 0,
            bib_prefix: 'BIB',
            bib_start_number: 1,
            bib_current_number: 0,
            auto_assign_bibs: false
          }])
          .select()
          .single();

        if (createError) throw createError;
        settings = newSettings;
      }

      this.settings = settings;
      this.populateForm();
      this.updatePreviews();
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showMessage('Failed to load event settings', 'error');
    }
  }

  populateForm() {
    document.getElementById('reg-prefix').value = this.settings.registration_prefix || 'REG';
    document.getElementById('reg-start').value = this.settings.registration_start_number || 1;
    document.getElementById('bib-prefix').value = this.settings.bib_prefix || 'BIB';
    document.getElementById('bib-start').value = this.settings.bib_start_number || 1;
    document.getElementById('auto-assign-bibs').checked = this.settings.auto_assign_bibs || false;

    document.getElementById('registration-open-toggle').checked = this.registrationOpen;
    this.updateRegistrationLinkBox();
  }

  updateRegistrationLinkBox() {
    const box = document.getElementById('registration-link-box');
    const linkInput = document.getElementById('registration-link-input');
    if (!box || !linkInput) return;

    if (!this.registrationOpen) {
      box.style.display = 'none';
      return;
    }

    const orgId = getOrgId();
    const link = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}register.html?org=${orgId}`;
    linkInput.value = link;
    box.style.display = 'block';
  }

  updatePreviews() {
    const regPrefix = document.getElementById('reg-prefix').value || 'REG';
    const regStart = document.getElementById('reg-start').value || 1;
    document.getElementById('reg-preview').textContent =
      `${regPrefix}-${String(regStart).padStart(3, '0')}`;

    const bibPrefix = document.getElementById('bib-prefix').value || 'BIB';
    const bibStart = document.getElementById('bib-start').value || 1;
    document.getElementById('bib-preview').textContent =
      `${bibPrefix}-${String(bibStart).padStart(3, '0')}`;
  }

  async handleToggleRegistration(isOpen) {
    const toggle = document.getElementById('registration-open-toggle');
    try {
      const { error } = await supabase
        .from('events')
        .update({ registration_open: isOpen, updated_at: new Date().toISOString() })
        .eq('id', this.eventId);

      if (error) throw error;

      this.registrationOpen = isOpen;
      this.updateRegistrationLinkBox();
      this.showMessage(
        isOpen ? '✓ Public registration is now open for this race!' : '✓ Public registration closed for this race.',
        'success'
      );
    } catch (error) {
      console.error('Error toggling registration:', error);
      this.showMessage(error.message || 'Failed to update registration status', 'error');
      if (toggle) toggle.checked = !isOpen;
    }
  }

  async handleSaveSettings() {
    if (this.isSaving) return;

    const regPrefix = document.getElementById('reg-prefix').value || 'REG';
    const regStart = parseInt(document.getElementById('reg-start').value) || 1;
    const bibPrefix = document.getElementById('bib-prefix').value || 'BIB';
    const bibStart = parseInt(document.getElementById('bib-start').value) || 1;
    const autoAssignBibs = document.getElementById('auto-assign-bibs').checked;

    this.isSaving = true;

    try {
      const { error } = await supabase
        .from('event_settings')
        .update({
          registration_prefix: regPrefix,
          registration_start_number: regStart,
          bib_prefix: bibPrefix,
          bib_start_number: bibStart,
          auto_assign_bibs: autoAssignBibs,
          updated_at: new Date().toISOString()
        })
        .eq('event_id', this.eventId);

      if (error) throw error;

      this.showMessage('✓ Settings saved successfully!', 'success');
      this.updatePreviews();
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showMessage(error.message || 'Failed to save settings', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async handleResetCounters() {
    if (!confirm('Are you sure? This will reset numbering back to the starting number. This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('event_settings')
        .update({
          registration_current_number: 0,
          bib_current_number: 0,
          updated_at: new Date().toISOString()
        })
        .eq('event_id', this.eventId);

      if (error) throw error;

      this.showMessage('✓ Counters reset successfully!', 'success');
      await this.loadSettings();
    } catch (error) {
      console.error('Error resetting counters:', error);
      this.showMessage(error.message || 'Failed to reset counters', 'error');
    }
  }

  async handleBulkAssignBibs() {
    if (!confirm('This will assign bib numbers to all participants without one. Continue?')) {
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('bulk_assign_bibs', {
          p_event_id: this.eventId,
          p_status: 'registered'
        });

      if (error) throw error;

      const count = data ? data.length : 0;
      this.showMessage(`✓ Assigned bib numbers to ${count} participant${count !== 1 ? 's' : ''}!`, 'success');
    } catch (error) {
      console.error('Error bulk assigning bibs:', error);
      this.showMessage(error.message || 'Failed to assign bib numbers', 'error');
    }
  }

  showMessage(message, type) {
    const messageDiv = document.getElementById('settings-message');
    messageDiv.textContent = message;
    messageDiv.className = `settings-message ${type}`;
  }

  setupEventListeners(onBack) {
    // Back button
    document.getElementById('back-settings-btn').addEventListener('click', () => {
      if (onBack) onBack();
    });

    // Public registration toggle
    document.getElementById('registration-open-toggle').addEventListener('change', (e) => {
      this.handleToggleRegistration(e.target.checked);
    });

    document.getElementById('copy-registration-link-btn')?.addEventListener('click', () => {
      const linkInput = document.getElementById('registration-link-input');
      linkInput.select();
      navigator.clipboard?.writeText(linkInput.value).then(() => {
        this.showMessage('✓ Link copied to clipboard!', 'success');
      }).catch(() => {
        this.showMessage('Could not copy automatically — please copy the link manually.', 'error');
      });
    });

    // Preview updates
    ['reg-prefix', 'reg-start', 'bib-prefix', 'bib-start'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        this.updatePreviews();
      });
    });

    // Save settings
    document.getElementById('save-settings-btn').addEventListener('click', () => {
      this.handleSaveSettings();
    });

    // Reset counters
    document.getElementById('reset-counters-btn').addEventListener('click', () => {
      this.handleResetCounters();
    });

    // Bulk assign bibs
    document.getElementById('bulk-assign-btn').addEventListener('click', () => {
      this.handleBulkAssignBibs();
    });

    // End event
    document.getElementById('end-event-btn')?.addEventListener('click', () => {
      this.handleEndEvent();
    });

    // Delete event
    document.getElementById('delete-event-btn')?.addEventListener('click', () => {
      this.handleDeleteEvent();
    });
  }

  async handleEndEvent() {
    if (!confirm('Are you sure you want to end this event? It will be marked as completed.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', this.eventId);

      if (error) throw error;

      this.showMessage('✓ Event ended successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error ending event:', error);
      this.showMessage(error.message || 'Failed to end event', 'error');
    }
  }

  async handleDeleteEvent() {
    if (!confirm('⚠️ WARNING: This will permanently delete this event and all associated data. Are you absolutely sure? Type "DELETE" to confirm.')) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmation !== 'DELETE') {
      this.showMessage('Deletion cancelled.', 'error');
      return;
    }

    try {
      // First delete all event-related data
      await supabase
        .from('event_settings')
        .delete()
        .eq('event_id', this.eventId);

      // Delete the event itself
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', this.eventId);

      if (error) throw error;

      this.showMessage('✓ Event deleted permanently!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error deleting event:', error);
      this.showMessage(error.message || 'Failed to delete event', 'error');
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .settings-container {
        min-height: 100vh;
        background: var(--bg-secondary);
        padding: 2rem 1rem;
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-primary);
        padding: 1.5rem;
        border: 2px solid var(--border-color);
        border-radius: 12px;
        margin-bottom: 2rem;
        box-shadow: var(--shadow-md);
      }

      .settings-header h1 {
        margin: 0;
        color: var(--primary);
        font-size: 1.8rem;
      }

      .settings-content {
        max-width: 900px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .settings-card {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        box-shadow: var(--shadow-md);
      }

      .settings-card h2 {
        margin: 0 0 0.5rem 0;
        color: var(--primary);
        font-size: 1.3rem;
      }

      .setting-description {
        margin: 0 0 1.5rem 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-bottom: 0.5rem;
      }

      .setting-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-size: 0.95rem;
        font-family: inherit;
        transition: all 0.3s ease;
      }

      .setting-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
      }

      .setting-preview {
        background: rgba(0, 153, 255, 0.05);
        border-left: 3px solid var(--primary);
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        color: var(--text-primary);
        font-size: 1rem;
      }

      .setting-preview strong {
        color: var(--primary);
      }

      .reg-link-row {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.75rem;
      }

      .reg-link-row .setting-input {
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
      }

      .setting-preview span {
        font-family: 'Courier New', monospace;
        font-weight: 600;
        color: var(--primary);
      }

      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .checkbox-group input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .checkbox-group label {
        margin: 0;
        text-transform: none;
        letter-spacing: normal;
        cursor: pointer;
      }

      .settings-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .settings-actions .btn {
        flex: 1;
        min-width: 150px;
      }

      .settings-message {
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        display: none;
      }

      .settings-message.success {
        display: block;
        background: rgba(76, 175, 80, 0.1);
        border: 2px solid #4CAF50;
        color: #4CAF50;
      }

      .settings-message.error {
        display: block;
        background: rgba(255, 107, 107, 0.1);
        border: 2px solid #ff6b6b;
        color: #ff6b6b;
      }

      .settings-info {
        background: rgba(0, 153, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .settings-info h3 {
        margin: 0 0 1rem 0;
        color: var(--primary);
      }

      .settings-danger-zone {
        background: linear-gradient(135deg, rgba(255, 82, 82, 0.1), rgba(255, 107, 107, 0.05));
        border: 2px solid #FF6B6B;
        border-radius: 12px;
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .settings-danger-zone h3 {
        margin: 0 0 0.5rem 0;
        color: #FF6B6B;
        font-size: 1.3rem;
      }

      .danger-description {
        margin: 0 0 2rem 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      .danger-actions {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .danger-action {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
      }

      .danger-info h4 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        font-size: 1.1rem;
      }

      .danger-info p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .btn-warning {
        background: linear-gradient(135deg, #FF9800, #FFB74D);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 16px rgba(255, 152, 0, 0.2);
      }

      .btn-warning:hover:not(:disabled) {
        background: linear-gradient(135deg, #F57C00, #FF9800);
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(255, 152, 0, 0.3);
      }

      .btn-danger {
        background: linear-gradient(135deg, #FF6B6B, #FF5252);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 16px rgba(255, 82, 82, 0.2);
      }

      .btn-danger:hover:not(:disabled) {
        background: linear-gradient(135deg, #FF5252, #FF3838);
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(255, 82, 82, 0.3);
      }

      .settings-info ul {
        margin: 0;
        padding: 0 0 0 1.5rem;
        list-style: none;
      }

      .settings-info li {
        margin: 0.75rem 0;
        color: var(--text-primary);
        line-height: 1.6;
      }

      .settings-info li strong {
        color: var(--primary);
      }

      @media (max-width: 768px) {
        .settings-container {
          padding: 1rem;
        }

        .settings-header {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }

        .settings-header h1 {
          font-size: 1.5rem;
        }

        .settings-actions {
          flex-direction: column;
        }

        .settings-actions .btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup if needed
  }
}

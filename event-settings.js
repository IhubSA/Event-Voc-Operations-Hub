// Event Settings Manager
// Allows organizers to configure registration and bib number sequences
import { supabase } from './supabase.js';

export class EventSettings {
  constructor() {
    this.eventId = null;
    this.settings = null;
    this.isSaving = false;
  }

  async render(eventId, onBack) {
    this.eventId = eventId;

    const container = document.getElementById('app');

    const html = `
      <div class="settings-container">
        <div class="settings-header">
          <h1>⚙️ Event Settings</h1>
          <button class="btn btn-secondary" id="back-settings-btn">← Back</button>
        </div>

        <div class="settings-content">
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
      </div>
    `;

    container.innerHTML = html;
    this.addStyles();
    await this.loadSettings();
    this.setupEventListeners(onBack);
  }

  async loadSettings() {
    try {
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

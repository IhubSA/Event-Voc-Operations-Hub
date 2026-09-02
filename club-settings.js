// Club Settings Page
// Lets an org owner/admin white-label their club: logo, brand colors and contact details.
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import {
  loadOrgBranding,
  getOrgBranding,
  setOrgBranding,
  canEditClubSettings,
  uploadOrgLogo,
  wrapWithShell
} from './org-branding.js';

export class ClubSettingsPage {
  constructor() {
    this.orgId = null;
    this.currentUser = null;
    this.onBack = null;
    this.selectedLogoFile = null;
    this.isSaving = false;
  }

  async render(orgId, currentUser, onBack) {
    this.orgId = orgId;
    this.currentUser = currentUser;
    this.onBack = onBack;

    const container = document.getElementById('app');

    // Make sure we have the freshest copy of the org's branding
    await loadOrgBranding(orgId, currentUser?.id);
    const org = getOrgBranding();

    if (!canEditClubSettings()) {
      container.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0F1419; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="text-align: center; max-width: 400px;">
            <h1 style="margin: 0 0 1rem 0;">Access Denied</h1>
            <p style="color: #B0BEC5;">Only club owners and admins can edit Club Settings.</p>
            <button class="btn btn-secondary" id="cs-denied-back">← Back</button>
          </div>
        </div>
      `;
      document.getElementById('cs-denied-back')?.addEventListener('click', () => this.onBack?.());
      return;
    }

    const navbar = new Navbar(currentUser, () => {
      supabase.auth.signOut();
    });
    const navbarHtml = navbar.render();

    const bodyHtml = `
      <div class="club-settings-page">
        <div class="cs-header">
          <div>
            <h1>⚙️ Club Settings</h1>
            <p>White-label your club's branding &mdash; your logo and details will appear across every module.</p>
          </div>
          <button class="btn btn-secondary" id="cs-back-btn">← Back</button>
        </div>

        <div id="cs-message" class="cs-message" style="display: none;"></div>

        <div class="cs-card">
          <h2>🌐 Public Registration Link</h2>
          <p class="cs-hint" style="margin:0 0 1rem 0;">Share this one link and it will always show whichever of your races currently have public self-registration switched on. Turn registration on or off per race from that race's Event Settings.</p>
          <div class="cs-color-input">
            <input type="text" id="cs-registration-link" class="cs-link-input" readonly value="${escapeAttr(this.registrationLink())}" />
            <button type="button" class="btn btn-secondary btn-sm" id="cs-copy-registration-link">📋 Copy</button>
          </div>
        </div>

        <form id="cs-form" class="cs-form">
          <div class="cs-card">
            <h2>Logo</h2>
            <div class="cs-logo-row">
              <div class="cs-logo-preview" id="cs-logo-preview">
                ${org?.logo_url
                  ? `<img src="${org.logo_url}" alt="Current logo" id="cs-logo-img" />`
                  : `<div class="cs-logo-placeholder" id="cs-logo-img">${(org?.name || 'C').trim().charAt(0).toUpperCase() || 'C'}</div>`}
              </div>
              <div class="cs-logo-controls">
                <label for="cs-logo-input" class="btn btn-secondary btn-sm">📤 Choose Logo Image</label>
                <input type="file" id="cs-logo-input" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" style="display:none;" />
                <p class="cs-hint">PNG, JPG, WEBP, SVG or GIF. Max 2MB. Displayed in the navigation bar and sidebar across all modules.</p>
              </div>
            </div>
          </div>

          <div class="cs-card">
            <h2>Club Details</h2>
            <div class="cs-grid">
              <div class="form-group">
                <label for="cs-name">Club Name *</label>
                <input type="text" id="cs-name" required value="${escapeAttr(org?.name)}" />
              </div>
              <div class="form-group cs-span-2">
                <label for="cs-description">Description</label>
                <textarea id="cs-description" rows="2">${escapeHtml(org?.description)}</textarea>
              </div>
              <div class="form-group">
                <label for="cs-website">Website</label>
                <input type="text" id="cs-website" placeholder="www.yourclub.com" value="${escapeAttr(org?.website)}" />
              </div>
              <div class="form-group">
                <label for="cs-email">Contact Email</label>
                <input type="email" id="cs-email" value="${escapeAttr(org?.email)}" />
              </div>
              <div class="form-group">
                <label for="cs-phone">Contact Phone</label>
                <input type="text" id="cs-phone" value="${escapeAttr(org?.phone)}" />
              </div>
            </div>
          </div>

          <div class="cs-card">
            <h2>Address</h2>
            <div class="cs-grid">
              <div class="form-group cs-span-2">
                <label for="cs-address">Street Address</label>
                <input type="text" id="cs-address" value="${escapeAttr(org?.address)}" />
              </div>
              <div class="form-group">
                <label for="cs-city">City</label>
                <input type="text" id="cs-city" value="${escapeAttr(org?.city)}" />
              </div>
              <div class="form-group">
                <label for="cs-state">Province / State</label>
                <input type="text" id="cs-state" value="${escapeAttr(org?.state)}" />
              </div>
              <div class="form-group">
                <label for="cs-postal">Postal Code</label>
                <input type="text" id="cs-postal" value="${escapeAttr(org?.postal_code)}" />
              </div>
              <div class="form-group">
                <label for="cs-country">Country</label>
                <input type="text" id="cs-country" value="${escapeAttr(org?.country)}" />
              </div>
            </div>
          </div>

          <div class="cs-card">
            <h2>Brand Colors</h2>
            <div class="cs-grid cs-colors">
              <div class="form-group">
                <label for="cs-primary-color">Primary</label>
                <div class="cs-color-input">
                  <input type="color" id="cs-primary-color-picker" value="${escapeAttr(org?.primary_color) || '#0099FF'}" />
                  <input type="text" id="cs-primary-color" value="${escapeAttr(org?.primary_color) || '#0099FF'}" />
                </div>
              </div>
              <div class="form-group">
                <label for="cs-secondary-color">Secondary</label>
                <div class="cs-color-input">
                  <input type="color" id="cs-secondary-color-picker" value="${escapeAttr(org?.secondary_color) || '#003366'}" />
                  <input type="text" id="cs-secondary-color" value="${escapeAttr(org?.secondary_color) || '#003366'}" />
                </div>
              </div>
              <div class="form-group">
                <label for="cs-accent-color">Accent</label>
                <div class="cs-color-input">
                  <input type="color" id="cs-accent-color-picker" value="${escapeAttr(org?.accent_color) || '#FF6B35'}" />
                  <input type="text" id="cs-accent-color" value="${escapeAttr(org?.accent_color) || '#FF6B35'}" />
                </div>
              </div>
            </div>
          </div>

          <div class="cs-actions">
            <button type="button" class="btn btn-secondary" id="cs-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="cs-save-btn">💾 Save Changes</button>
          </div>
        </form>
      </div>
    `;

    container.innerHTML = wrapWithShell(navbarHtml, bodyHtml);

    this.addStyles();
    this.attachEvents();
  }

  registrationLink() {
    const base = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`;
    return `${base}register.html?org=${this.orgId}`;
  }

  attachEvents() {
    document.getElementById('cs-back-btn')?.addEventListener('click', () => this.onBack?.());
    document.getElementById('cs-cancel-btn')?.addEventListener('click', () => this.onBack?.());

    document.getElementById('cs-copy-registration-link')?.addEventListener('click', () => {
      const input = document.getElementById('cs-registration-link');
      input.select();
      navigator.clipboard?.writeText(input.value).then(() => {
        this.showMessage('✓ Registration link copied to clipboard!', 'success');
      }).catch(() => {
        this.showMessage('Could not copy automatically — please copy the link manually.', 'error');
      });
    });

    const logoInput = document.getElementById('cs-logo-input');
    logoInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        this.showMessage('Logo file is too large. Please choose an image under 2MB.', 'error');
        logoInput.value = '';
        return;
      }

      this.selectedLogoFile = file;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('cs-logo-preview');
        preview.innerHTML = `<img src="${ev.target.result}" alt="Logo preview" />`;
      };
      reader.readAsDataURL(file);
    });

    // Keep color picker + text input in sync
    ['primary', 'secondary', 'accent'].forEach((key) => {
      const picker = document.getElementById(`cs-${key}-color-picker`);
      const text = document.getElementById(`cs-${key}-color`);
      picker?.addEventListener('input', () => { text.value = picker.value; });
      text?.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) {
          picker.value = text.value;
        }
      });
    });

    document.getElementById('cs-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });
  }

  async handleSave() {
    if (this.isSaving) return;
    this.isSaving = true;

    const saveBtn = document.getElementById('cs-save-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      let logoUrl = getOrgBranding()?.logo_url || null;

      if (this.selectedLogoFile) {
        logoUrl = await uploadOrgLogo(this.orgId, this.selectedLogoFile);
      }

      const payload = {
        name: document.getElementById('cs-name').value.trim(),
        description: document.getElementById('cs-description').value.trim() || null,
        website: document.getElementById('cs-website').value.trim() || null,
        email: document.getElementById('cs-email').value.trim() || null,
        phone: document.getElementById('cs-phone').value.trim() || null,
        address: document.getElementById('cs-address').value.trim() || null,
        city: document.getElementById('cs-city').value.trim() || null,
        state: document.getElementById('cs-state').value.trim() || null,
        postal_code: document.getElementById('cs-postal').value.trim() || null,
        country: document.getElementById('cs-country').value.trim() || null,
        primary_color: document.getElementById('cs-primary-color').value.trim() || null,
        secondary_color: document.getElementById('cs-secondary-color').value.trim() || null,
        accent_color: document.getElementById('cs-accent-color').value.trim() || null,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };

      if (!payload.name) {
        throw new Error('Club name is required.');
      }

      const { data: updated, error } = await supabase
        .from('organizations')
        .update(payload)
        .eq('id', this.orgId)
        .select()
        .single();

      if (error) throw error;

      setOrgBranding(updated);
      this.selectedLogoFile = null;
      this.showMessage('✓ Club settings saved. Your branding is now live across all modules.', 'success');

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Changes';
      }
    } catch (error) {
      console.error('Error saving club settings:', error);
      this.showMessage(`Failed to save: ${error.message}`, 'error');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Changes';
      }
    } finally {
      this.isSaving = false;
    }
  }

  showMessage(text, type) {
    const el = document.getElementById('cs-message');
    if (!el) return;
    el.textContent = text;
    el.className = `cs-message cs-message-${type}`;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  addStyles() {
    if (document.getElementById('club-settings-styles')) return;

    const style = document.createElement('style');
    style.id = 'club-settings-styles';
    style.textContent = `
      .club-settings-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 2.5rem 2rem;
      }

      .cs-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .cs-header h1 {
        margin: 0 0 0.4rem 0;
        color: #0099FF;
        font-size: 2rem;
      }

      .cs-header p {
        margin: 0;
        color: #B0BEC5;
      }

      .cs-message {
        padding: 1rem 1.25rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }

      .cs-message-success {
        background: rgba(76, 175, 80, 0.15);
        border: 1px solid #4CAF50;
        color: #81C784;
      }

      .cs-message-error {
        background: rgba(255, 82, 82, 0.15);
        border: 1px solid #FF6B6B;
        color: #FFB3B3;
      }

      .cs-card {
        background: linear-gradient(135deg, #1A2332 0%, #2A3F5F 100%);
        border: 1px solid #334455;
        border-radius: 12px;
        padding: 1.75rem;
        margin-bottom: 1.5rem;
      }

      .cs-card h2 {
        margin: 0 0 1.25rem 0;
        font-size: 1.1rem;
        color: #fff;
      }

      .cs-logo-row {
        display: flex;
        align-items: center;
        gap: 1.75rem;
        flex-wrap: wrap;
      }

      .cs-logo-preview {
        width: 96px;
        height: 96px;
        flex-shrink: 0;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .cs-logo-preview img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .cs-logo-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        font-weight: 800;
        color: #fff;
        background: linear-gradient(135deg, #0099FF, #00A8E8);
      }

      .cs-logo-controls {
        flex: 1;
        min-width: 220px;
      }

      .cs-hint {
        margin: 0.6rem 0 0 0;
        font-size: 0.8rem;
        color: #78909C;
      }

      .cs-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      .cs-span-2 {
        grid-column: span 2;
      }

      .cs-colors {
        grid-template-columns: repeat(3, 1fr);
      }

      .cs-color-input {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .cs-color-input input[type="color"] {
        width: 42px;
        height: 42px;
        padding: 2px;
        border-radius: 8px;
        border: 1px solid #334455;
        background: transparent;
        cursor: pointer;
        flex-shrink: 0;
      }

      .cs-color-input input[type="text"] {
        flex: 1;
        min-width: 0;
      }

      .cs-form .form-group label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #B0BEC5;
        margin-bottom: 0.4rem;
      }

      .cs-form .form-group input,
      .cs-form .form-group textarea {
        width: 100%;
        padding: 0.65rem 0.85rem;
        border-radius: 8px;
        border: 1px solid #334455;
        background: #0F1419;
        color: #fff;
        font-family: inherit;
        font-size: 0.9rem;
        box-sizing: border-box;
      }

      .cs-form .form-group textarea {
        resize: vertical;
      }

      .cs-form .form-group input:focus,
      .cs-form .form-group textarea:focus {
        outline: none;
        border-color: #0099FF;
      }

      .cs-link-input {
        flex: 1;
        padding: 0.65rem 0.85rem;
        border-radius: 8px;
        border: 1px solid #334455;
        background: #0F1419;
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        box-sizing: border-box;
        min-width: 0;
      }

      .cs-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1rem;
      }

      @media (max-width: 640px) {
        .club-settings-page {
          padding: 1.5rem 1rem;
        }

        .cs-header {
          flex-direction: column;
        }

        .cs-grid,
        .cs-colors {
          grid-template-columns: 1fr;
        }

        .cs-span-2 {
          grid-column: span 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}

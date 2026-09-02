// Public Vendor Registration + Document Upload
// Entry point for a vendor's unique invite link (vendor-registration.html?vendor=<id>).
// The link itself is the vendor's credential (capability-link pattern, same
// as the participant registration link) -- no login required. Staff already
// created the vendor row with basic contact info; this page lets the vendor
// confirm/complete their details and upload the fixed document checklist
// for their category.
import { supabase } from './supabase.js';
import { escapeHtml, normalizeUrl, renderClubContactLine } from './public-registration.js';
import { VENDOR_CATEGORIES, getCategoryLabel, getCategoryIcon } from './vendor-categories.js';

export class VendorRegistration {
  constructor() {
    this.vendorId = null;
    this.info = null; // flattened row from get_public_vendor_info
    this.documents = [];
  }

  async render(vendorId) {
    this.vendorId = vendorId;
    const container = document.getElementById('app');

    if (!vendorId) {
      container.innerHTML = this.errorScreen(
        'Link incomplete',
        'This vendor link is missing its reference. Please use the link the organizer sent you.'
      );
      this.addStyles();
      return;
    }

    container.innerHTML = `<div class="pubreg-loading">Loading…</div>`;
    this.addStyles();

    try {
      const { data: rows, error } = await supabase.rpc('get_public_vendor_info', { p_vendor_id: vendorId });
      if (error) throw error;

      const info = Array.isArray(rows) ? rows[0] : rows;
      if (!info) {
        container.innerHTML = this.errorScreen(
          'Vendor not found',
          'We couldn’t find a vendor registration for this link. Please check the link or contact the event organizer.'
        );
        return;
      }

      this.info = info;
      await this.loadDocuments();
      this.renderPage();
    } catch (error) {
      console.error('Error loading vendor registration page:', error);
      container.innerHTML = this.errorScreen(
        'Something went wrong',
        error.message || 'Please try again in a moment.'
      );
    }
  }

  branding() {
    const i = this.info;
    return {
      name: i.org_name,
      logo_url: i.org_logo_url,
      description: i.org_description,
      phone: i.org_phone,
      email: i.org_email,
      website: i.org_website,
      address: i.org_address,
      city: i.org_city,
      state: i.org_state,
      postal_code: i.org_postal_code,
      country: i.org_country
    };
  }

  renderHeader() {
    const b = this.branding();
    const logo = b.logo_url
      ? `<img src="${escapeHtml(b.logo_url)}" alt="${escapeHtml(b.name || 'Club')} logo" class="pubreg-logo" />`
      : `<div class="pubreg-logo pubreg-logo-placeholder">${escapeHtml((b.name || 'C').trim().charAt(0).toUpperCase() || 'C')}</div>`;

    return `
      <header class="pubreg-header">
        ${logo}
        <div>
          <h1>${escapeHtml(b.name || 'Vendor Registration')}</h1>
          <p>${escapeHtml(this.info.event_name || '')}</p>
          ${renderClubContactLine(b)}
        </div>
      </header>
    `;
  }

  async loadDocuments() {
    const { data, error } = await supabase.rpc('get_vendor_documents', { p_vendor_id: this.vendorId });
    if (error) throw error;
    this.documents = data || [];
  }

  renderPage() {
    const container = document.getElementById('app');
    const info = this.info;
    const locked = info.status === 'approved';

    const statusClass = info.status === 'approved' ? 'approved' :
                       info.status === 'rejected' ? 'rejected' :
                       info.status === 'submitted' ? 'submitted' : 'invited';

    const statusMessages = {
      invited: 'Please complete your details below and upload the required documents.',
      submitted: 'Thanks — your registration is in for review. You can still update your details or documents below.',
      approved: 'Your registration has been approved. Contact the event organizer if anything needs to change.',
      rejected: 'Your registration was not approved. Please review the notes below, update your details/documents, and resubmit.'
    };

    container.innerHTML = `
      <div class="pubreg-page">
        ${this.renderHeader()}

        <div class="vendorreg-status-banner ${statusClass}">
          <span class="status-badge ${statusClass}">${info.status.toUpperCase()}</span>
          <span>${statusMessages[info.status] || ''}</span>
        </div>

        <div class="vendorreg-card">
          <h2>${getCategoryIcon(info.category)} ${escapeHtml(getCategoryLabel(info.category))} Registration</h2>

          <form id="vendor-details-form" class="vendorreg-form">
            <div class="form-group">
              <label for="vr-business-name">Business Name *</label>
              <input type="text" id="vr-business-name" required value="${escapeHtml(info.business_name || '')}" ${locked ? 'disabled' : ''} />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="vr-contact-name">Contact Name *</label>
                <input type="text" id="vr-contact-name" required value="${escapeHtml(info.contact_name || '')}" ${locked ? 'disabled' : ''} />
              </div>
              <div class="form-group">
                <label for="vr-contact-phone">Contact Phone</label>
                <input type="tel" id="vr-contact-phone" value="${escapeHtml(info.contact_phone || '')}" ${locked ? 'disabled' : ''} />
              </div>
            </div>

            <div class="form-group">
              <label for="vr-contact-email">Contact Email *</label>
              <input type="email" id="vr-contact-email" required value="${escapeHtml(info.contact_email || '')}" ${locked ? 'disabled' : ''} />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="vr-reg-number">Company/Registration Number</label>
                <input type="text" id="vr-reg-number" value="${escapeHtml(info.registration_number || '')}" ${locked ? 'disabled' : ''} />
              </div>
              <div class="form-group">
                <label for="vr-address">Business Address</label>
                <input type="text" id="vr-address" value="${escapeHtml(info.address || '')}" ${locked ? 'disabled' : ''} />
              </div>
            </div>

            <div class="form-group">
              <label for="vr-additional-info">Additional Information</label>
              <textarea id="vr-additional-info" placeholder="Anything else the organizer should know" ${locked ? 'disabled' : ''}>${escapeHtml(info.additional_info || '')}</textarea>
            </div>

            <div id="vr-form-message" class="add-message"></div>

            ${!locked ? `
              <div class="vendorreg-form-actions">
                <button type="submit" class="btn btn-primary" id="vr-save-btn">Save Details</button>
              </div>
            ` : ''}
          </form>
        </div>

        <div class="vendorreg-card">
          <h2>📄 Required Documents</h2>
          <p class="vendorreg-doc-intro">Upload each document below. PDF, PNG or JPEG, up to 10MB. Re-uploading a document replaces the previous file and sends it back for review.</p>
          <div class="doc-checklist" id="vr-doc-checklist">
            ${this.renderDocChecklist()}
          </div>
        </div>
      </div>
    `;

    this.setupFormListeners();
    this.setupDocListeners();
  }

  renderDocChecklist() {
    const meta = VENDOR_CATEGORIES[this.info.category] || VENDOR_CATEGORIES.other;

    return meta.documents.map(docDef => {
      const doc = this.documents.find(d => d.document_key === docDef.key);
      let docStatusClass = 'not-uploaded';
      let docStatusLabel = 'Not uploaded';
      if (doc) {
        docStatusClass = doc.status;
        docStatusLabel = doc.status.charAt(0).toUpperCase() + doc.status.slice(1);
      }

      return `
        <div class="doc-row" data-doc-key="${docDef.key}">
          <div class="doc-row-info">
            <span class="doc-row-label">${escapeHtml(docDef.label)}${docDef.required ? ' <span class="required-star">*</span>' : ''}</span>
            <span class="doc-status-badge ${docStatusClass}">${docStatusLabel}</span>
            ${doc && doc.file_name ? `<span class="doc-filename">${escapeHtml(doc.file_name)}</span>` : ''}
            ${doc && doc.status === 'rejected' ? `<span class="doc-review-notes">This document needs to be re-uploaded.</span>` : ''}
          </div>
          <div class="doc-row-actions">
            <label class="btn btn-sm btn-secondary doc-upload-label" for="upload-${docDef.key}">${doc ? 'Replace' : 'Upload'}</label>
            <input type="file" id="upload-${docDef.key}" class="doc-upload-input" data-doc-key="${docDef.key}" data-doc-label="${escapeHtml(docDef.label)}" accept=".pdf,.png,.jpg,.jpeg" style="display:none;" />
          </div>
        </div>
      `;
    }).join('');
  }

  setupFormListeners() {
    const form = document.getElementById('vendor-details-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  setupDocListeners() {
    document.querySelectorAll('.doc-upload-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleUpload(input.dataset.docKey, input.dataset.docLabel, file);
      });
    });
  }

  async handleSubmit() {
    const messageDiv = document.getElementById('vr-form-message');
    const saveBtn = document.getElementById('vr-save-btn');

    messageDiv.textContent = '';
    messageDiv.className = 'add-message';

    const businessName = document.getElementById('vr-business-name').value.trim();
    const contactName = document.getElementById('vr-contact-name').value.trim();
    const contactEmail = document.getElementById('vr-contact-email').value.trim();
    const contactPhone = document.getElementById('vr-contact-phone').value.trim();
    const regNumber = document.getElementById('vr-reg-number').value.trim();
    const address = document.getElementById('vr-address').value.trim();
    const additionalInfo = document.getElementById('vr-additional-info').value.trim();

    if (!businessName || !contactName || !contactEmail) {
      messageDiv.className = 'add-message error';
      messageDiv.textContent = 'Business name, contact name and contact email are required.';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const { error } = await supabase.rpc('submit_vendor_registration', {
        p_vendor_id: this.vendorId,
        p_business_name: businessName,
        p_contact_name: contactName,
        p_contact_email: contactEmail,
        p_contact_phone: contactPhone || null,
        p_registration_number: regNumber || null,
        p_address: address || null,
        p_additional_info: additionalInfo || null
      });

      if (error) throw error;

      messageDiv.className = 'add-message success';
      messageDiv.textContent = '✓ Details saved.';

      // Refresh vendor info (status may now be "submitted") and re-render.
      const { data: rows } = await supabase.rpc('get_public_vendor_info', { p_vendor_id: this.vendorId });
      const info = Array.isArray(rows) ? rows[0] : rows;
      if (info) this.info = info;

      this.renderPage();
    } catch (error) {
      console.error('Error saving vendor details:', error);
      messageDiv.className = 'add-message error';
      messageDiv.textContent = error.message || 'Failed to save details. Please try again.';
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Details';
    }
  }

  async handleUpload(docKey, docLabel, file) {
    const row = document.querySelector(`.doc-row[data-doc-key="${docKey}"]`);
    const label = row?.querySelector('.doc-upload-label');
    const originalLabel = label ? label.textContent : '';
    if (label) label.textContent = 'Uploading...';

    if (file.size > 10 * 1024 * 1024) {
      alert('That file is larger than 10MB. Please choose a smaller file.');
      if (label) label.textContent = originalLabel;
      return;
    }

    try {
      const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
      const path = `${this.vendorId}/${docKey}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { error: recordError } = await supabase.rpc('record_vendor_document', {
        p_vendor_id: this.vendorId,
        p_document_key: docKey,
        p_document_label: docLabel,
        p_file_path: path,
        p_file_name: file.name
      });

      if (recordError) throw recordError;

      await this.loadDocuments();
      document.getElementById('vr-doc-checklist').innerHTML = this.renderDocChecklist();
      this.setupDocListeners();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error.message || 'Failed to upload document. Please try again.');
      if (label) label.textContent = originalLabel;
    }
  }

  errorScreen(title, message) {
    return `
      <div class="pubreg-page">
        <div class="pubreg-empty">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  addStyles() {
    if (document.getElementById('vendor-registration-styles')) return;

    const style = document.createElement('style');
    style.id = 'vendor-registration-styles';
    style.textContent = `
      body { background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); }

      .pubreg-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 1.1rem; }

      .pubreg-page { min-height: 100vh; max-width: 800px; margin: 0 auto; padding: 2.5rem 1.5rem; }

      .pubreg-empty { text-align: center; padding: 4rem 1rem; color: var(--text-secondary); }
      .pubreg-empty h2 { color: var(--text-primary); margin-bottom: 0.75rem; }

      .pubreg-header { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem; }

      .pubreg-logo {
        width: 64px; height: 64px; object-fit: contain; border-radius: 10px;
        background: rgba(255, 255, 255, 0.06); padding: 0.4rem; flex-shrink: 0;
      }

      .pubreg-logo-placeholder {
        display: flex; align-items: center; justify-content: center;
        font-size: 1.75rem; font-weight: 800; color: #fff;
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
      }

      .pubreg-header h1 { margin: 0 0 0.3rem 0; color: var(--text-primary); font-size: 1.6rem; }
      .pubreg-header p { margin: 0; color: var(--text-secondary); }

      .pubreg-contact-line { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin-top: 0.5rem; }
      .pubreg-contact-item { font-size: 0.85rem; color: var(--text-secondary); }
      .pubreg-contact-item a { color: var(--primary); text-decoration: none; }

      .vendorreg-status-banner {
        display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        padding: 1rem 1.25rem; border-radius: 10px; margin-bottom: 1.5rem;
        background: rgba(0, 153, 255, 0.06); border: 2px solid var(--border-color);
        color: var(--text-secondary); font-size: 0.9rem;
      }

      .vendorreg-card {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.75rem;
        margin-bottom: 1.5rem;
      }

      .vendorreg-card h2 { margin: 0 0 1.25rem 0; color: var(--primary); font-size: 1.2rem; }

      .vendorreg-doc-intro { color: var(--text-secondary); font-size: 0.85rem; margin: -0.5rem 0 1.25rem 0; line-height: 1.5; }

      .vendorreg-form { display: flex; flex-direction: column; gap: 1rem; }
      .vendorreg-form .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .vendorreg-form .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
      .vendorreg-form label { color: var(--text-primary); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.3px; }
      .vendorreg-form input, .vendorreg-form textarea {
        padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px;
        background: rgba(255, 255, 255, 0.05); color: var(--text-primary);
        font-size: 0.9rem; font-family: inherit;
      }
      .vendorreg-form input:disabled, .vendorreg-form textarea:disabled { opacity: 0.6; }
      .vendorreg-form textarea { resize: vertical; min-height: 70px; }

      .vendorreg-form-actions { display: flex; }
      .vendorreg-form-actions .btn { flex: 1; }

      .add-message { padding: 1rem; border-radius: 8px; display: none; }
      .add-message.success { display: block; background: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; color: #4CAF50; }
      .add-message.error { display: block; background: rgba(255, 107, 107, 0.1); border: 2px solid #ff6b6b; color: #ff6b6b; }

      .doc-checklist { display: flex; flex-direction: column; gap: 0.75rem; }

      .doc-row {
        display: flex; justify-content: space-between; align-items: center; gap: 1rem;
        padding: 1rem; background: rgba(0, 153, 255, 0.05); border-radius: 8px; flex-wrap: wrap;
      }

      .doc-row-info { display: flex; flex-direction: column; gap: 0.35rem; }
      .doc-row-label { font-weight: 600; color: var(--text-primary); }
      .required-star { color: #f44336; }
      .doc-filename { font-size: 0.8rem; color: var(--text-secondary); }
      .doc-review-notes { font-size: 0.8rem; color: #f44336; }

      .doc-row-actions { display: flex; gap: 0.5rem; }

      .doc-status-badge {
        display: inline-block; width: fit-content; padding: 0.25rem 0.6rem; border-radius: 6px;
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
      }

      .doc-status-badge.not-uploaded { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
      .doc-status-badge.pending { background: rgba(255, 193, 7, 0.2); color: #FFC107; }
      .doc-status-badge.approved { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
      .doc-status-badge.rejected { background: rgba(244, 67, 54, 0.2); color: #f44336; }

      .status-badge {
        display: inline-block; padding: 0.35rem 0.75rem; border-radius: 6px;
        font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
      }
      .status-badge.invited { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
      .status-badge.submitted { background: rgba(33, 150, 243, 0.2); color: #2196F3; }
      .status-badge.approved { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
      .status-badge.rejected { background: rgba(244, 67, 54, 0.2); color: #f44336; }

      @media (max-width: 640px) {
        .pubreg-page { padding: 1.5rem 1rem; }
        .pubreg-header { flex-direction: column; align-items: flex-start; }
        .vendorreg-form .form-row { grid-template-columns: 1fr; }
        .doc-row { flex-direction: column; align-items: flex-start; }
      }
    `;
    document.head.appendChild(style);
  }
}

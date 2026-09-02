// Vendors Management Module
// Staff interface for registering vendors (food, security, medical, other
// service providers), sending them their unique upload link, and reviewing
// / approving the documents they submit.
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';
import { VENDOR_CATEGORIES, getCategoryLabel, getCategoryIcon, getRequiredDocumentKeys } from './vendor-categories.js';

export class VendorsPage {
  constructor() {
    this.currentEvent = null;
    this.currentUser = null;
    this.onBack = null;
    this.vendorsList = [];
    this.documentCounts = {}; // vendor_id -> { total, approved, requiredTotal, requiredApproved }
    this.currentVendorId = null;
    this.currentVendorDocuments = [];
  }

  async render(eventId, currentUser, onBack, onOpenClubSettings) {
    this.currentEvent = eventId;
    this.currentUser = currentUser;
    this.onBack = onBack;

    const container = document.getElementById('app');

    const navbar = new Navbar(currentUser, () => {}, null, onOpenClubSettings);
    const navbarHtml = navbar.render();

    const categoryOptions = Object.entries(VENDOR_CATEGORIES)
      .map(([key, meta]) => `<option value="${key}">${meta.icon} ${meta.label}</option>`)
      .join('');

    const vendorsHtml = `
      <div class="vendors-dashboard">
        <div class="vendors-header">
          <div class="vendors-header-top">
            <h1>🏪 Vendors Management</h1>
            <button class="btn btn-secondary btn-small" id="back-btn-vendors">← Back to Dashboard</button>
          </div>
        </div>

        <div class="vendors-controls">
          <div class="search-box">
            <input type="text" id="vendor-search-input" placeholder="Search by business name, contact, or email..." />
          </div>
          <div class="filter-controls">
            <select id="vendor-category-filter">
              <option value="">All Categories</option>
              ${categoryOptions}
            </select>
            <select id="vendor-status-filter">
              <option value="">All Status</option>
              <option value="invited">Invited</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button class="btn btn-primary" id="add-vendor-btn">➕ Add Vendor</button>
          </div>
        </div>

        <div class="vendors-content">
          <div class="vendors-stats">
            <div class="stat-card">
              <div class="stat-number" id="vendor-total-count">0</div>
              <div class="stat-label">Total Vendors</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="vendor-submitted-count">0</div>
              <div class="stat-label">Submitted</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="vendor-approved-count">0</div>
              <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="vendor-rejected-count">0</div>
              <div class="stat-label">Rejected</div>
            </div>
          </div>

          <div class="vendors-table">
            <table id="vendors-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="vendors-tbody">
                <tr><td colspan="6" class="loading">Loading vendors...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add Vendor Modal -->
        <div class="vendors-modal" id="add-vendor-modal" style="display: none;">
          <div class="modal-content">
            <button class="modal-close" id="close-add-vendor-modal">&times;</button>
            <h2>Add New Vendor</h2>
            <p class="modal-intro">Enter the vendor's basic contact details. Once added, you'll get a unique link to send them so they can complete their registration and upload documents.</p>

            <form id="add-vendor-form" class="add-vendor-form">
              <div class="form-group">
                <label for="add-vendor-category">Category *</label>
                <select id="add-vendor-category" name="category" required>
                  <option value="">Select a category</option>
                  ${categoryOptions}
                </select>
              </div>

              <div class="form-group">
                <label for="add-vendor-business-name">Business Name *</label>
                <input type="text" id="add-vendor-business-name" name="businessName" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="add-vendor-contact-name">Contact Name *</label>
                  <input type="text" id="add-vendor-contact-name" name="contactName" required />
                </div>
                <div class="form-group">
                  <label for="add-vendor-contact-phone">Contact Phone</label>
                  <input type="tel" id="add-vendor-contact-phone" name="contactPhone" />
                </div>
              </div>

              <div class="form-group">
                <label for="add-vendor-contact-email">Contact Email *</label>
                <input type="email" id="add-vendor-contact-email" name="contactEmail" required />
              </div>

              <div id="add-vendor-message" class="add-message"></div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="cancel-add-vendor-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="submit-add-vendor-btn">Add Vendor</button>
              </div>
            </form>

            <div id="vendor-link-result" class="vendor-link-result" style="display: none;">
              <p class="vendor-link-success">✓ Vendor added! Send them this link to complete registration:</p>
              <div class="vendor-link-box">
                <input type="text" id="vendor-link-input" readonly />
                <button class="btn btn-secondary btn-small" id="copy-vendor-link-btn">Copy Link</button>
              </div>
              <button type="button" class="btn btn-primary" id="done-add-vendor-btn">Done</button>
            </div>
          </div>
        </div>

        <!-- Vendor Detail Modal -->
        <div class="vendors-modal" id="vendor-detail-modal" style="display: none;">
          <div class="modal-content modal-large">
            <button class="modal-close" id="close-vendor-detail-modal">&times;</button>
            <h2 id="vendor-detail-title">Vendor Details</h2>
            <div id="vendor-detail-body"></div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = wrapWithShell(navbarHtml, vendorsHtml);

    this.addStyles();
    await this.loadVendors();
    this.setupEventListeners();
  }

  getInviteLink(vendorId) {
    const base = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`;
    return `${base}vendor-registration.html?vendor=${vendorId}`;
  }

  async loadVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.vendorsList = data || [];

      // Pull document status for all vendors in one go so the table can show
      // a quick "x/y approved" progress indicator.
      if (this.vendorsList.length > 0) {
        const vendorIds = this.vendorsList.map(v => v.id);
        const { data: docs, error: docsError } = await supabase
          .from('vendor_documents')
          .select('vendor_id, status')
          .in('vendor_id', vendorIds);

        if (docsError) throw docsError;

        this.documentCounts = {};
        this.vendorsList.forEach(v => {
          const requiredKeys = getRequiredDocumentKeys(v.category);
          this.documentCounts[v.id] = {
            uploaded: 0,
            approved: 0,
            requiredTotal: requiredKeys.length
          };
        });

        (docs || []).forEach(d => {
          const c = this.documentCounts[d.vendor_id];
          if (!c) return;
          c.uploaded++;
          if (d.status === 'approved') c.approved++;
        });
      } else {
        this.documentCounts = {};
      }

      this.renderVendorsTable();
      this.updateStats();
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  }

  renderVendorsTable() {
    const tbody = document.getElementById('vendors-tbody');
    const searchTerm = document.getElementById('vendor-search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('vendor-category-filter').value;
    const statusFilter = document.getElementById('vendor-status-filter').value;

    let filtered = this.vendorsList;

    if (searchTerm) {
      filtered = filtered.filter(v =>
        (v.business_name || '').toLowerCase().includes(searchTerm) ||
        (v.contact_name || '').toLowerCase().includes(searchTerm) ||
        (v.contact_email || '').toLowerCase().includes(searchTerm)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(v => v.category === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">No vendors found</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(vendor => {
      const counts = this.documentCounts[vendor.id] || { uploaded: 0, approved: 0, requiredTotal: 0 };
      const statusClass = vendor.status === 'approved' ? 'approved' :
                         vendor.status === 'rejected' ? 'rejected' :
                         vendor.status === 'submitted' ? 'submitted' : 'invited';

      return `
        <tr class="vendor-row" data-id="${vendor.id}">
          <td><strong>${escapeHtmlLocal(vendor.business_name)}</strong></td>
          <td>${getCategoryIcon(vendor.category)} ${getCategoryLabel(vendor.category)}</td>
          <td>${escapeHtmlLocal(vendor.contact_name || '')}<br><span class="muted-small">${escapeHtmlLocal(vendor.contact_email || '')}</span></td>
          <td>${counts.approved}/${counts.requiredTotal} required approved</td>
          <td><span class="status-badge ${statusClass}">${vendor.status.toUpperCase()}</span></td>
          <td>
            <button class="btn btn-sm btn-primary" data-view-vendor="${vendor.id}">View</button>
            <button class="btn btn-sm btn-secondary" data-copy-vendor-link="${vendor.id}">Copy Link</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-view-vendor]').forEach(btn => {
      btn.addEventListener('click', () => this.showVendorDetail(btn.dataset.viewVendor));
    });

    tbody.querySelectorAll('[data-copy-vendor-link]').forEach(btn => {
      btn.addEventListener('click', () => this.copyLinkToClipboard(this.getInviteLink(btn.dataset.copyVendorLink), btn));
    });
  }

  updateStats() {
    const total = this.vendorsList.length;
    const submitted = this.vendorsList.filter(v => v.status === 'submitted').length;
    const approved = this.vendorsList.filter(v => v.status === 'approved').length;
    const rejected = this.vendorsList.filter(v => v.status === 'rejected').length;

    document.getElementById('vendor-total-count').textContent = total;
    document.getElementById('vendor-submitted-count').textContent = submitted;
    document.getElementById('vendor-approved-count').textContent = approved;
    document.getElementById('vendor-rejected-count').textContent = rejected;
  }

  async showVendorDetail(vendorId) {
    const vendor = this.vendorsList.find(v => v.id === vendorId);
    if (!vendor) return;

    this.currentVendorId = vendorId;

    const bodyDiv = document.getElementById('vendor-detail-body');
    bodyDiv.innerHTML = '<p class="loading">Loading documents...</p>';
    document.getElementById('vendor-detail-title').textContent = vendor.business_name;
    document.getElementById('vendor-detail-modal').style.display = 'flex';

    try {
      const { data: docs, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId);

      if (error) throw error;

      this.currentVendorDocuments = docs || [];
      this.renderVendorDetail(vendor);
    } catch (error) {
      console.error('Error loading vendor documents:', error);
      bodyDiv.innerHTML = '<p class="no-data">Failed to load vendor documents.</p>';
    }
  }

  renderVendorDetail(vendor) {
    const bodyDiv = document.getElementById('vendor-detail-body');
    const meta = VENDOR_CATEGORIES[vendor.category] || VENDOR_CATEGORIES.other;
    const statusClass = vendor.status === 'approved' ? 'approved' :
                       vendor.status === 'rejected' ? 'rejected' :
                       vendor.status === 'submitted' ? 'submitted' : 'invited';

    const requiredKeys = getRequiredDocumentKeys(vendor.category);
    const allRequiredApproved = requiredKeys.length > 0 && requiredKeys.every(key => {
      const doc = this.currentVendorDocuments.find(d => d.document_key === key);
      return doc && doc.status === 'approved';
    });

    const checklistRows = meta.documents.map(docDef => {
      const doc = this.currentVendorDocuments.find(d => d.document_key === docDef.key);
      let docStatusClass = 'not-uploaded';
      let docStatusLabel = 'Not uploaded';
      if (doc) {
        docStatusClass = doc.status;
        docStatusLabel = doc.status.charAt(0).toUpperCase() + doc.status.slice(1);
      }

      return `
        <div class="doc-row" data-doc-key="${docDef.key}">
          <div class="doc-row-info">
            <span class="doc-row-label">${escapeHtmlLocal(docDef.label)}${docDef.required ? ' <span class="required-star">*</span>' : ''}</span>
            <span class="doc-status-badge ${docStatusClass}">${docStatusLabel}</span>
            ${doc && doc.review_notes ? `<div class="doc-review-notes">Note: ${escapeHtmlLocal(doc.review_notes)}</div>` : ''}
          </div>
          <div class="doc-row-actions">
            ${doc ? `
              <button class="btn btn-sm btn-secondary" data-view-doc="${doc.id}" data-path="${escapeHtmlLocal(doc.file_path)}">View</button>
              <button class="btn btn-sm btn-success" data-approve-doc="${doc.id}" ${doc.status === 'approved' ? 'disabled' : ''}>Approve</button>
              <button class="btn btn-sm btn-danger" data-reject-doc="${doc.id}" ${doc.status === 'rejected' ? 'disabled' : ''}>Reject</button>
            ` : `<span class="muted-small">Awaiting upload</span>`}
          </div>
        </div>
      `;
    }).join('');

    bodyDiv.innerHTML = `
      <div class="vendor-detail-section">
        <div class="vendor-status-row">
          <span class="status-badge ${statusClass} large">${vendor.status.toUpperCase()}</span>
          ${!allRequiredApproved ? '<span class="muted-small">Not all required documents are approved yet</span>' : ''}
        </div>
        <div class="detail-item"><span class="label">Category:</span><span class="value">${meta.icon} ${meta.label}</span></div>
        <div class="detail-item"><span class="label">Contact Name:</span><span class="value">${escapeHtmlLocal(vendor.contact_name || '-')}</span></div>
        <div class="detail-item"><span class="label">Contact Email:</span><span class="value">${escapeHtmlLocal(vendor.contact_email || '-')}</span></div>
        <div class="detail-item"><span class="label">Contact Phone:</span><span class="value">${escapeHtmlLocal(vendor.contact_phone || '-')}</span></div>
        ${vendor.registration_number ? `<div class="detail-item"><span class="label">Registration/Reg #:</span><span class="value">${escapeHtmlLocal(vendor.registration_number)}</span></div>` : ''}
        ${vendor.address ? `<div class="detail-item"><span class="label">Address:</span><span class="value">${escapeHtmlLocal(vendor.address)}</span></div>` : ''}
        ${vendor.additional_info ? `<div class="detail-item"><span class="label">Additional Info:</span><span class="value">${escapeHtmlLocal(vendor.additional_info)}</span></div>` : ''}
      </div>

      <div class="vendor-detail-section">
        <h3>Document Checklist</h3>
        <div class="doc-checklist">
          ${checklistRows}
        </div>
      </div>

      <div class="vendor-detail-section internal-notes-section">
        <h3>Internal Notes</h3>
        <textarea id="vendor-internal-notes" placeholder="Notes visible only to staff...">${escapeHtmlLocal(vendor.internal_notes || '')}</textarea>
        <button class="btn btn-secondary btn-small" id="save-internal-notes-btn">Save Notes</button>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="copy-detail-link-btn">Copy Vendor Link</button>
        <button type="button" class="btn btn-success" id="approve-vendor-btn" ${vendor.status === 'approved' ? 'disabled' : ''}>Approve Vendor</button>
        <button type="button" class="btn btn-danger" id="reject-vendor-btn" ${vendor.status === 'rejected' ? 'disabled' : ''}>Reject Vendor</button>
        <button type="button" class="btn btn-danger" id="delete-vendor-btn">Delete</button>
      </div>
    `;

    this.setupDetailListeners(vendor);
  }

  setupDetailListeners(vendor) {
    document.getElementById('copy-detail-link-btn').addEventListener('click', (e) => {
      this.copyLinkToClipboard(this.getInviteLink(vendor.id), e.target);
    });

    document.getElementById('approve-vendor-btn').addEventListener('click', () => {
      this.updateVendorStatus(vendor.id, 'approved');
    });

    document.getElementById('reject-vendor-btn').addEventListener('click', () => {
      this.updateVendorStatus(vendor.id, 'rejected');
    });

    document.getElementById('delete-vendor-btn').addEventListener('click', () => {
      this.deleteVendor(vendor.id);
    });

    document.getElementById('save-internal-notes-btn').addEventListener('click', () => {
      this.saveInternalNotes(vendor.id);
    });

    document.querySelectorAll('[data-approve-doc]').forEach(btn => {
      btn.addEventListener('click', () => this.reviewDocument(btn.dataset.approveDoc, 'approved'));
    });

    document.querySelectorAll('[data-reject-doc]').forEach(btn => {
      btn.addEventListener('click', () => this.reviewDocument(btn.dataset.rejectDoc, 'rejected'));
    });

    document.querySelectorAll('[data-view-doc]').forEach(btn => {
      btn.addEventListener('click', () => this.viewDocument(btn.dataset.path));
    });
  }

  async viewDocument(path) {
    const win = window.open('', '_blank');
    try {
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .createSignedUrl(path, 300);

      if (error) throw error;
      if (win) win.location.href = data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      if (win) win.close();
      alert('Could not open that document.');
    }
  }

  async reviewDocument(docId, status) {
    let reviewNotes = null;
    if (status === 'rejected') {
      reviewNotes = prompt('Optional: add a note explaining why this document is being rejected.') || null;
    }

    try {
      const { error } = await supabase
        .from('vendor_documents')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_by: this.currentUser?.id || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      await this.showVendorDetail(this.currentVendorId);
    } catch (error) {
      console.error('Error reviewing document:', error);
      alert('Failed to update document status.');
    }
  }

  async updateVendorStatus(vendorId, status) {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          status,
          reviewed_by: this.currentUser?.id || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) throw error;

      await this.loadVendors();
      await this.showVendorDetail(vendorId);
    } catch (error) {
      console.error('Error updating vendor status:', error);
      alert('Failed to update vendor status.');
    }
  }

  async saveInternalNotes(vendorId) {
    const notes = document.getElementById('vendor-internal-notes').value;
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ internal_notes: notes || null })
        .eq('id', vendorId);

      if (error) throw error;

      await this.loadVendors();
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes.');
    }
  }

  async deleteVendor(vendorId) {
    if (!confirm('Are you sure you want to delete this vendor and all their uploaded documents? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      document.getElementById('vendor-detail-modal').style.display = 'none';
      await this.loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor.');
    }
  }

  copyLinkToClipboard(link, triggerEl) {
    const done = () => {
      if (!triggerEl) return;
      const original = triggerEl.textContent;
      triggerEl.textContent = '✅ Copied!';
      setTimeout(() => { triggerEl.textContent = original; }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done).catch(() => this.fallbackCopy(link, done));
    } else {
      this.fallbackCopy(link, done);
    }
  }

  fallbackCopy(text, done) {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(temp);
  }

  async handleAddVendor() {
    const form = document.getElementById('add-vendor-form');
    const messageDiv = document.getElementById('add-vendor-message');
    const submitBtn = document.getElementById('submit-add-vendor-btn');

    messageDiv.textContent = '';
    messageDiv.className = 'add-message';

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = {
      event_id: this.currentEvent,
      category: formData.get('category'),
      business_name: formData.get('businessName'),
      contact_name: formData.get('contactName'),
      contact_email: formData.get('contactEmail'),
      contact_phone: formData.get('contactPhone') || null,
      status: 'invited',
      created_by: this.currentUser?.id || null
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
      const { data: inserted, error } = await supabase
        .from('vendors')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      form.style.display = 'none';
      const resultDiv = document.getElementById('vendor-link-result');
      resultDiv.style.display = 'block';
      document.getElementById('vendor-link-input').value = this.getInviteLink(inserted.id);

      await this.loadVendors();
    } catch (error) {
      console.error('Add vendor error:', error);
      messageDiv.className = 'add-message error';
      messageDiv.textContent = error.message || 'Failed to add vendor. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Vendor';
    }
  }

  resetAddVendorModal() {
    const form = document.getElementById('add-vendor-form');
    form.reset();
    form.style.display = 'flex';
    document.getElementById('vendor-link-result').style.display = 'none';
    document.getElementById('add-vendor-message').textContent = '';
    document.getElementById('add-vendor-message').className = 'add-message';
  }

  setupEventListeners() {
    document.getElementById('back-btn-vendors').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    document.getElementById('vendor-search-input').addEventListener('input', () => this.renderVendorsTable());
    document.getElementById('vendor-category-filter').addEventListener('change', () => this.renderVendorsTable());
    document.getElementById('vendor-status-filter').addEventListener('change', () => this.renderVendorsTable());

    document.getElementById('add-vendor-btn').addEventListener('click', () => {
      this.resetAddVendorModal();
      document.getElementById('add-vendor-modal').style.display = 'flex';
    });

    document.getElementById('close-add-vendor-modal').addEventListener('click', () => {
      document.getElementById('add-vendor-modal').style.display = 'none';
    });

    document.getElementById('cancel-add-vendor-btn').addEventListener('click', () => {
      document.getElementById('add-vendor-modal').style.display = 'none';
    });

    document.getElementById('done-add-vendor-btn').addEventListener('click', () => {
      document.getElementById('add-vendor-modal').style.display = 'none';
    });

    document.getElementById('add-vendor-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-vendor-modal') {
        document.getElementById('add-vendor-modal').style.display = 'none';
      }
    });

    document.getElementById('add-vendor-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddVendor();
    });

    document.getElementById('copy-vendor-link-btn').addEventListener('click', (e) => {
      const link = document.getElementById('vendor-link-input').value;
      this.copyLinkToClipboard(link, e.target);
    });

    document.getElementById('close-vendor-detail-modal').addEventListener('click', () => {
      document.getElementById('vendor-detail-modal').style.display = 'none';
    });

    document.getElementById('vendor-detail-modal').addEventListener('click', (e) => {
      if (e.target.id === 'vendor-detail-modal') {
        document.getElementById('vendor-detail-modal').style.display = 'none';
      }
    });
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .vendors-dashboard {
        min-height: calc(100vh - 60px);
        background: var(--bg-secondary);
        padding: 2rem;
      }

      .vendors-header { margin-bottom: 2rem; }

      .vendors-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-primary);
        padding: 1.5rem;
        border: 2px solid var(--border-color);
        border-radius: 12px;
        box-shadow: var(--shadow-md);
        margin-bottom: 1.5rem;
      }

      .vendors-header-top h1 { margin: 0; color: var(--primary); font-size: 2rem; }

      .vendors-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .vendors-controls .search-box { flex: 1; min-width: 250px; }

      .vendors-controls .search-box input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .vendors-controls .filter-controls {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .vendors-controls .filter-controls select {
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
      }

      .vendors-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
      }

      .vendors-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .vendors-stats .stat-card {
        background: rgba(0, 153, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
      }

      .vendors-stats .stat-number { font-size: 2rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; }
      .vendors-stats .stat-label { color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.3px; }

      .vendors-table { overflow-x: auto; }
      .vendors-table table { width: 100%; border-collapse: collapse; }
      .vendors-table thead { background: rgba(0, 153, 255, 0.05); border-bottom: 2px solid var(--border-color); }
      .vendors-table th { padding: 1rem; text-align: left; color: var(--text-primary); font-weight: 600; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.3px; }
      .vendors-table td { padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); vertical-align: middle; }
      .vendor-row:hover { background: rgba(0, 153, 255, 0.05); }

      .muted-small { color: var(--text-secondary); font-size: 0.8rem; }

      .status-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .status-badge.large { font-size: 0.9rem; padding: 0.5rem 1rem; }

      .status-badge.invited { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
      .status-badge.submitted { background: rgba(33, 150, 243, 0.2); color: #2196F3; }
      .status-badge.approved { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
      .status-badge.rejected { background: rgba(244, 67, 54, 0.2); color: #f44336; }

      .loading, .no-data { text-align: center; padding: 2rem; color: var(--text-secondary); }
      .no-data { font-style: italic; }

      .vendors-modal {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000;
      }

      .vendors-modal .modal-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .vendors-modal .modal-content.modal-large { max-width: 750px; }

      .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); float: right; }

      .modal-intro { color: var(--text-secondary); font-size: 0.9rem; margin: -0.5rem 0 1.25rem 0; line-height: 1.5; }

      .add-vendor-form { display: flex; flex-direction: column; gap: 1rem; }
      .add-vendor-form .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .add-vendor-form .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
      .add-vendor-form label { color: var(--text-primary); font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.3px; }
      .add-vendor-form input, .add-vendor-form select, .add-vendor-form textarea {
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-size: 0.9rem;
        font-family: inherit;
      }

      .add-message { padding: 1rem; border-radius: 8px; display: none; }
      .add-message.success { display: block; background: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; color: #4CAF50; }
      .add-message.error { display: block; background: rgba(255, 107, 107, 0.1); border: 2px solid #ff6b6b; color: #ff6b6b; }

      .vendor-link-result { text-align: center; }
      .vendor-link-success { color: #4CAF50; font-weight: 600; margin-bottom: 1rem; }
      .vendor-link-box { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
      .vendor-link-box input {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-size: 0.85rem;
      }

      .vendor-detail-section { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); }
      .vendor-detail-section h3 { margin: 0 0 1rem 0; color: var(--primary); font-size: 1rem; text-transform: uppercase; letter-spacing: 0.3px; }

      .vendor-status-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }

      .detail-item { display: flex; justify-content: space-between; margin-bottom: 0.75rem; gap: 1rem; }
      .detail-item .label { font-weight: 600; color: var(--text-secondary); flex-shrink: 0; }
      .detail-item .value { color: var(--text-primary); text-align: right; }

      .doc-checklist { display: flex; flex-direction: column; gap: 0.75rem; }

      .doc-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(0, 153, 255, 0.05);
        border-radius: 8px;
        flex-wrap: wrap;
      }

      .doc-row-info { display: flex; flex-direction: column; gap: 0.35rem; }
      .doc-row-label { font-weight: 600; color: var(--text-primary); }
      .required-star { color: #f44336; }
      .doc-review-notes { font-size: 0.8rem; color: var(--text-secondary); font-style: italic; }

      .doc-row-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

      .doc-status-badge {
        display: inline-block;
        width: fit-content;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .doc-status-badge.not-uploaded { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
      .doc-status-badge.pending { background: rgba(255, 193, 7, 0.2); color: #FFC107; }
      .doc-status-badge.approved { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
      .doc-status-badge.rejected { background: rgba(244, 67, 54, 0.2); color: #f44336; }

      .internal-notes-section textarea {
        width: 100%;
        min-height: 80px;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-family: inherit;
        margin-bottom: 0.75rem;
        resize: vertical;
      }

      .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color); flex-wrap: wrap; }
      .modal-actions .btn { flex: 1; min-width: 120px; }

      @media (max-width: 768px) {
        .vendors-dashboard { padding: 1rem; }
        .vendors-header-top { flex-direction: column; gap: 1rem; }
        .vendors-controls { flex-direction: column; }
        .vendors-controls .search-box { min-width: unset; }
        .vendors-controls .filter-controls { flex-direction: column; width: 100%; }
        .vendors-controls .filter-controls select { width: 100%; }
        .add-vendor-form .form-row { grid-template-columns: 1fr; }
        .doc-row { flex-direction: column; align-items: flex-start; }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup if needed
  }
}

function escapeHtmlLocal(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

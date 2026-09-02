// Admin Dashboard
// Manages users, organizations, and platform-wide settings

import { supabase } from './supabase.js';

export class AdminDashboard {
  constructor() {
    this.currentView = 'organizations'; // organizations, members, admin-users
    this.organizations = [];
    this.adminUsers = [];
  }

  async render(onBack, onSwitchToOrg) {
    this.onBack = onBack;
    this.onSwitchToOrg = onSwitchToOrg;
    const container = document.getElementById('app');

    const switchOrgButton = onSwitchToOrg ? `<button class="btn btn-primary" id="switch-to-org-btn" style="margin-right: 1rem;">→ Go to Organization</button>` : '';

    const adminHtml = `
      <div class="admin-container">
        <div class="admin-header">
          <div class="admin-title-section">
            <h1>Admin Dashboard</h1>
            <p class="admin-subtitle">Manage organizations, users, and platform settings</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${switchOrgButton}
            <button class="btn btn-secondary" id="back-btn">← Back</button>
          </div>
        </div>

        <div class="admin-nav">
          <button class="admin-nav-btn active" data-view="organizations">
            <span class="nav-icon">🏢</span>
            Organizations
          </button>
          <button class="admin-nav-btn" data-view="members">
            <span class="nav-icon">👥</span>
            Members
          </button>
          <button class="admin-nav-btn" data-view="admin-users">
            <span class="nav-icon">🛡️</span>
            Admin Users
          </button>
        </div>

        <div class="admin-content">
          <div id="organizations-view" class="admin-view active">
            <div class="view-header">
              <h2>Organizations</h2>
              <button class="btn btn-primary" id="create-org-btn">+ Create Organization</button>
            </div>
            <div id="organizations-list" class="admin-list">
              <div class="loading">Loading organizations...</div>
            </div>
          </div>

          <div id="members-view" class="admin-view">
            <div class="view-header">
              <h2>Organization Members</h2>
              <select id="member-org-filter" class="filter-select">
                <option value="">Select organization...</option>
              </select>
            </div>
            <div id="members-list" class="admin-list">
              <div class="loading">Select an organization to view members</div>
            </div>
          </div>

          <div id="admin-users-view" class="admin-view">
            <div class="view-header">
              <h2>Admin Users</h2>
              <button class="btn btn-primary" id="add-admin-btn">+ Add Admin User</button>
            </div>
            <div id="admin-users-list" class="admin-list">
              <div class="loading">Loading admin users...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Organization Modal -->
      <div id="create-org-modal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Create Organization</h2>
            <button class="modal-close" data-modal="create-org-modal">&times;</button>
          </div>
          <form id="create-org-form">
            <div class="form-group">
              <label>Organization Name *</label>
              <input type="text" name="name" required placeholder="e.g., City Marathon Club">
            </div>

            <div class="form-group">
              <label>Type *</label>
              <select name="type" required>
                <option value="">Select type...</option>
                <option value="sports_club">Sports Club</option>
                <option value="event_company">Event Company</option>
              </select>
            </div>

            <div class="form-group">
              <label>Owner Email *</label>
              <input type="email" name="owner_email" required placeholder="owner@example.com">
            </div>

            <div class="form-group">
              <label>Custom Subdomain (optional)</label>
              <div class="subdomain-input">
                <input type="text" name="custom_subdomain" placeholder="myorg" maxlength="50">
                <span>.yoursystem.com</span>
              </div>
            </div>

            <div class="form-group">
              <label>Website (optional)</label>
              <input type="url" name="website" placeholder="https://example.com">
            </div>

            <div class="form-group">
              <label>Email (optional)</label>
              <input type="email" name="email" placeholder="contact@example.com">
            </div>

            <div class="form-group">
              <label>Phone (optional)</label>
              <input type="tel" name="phone" placeholder="+1 (555) 123-4567">
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" data-modal="create-org-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Organization</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Admin User Modal -->
      <div id="add-admin-modal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Add Admin User</h2>
            <button class="modal-close" data-modal="add-admin-modal">&times;</button>
          </div>
          <form id="add-admin-form">
            <div class="form-group">
              <label>User Email *</label>
              <input type="email" name="email" required placeholder="admin@example.com">
            </div>

            <div class="form-group">
              <label>Admin Level *</label>
              <select name="admin_level" required>
                <option value="">Select level...</option>
                <option value="super_admin">Super Admin (Full Access)</option>
                <option value="admin">Admin (Organization Management)</option>
                <option value="moderator">Moderator (Limited Access)</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" data-modal="add-admin-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Admin User</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Organization Modal -->
      <div id="edit-org-modal" class="modal hidden">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h2>Edit Organization</h2>
            <button class="modal-close" data-modal="edit-org-modal">&times;</button>
          </div>
          <form id="edit-org-form">
            <input type="hidden" name="org_id">

            <div class="form-row">
              <div class="form-group">
                <label>Organization Name</label>
                <input type="text" name="name" required>
              </div>
              <div class="form-group">
                <label>Type</label>
                <select name="type" required>
                  <option value="sports_club">Sports Club</option>
                  <option value="event_company">Event Company</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Custom Subdomain</label>
                <div class="subdomain-input">
                  <input type="text" name="custom_subdomain" maxlength="50">
                  <span>.yoursystem.com</span>
                </div>
              </div>
              <div class="form-group">
                <label>Primary Color</label>
                <input type="color" name="primary_color" value="#0099FF">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Website</label>
                <input type="url" name="website" placeholder="https://example.com">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" name="email">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" name="phone">
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" name="city">
              </div>
            </div>

            <div class="form-group">
              <label>Status</label>
              <select name="is_active">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" data-modal="edit-org-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = adminHtml;
    this.addStyles();
    this.setupEventListeners();
    await this.loadData();
  }

  setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    // Switch to organization button
    document.getElementById('switch-to-org-btn')?.addEventListener('click', () => {
      if (this.onSwitchToOrg) this.onSwitchToOrg();
    });

    // Create organization button
    document.getElementById('create-org-btn')?.addEventListener('click', () => {
      this.showModal('create-org-modal');
    });

    // Create organization form
    document.getElementById('create-org-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateOrganization(new FormData(e.target));
    });

    // Add admin user button
    document.getElementById('add-admin-btn')?.addEventListener('click', () => {
      this.showModal('add-admin-modal');
    });

    // Add admin user form
    document.getElementById('add-admin-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddAdminUser(new FormData(e.target));
    });

    // Edit organization form
    document.getElementById('edit-org-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditOrganization(new FormData(e.target));
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.dataset.modal) {
          this.hideModal(e.target.dataset.modal);
        }
      });
    });

    // Member organization filter
    document.getElementById('member-org-filter')?.addEventListener('change', async (e) => {
      if (e.target.value) {
        await this.loadMembers(e.target.value);
      } else {
        document.getElementById('members-list').innerHTML = '<div class="loading">Select an organization to view members</div>';
      }
    });
  }

  switchView(view) {
    // Update nav buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Update views
    document.querySelectorAll('.admin-view').forEach(v => {
      v.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');

    this.currentView = view;
  }

  async loadData() {
    await this.loadOrganizations();
    await this.loadAdminUsers();
  }

  async loadOrganizations() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.organizations = data;
      this.renderOrganizations();
      this.updateOrgFilter();
    } catch (error) {
      console.error('Error loading organizations:', error);
      document.getElementById('organizations-list').innerHTML = `<div class="error">Error loading organizations: ${error.message}</div>`;
    }
  }

  renderOrganizations() {
    const list = document.getElementById('organizations-list');

    if (this.organizations.length === 0) {
      list.innerHTML = '<div class="empty-state">No organizations yet. Create one to get started.</div>';
      return;
    }

    const html = this.organizations.map(org => `
      <div class="admin-card">
        <div class="card-header">
          <h3>${org.name}</h3>
          <span class="badge ${org.is_active ? 'active' : 'inactive'}">
            ${org.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div class="card-content">
          <p><strong>Type:</strong> ${org.type.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Subdomain:</strong> ${org.custom_subdomain || 'Not set'}</p>
          <p><strong>Website:</strong> ${org.website || 'Not set'}</p>
          <p><strong>Created:</strong> ${new Date(org.created_at).toLocaleDateString()}</p>
        </div>
        <div class="card-actions">
          <button class="btn btn-small" onclick="this.closest('.admin-card').dataset.edit='${org.id}'" data-edit-org="${org.id}">Edit</button>
          <button class="btn btn-small btn-danger" data-delete-org="${org.id}">Delete</button>
        </div>
      </div>
    `).join('');

    list.innerHTML = html;

    // Edit buttons
    list.querySelectorAll('[data-edit-org]').forEach(btn => {
      btn.addEventListener('click', () => {
        const orgId = btn.dataset.editOrg;
        this.editOrganization(orgId);
      });
    });

    // Delete buttons
    list.querySelectorAll('[data-delete-org]').forEach(btn => {
      btn.addEventListener('click', () => {
        const orgId = btn.dataset.deleteOrg;
        if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
          this.deleteOrganization(orgId);
        }
      });
    });
  }

  updateOrgFilter() {
    const select = document.getElementById('member-org-filter');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Select organization...</option>';
    this.organizations.forEach(org => {
      const option = document.createElement('option');
      option.value = org.id;
      option.textContent = org.name;
      select.appendChild(option);
    });
    select.value = currentValue;
  }

  async loadMembers(orgId) {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('user_id, role, is_active')
        .eq('org_id', orgId)
        .eq('is_active', true);

      if (error) throw error;

      const list = document.getElementById('members-list');

      if (data.length === 0) {
        list.innerHTML = '<div class="empty-state">No members in this organization.</div>';
        return;
      }

      const html = data.map(member => `
        <div class="admin-card">
          <div class="card-content">
            <p><strong>User: ${member.user_id}</strong></p>
            <p><span class="badge role-${member.role}">${member.role.toUpperCase()}</span></p>
          </div>
          <div class="card-actions">
            <button class="btn btn-small btn-danger" data-remove-member="${member.user_id}">Remove</button>
          </div>
        </div>
      `).join('');

      list.innerHTML = html;

      // Remove buttons
      list.querySelectorAll('[data-remove-member]').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.dataset.removeMember;
          if (confirm('Remove this member from the organization?')) {
            this.removeMember(orgId, userId);
          }
        });
      });
    } catch (error) {
      console.error('Error loading members:', error);
      document.getElementById('members-list').innerHTML = `<div class="error">Error loading members: ${error.message}</div>`;
    }
  }

  async loadAdminUsers() {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.adminUsers = data;
      this.renderAdminUsers();
    } catch (error) {
      console.error('Error loading admin users:', error);
      const list = document.getElementById('admin-users-list');
      if (list) {
        list.innerHTML = `<div class="error">Error loading admin users: ${error.message}</div>`;
      }
    }
  }

  renderAdminUsers() {
    const list = document.getElementById('admin-users-list');

    if (!list) {
      console.warn('admin-users-list element not found in DOM');
      return;
    }

    if (this.adminUsers.length === 0) {
      list.innerHTML = '<div class="empty-state">No admin users yet.</div>';
      return;
    }

    const html = this.adminUsers.map(admin => `
      <div class="admin-card">
        <div class="card-content">
          <p><strong>User ID: ${admin.user_id}</strong></p>
          <p><span class="badge admin-${admin.admin_level}">${admin.admin_level.replace('_', ' ').toUpperCase()}</span></p>
          <p><small>Created: ${new Date(admin.created_at).toLocaleDateString()}</small></p>
        </div>
        <div class="card-actions">
          <button class="btn btn-small btn-danger" data-remove-admin="${admin.id}">Remove</button>
        </div>
      </div>
    `).join('');

    list.innerHTML = html;

    // Remove buttons
    list.querySelectorAll('[data-remove-admin]').forEach(btn => {
      btn.addEventListener('click', () => {
        const adminId = btn.dataset.removeAdmin;
        if (confirm('Remove this admin user?')) {
          this.removeAdminUser(adminId);
        }
      });
    });
  }

  async handleCreateOrganization(formData) {
    try {
      const data = Object.fromEntries(formData);

      // First, create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: data.name,
          type: data.type,
          custom_subdomain: data.custom_subdomain || null,
          website: data.website || null,
          email: data.email || null,
          phone: data.phone || null,
          owner_id: (await supabase.auth.getUser()).data.user.id
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // Then add the owner as a member
      const { error: memberError } = await supabase
        .rpc('add_organization_member', {
          p_org_id: org.id,
          p_user_id: (await supabase.auth.getUser()).data.user.id,
          p_role: 'owner'
        });

      if (memberError) throw memberError;

      this.hideModal('create-org-modal');
      document.getElementById('create-org-form').reset();
      await this.loadData();
      this.showMessage('Organization created successfully!', 'success');
    } catch (error) {
      console.error('Error creating organization:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  async handleAddAdminUser(formData) {
    try {
      const data = Object.fromEntries(formData);

      // For now, require user to provide the UUID (they can get it from auth.users table)
      // Or you can implement proper user lookup via RPC function
      this.showMessage('Note: User must already be registered in the system. Please get their User ID and try again.', 'info');

      // TODO: Implement proper user email lookup via backend RPC function
      this.hideModal('add-admin-modal');
      document.getElementById('add-admin-form').reset();
    } catch (error) {
      console.error('Error adding admin user:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  async handleEditOrganization(formData) {
    try {
      const data = Object.fromEntries(formData);
      const orgId = data.org_id;

      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          type: data.type,
          custom_subdomain: data.custom_subdomain || null,
          primary_color: data.primary_color,
          website: data.website || null,
          email: data.email || null,
          phone: data.phone || null,
          city: data.city || null,
          is_active: data.is_active === 'true'
        })
        .eq('id', orgId);

      if (error) throw error;

      this.hideModal('edit-org-modal');
      await this.loadData();
      this.showMessage('Organization updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating organization:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  editOrganization(orgId) {
    const org = this.organizations.find(o => o.id === orgId);
    if (!org) return;

    const form = document.getElementById('edit-org-form');
    form.querySelector('input[name="org_id"]').value = org.id;
    form.querySelector('input[name="name"]').value = org.name;
    form.querySelector('select[name="type"]').value = org.type;
    form.querySelector('input[name="custom_subdomain"]').value = org.custom_subdomain || '';
    form.querySelector('input[name="primary_color"]').value = org.primary_color;
    form.querySelector('input[name="website"]').value = org.website || '';
    form.querySelector('input[name="email"]').value = org.email || '';
    form.querySelector('input[name="phone"]').value = org.phone || '';
    form.querySelector('input[name="city"]').value = org.city || '';
    form.querySelector('select[name="is_active"]').value = org.is_active ? 'true' : 'false';

    this.showModal('edit-org-modal');
  }

  async deleteOrganization(orgId) {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;

      await this.loadData();
      this.showMessage('Organization deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting organization:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  async removeMember(orgId, userId) {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', userId);

      if (error) throw error;

      await this.loadMembers(orgId);
      this.showMessage('Member removed successfully!', 'success');
    } catch (error) {
      console.error('Error removing member:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  async removeAdminUser(adminId) {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      await this.loadAdminUsers();
      this.showMessage('Admin user removed successfully!', 'success');
    } catch (error) {
      console.error('Error removing admin user:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `toast toast-${type}`;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add('show');
    }, 10);

    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .admin-container {
        min-height: 100vh;
        background: #f5f5f5;
      }

      .admin-header {
        background: white;
        padding: 2rem;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      .admin-title-section h1 {
        margin: 0;
        font-size: 1.8rem;
        color: #333;
      }

      .admin-subtitle {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 0.95rem;
      }

      .admin-header .btn {
        align-self: flex-end;
      }

      .admin-nav {
        background: white;
        border-bottom: 1px solid #ddd;
        display: flex;
        gap: 0;
        padding: 0 2rem;
      }

      .admin-nav-btn {
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        padding: 1rem 1.5rem;
        font-size: 1rem;
        cursor: pointer;
        color: #666;
        transition: all 0.3s ease;
      }

      .admin-nav-btn:hover {
        color: #0099FF;
      }

      .admin-nav-btn.active {
        color: #0099FF;
        border-bottom-color: #0099FF;
      }

      .nav-icon {
        margin-right: 0.5rem;
      }

      .admin-content {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 0 2rem;
      }

      .admin-view {
        display: none;
      }

      .admin-view.active {
        display: block;
      }

      .view-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .view-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
      }

      .filter-select {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        background: white;
        cursor: pointer;
      }

      .admin-list {
        display: grid;
        gap: 1rem;
      }

      .admin-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
        transition: all 0.3s ease;
      }

      .admin-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #f0f0f0;
      }

      .card-header h3 {
        margin: 0;
        color: #333;
      }

      .card-content p {
        margin: 0.5rem 0;
        color: #666;
        font-size: 0.95rem;
      }

      .card-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f0f0f0;
      }

      .btn-small {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge.active {
        background: #d4edda;
        color: #155724;
      }

      .badge.inactive {
        background: #f8d7da;
        color: #721c24;
      }

      .badge.role-owner, .badge.admin-super_admin {
        background: #cce5ff;
        color: #004085;
      }

      .badge.role-admin, .badge.admin-admin {
        background: #d1ecf1;
        color: #0c5460;
      }

      .badge.role-manager {
        background: #fff3cd;
        color: #856404;
      }

      .badge.role-staff {
        background: #e2e3e5;
        color: #383d41;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        color: #999;
        font-size: 1.1rem;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: #999;
      }

      .error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 1rem;
        color: #721c24;
      }

      /* Modals */
      .modal {
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        transition: opacity 0.3s ease;
      }

      .modal.hidden {
        display: none;
        opacity: 0;
      }

      .modal-content {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .modal-content.modal-lg {
        max-width: 700px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #ddd;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #333;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
        color: #333;
        background: white;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #0099FF;
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .subdomain-input {
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      }

      .subdomain-input input {
        border: none;
        flex: 1;
        border-radius: 0;
      }

      .subdomain-input span {
        padding: 0.75rem 1rem;
        background: #f5f5f5;
        border-left: 1px solid #ddd;
        color: #666;
        white-space: nowrap;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #ddd;
      }

      .form-actions .btn {
        flex: 1;
      }

      /* Toast notifications */
      .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        font-size: 0.95rem;
        z-index: 2000;
        transform: translateY(120%);
        transition: transform 0.3s ease;
      }

      .toast.show {
        transform: translateY(0);
      }

      .toast-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .toast-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .toast-info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }

      @media (max-width: 768px) {
        .admin-header {
          flex-direction: column;
          gap: 1rem;
        }

        .admin-nav {
          overflow-x: auto;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .view-header {
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }

        .filter-select {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup
  }
}

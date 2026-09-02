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

    const switchOrgButton = onSwitchToOrg ? `<button class="btn btn-primary" id="switch-to-org-btn" style="margin-right: 1rem;">→ Go to Events</button>` : '';

    const adminHtml = `
      <div class="admin-container">
        <div class="admin-header">
          <div class="admin-title-section">
            <h1>⚙️ Admin Dashboard</h1>
            <p class="admin-subtitle">Manage organizations, users, and platform settings</p>
          </div>
          <div style="display: flex; gap: 0.8rem;">
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
              <div style="display: flex; gap: 1rem; align-items: center;">
                <select id="member-org-filter" class="filter-select">
                  <option value="">Select organization...</option>
                </select>
                <button class="btn btn-primary" id="add-member-btn" style="display: none;">+ Add Member</button>
              </div>
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

      <!-- Add Member Modal -->
      <div id="add-member-modal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Add Organization Member</h2>
            <button class="modal-close" data-modal="add-member-modal">&times;</button>
          </div>
          <form id="add-member-form">
            <input type="hidden" name="org_id">
            <div class="form-group">
              <label>Member Email *</label>
              <input type="email" name="member_email" required placeholder="member@example.com">
            </div>

            <div class="form-group">
              <label>Role *</label>
              <select name="role" required>
                <option value="">Select role...</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" data-modal="add-member-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Member</button>
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
        this.currentOrgId = e.target.value;
        document.getElementById('add-member-btn').style.display = 'block';
        await this.loadMembers(e.target.value);
      } else {
        document.getElementById('members-list').innerHTML = '<div class="loading">Select an organization to view members</div>';
        document.getElementById('add-member-btn').style.display = 'none';
      }
    });

    // Add member button
    document.getElementById('add-member-btn')?.addEventListener('click', () => {
      const form = document.getElementById('add-member-form');
      form.querySelector('input[name="org_id"]').value = this.currentOrgId;
      this.showModal('add-member-modal');
    });

    // Add member form
    document.getElementById('add-member-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddMember(new FormData(e.target));
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

      // Fetch user emails from auth
      const userIds = data.map(m => m.user_id);
      const { data: usersData } = await supabase.auth.admin.listUsers();

      const userEmailMap = {};
      if (usersData?.users) {
        usersData.users.forEach(user => {
          userEmailMap[user.id] = user.email;
        });
      }

      const html = data.map(member => {
        const email = userEmailMap[member.user_id] || member.user_id;
        const displayName = email.split('@')[0] || email;
        return `
          <div class="admin-card">
            <div class="card-content">
              <p><strong>👤 ${displayName}</strong></p>
              <p style="font-size: 0.9rem; color: var(--text-muted);">${email}</p>
              <p><span class="badge role-${member.role}">${member.role.toUpperCase()}</span></p>
            </div>
            <div class="card-actions">
              <button class="btn btn-small btn-danger" data-remove-member="${member.user_id}">Remove</button>
            </div>
          </div>
        `;
      }).join('');

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

  async handleAddMember(formData) {
    try {
      const data = Object.fromEntries(formData);
      const orgId = data.org_id;
      const memberEmail = data.member_email;
      const role = data.role;

      // Find user by email
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const user = usersData?.users?.find(u => u.email === memberEmail);

      if (!user) {
        this.showMessage(`User with email ${memberEmail} not found in the system`, 'error');
        return;
      }

      // Add member to organization
      const { error } = await supabase
        .from('organization_members')
        .insert([{
          org_id: orgId,
          user_id: user.id,
          role: role,
          is_active: true
        }]);

      if (error) {
        // Check if member already exists
        if (error.message.includes('duplicate') || error.message.includes('already')) {
          this.showMessage('This user is already a member of this organization', 'error');
        } else {
          throw error;
        }
        return;
      }

      this.hideModal('add-member-modal');
      document.getElementById('add-member-form').reset();
      await this.loadMembers(orgId);
      this.showMessage('Member added successfully!', 'success');
    } catch (error) {
      console.error('Error adding member:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
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
      /* VOC Branded Admin Dashboard Styles */
      :root {
        --voc-dark-navy: #003D7A;
        --voc-bright-blue: #0099FF;
        --voc-cyan: #00A8E8;
        --voc-orange: #FF9800;
        --voc-green: #4CAF50;
        --bg-primary: #1A2332;
        --bg-secondary: #0F1419;
        --bg-tertiary: #2A3F5F;
        --text-primary: #FFFFFF;
        --text-secondary: #B0BEC5;
        --text-muted: #78909C;
        --border-color: #334455;
        --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
        --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);
        --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
        --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.4);
        --gradient-primary: linear-gradient(135deg, #0099FF 0%, #00A8E8 100%);
        --gradient-accent: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
      }

      .admin-container {
        min-height: 100vh;
        background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
        color: var(--text-primary);
      }

      .admin-header {
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        padding: 2.5rem;
        border-bottom: 2px solid var(--voc-bright-blue);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 2rem;
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(10px);
      }

      .admin-title-section h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--voc-bright-blue);
        letter-spacing: -0.3px;
      }

      .admin-subtitle {
        margin: 0;
        color: var(--text-secondary);
        font-size: 1rem;
        letter-spacing: 0.3px;
      }

      .admin-header .btn {
        align-self: flex-end;
      }

      .admin-nav {
        background: linear-gradient(90deg, rgba(26, 35, 50, 0.8), rgba(42, 63, 95, 0.8));
        backdrop-filter: blur(5px);
        border-bottom: 2px solid rgba(0, 153, 255, 0.2);
        display: flex;
        gap: 0;
        padding: 0 2rem;
        box-shadow: var(--shadow-md);
      }

      .admin-nav-btn {
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        padding: 1.2rem 1.8rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .admin-nav-btn:hover {
        color: var(--voc-cyan);
        background: rgba(0, 168, 232, 0.1);
      }

      .admin-nav-btn.active {
        color: var(--voc-bright-blue);
        border-bottom-color: var(--voc-bright-blue);
        background: rgba(0, 153, 255, 0.15);
        box-shadow: 0 3px 0 0 var(--voc-bright-blue) inset;
      }

      .nav-icon {
        margin-right: 0.6rem;
        font-size: 1.2rem;
      }

      .admin-content {
        max-width: 1400px;
        margin: 3rem auto;
        padding: 0 2rem;
        animation: fadeIn 0.5s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .admin-view {
        display: none;
      }

      .admin-view.active {
        display: block;
        animation: slideUp 0.4s ease;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .view-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2.5rem;
        gap: 1rem;
      }

      .view-header h2 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--voc-bright-blue);
        letter-spacing: -0.3px;
      }

      .filter-select {
        padding: 0.8rem 1.2rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.95rem;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 600;
      }

      .filter-select:hover {
        border-color: var(--voc-bright-blue);
        background: rgba(0, 153, 255, 0.1);
      }

      .filter-select:focus {
        outline: none;
        border-color: var(--voc-cyan);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.15);
      }

      .admin-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
      }

      .admin-card {
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.8rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .admin-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--gradient-primary);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
      }

      .admin-card:hover {
        border-color: var(--voc-bright-blue);
        box-shadow: 0 8px 32px rgba(0, 153, 255, 0.2);
        transform: translateY(-4px);
      }

      .admin-card:hover::before {
        transform: scaleX(1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        padding-bottom: 1.2rem;
        border-bottom: 1px solid var(--border-color);
        gap: 1rem;
      }

      .card-header h3 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--voc-bright-blue);
        flex: 1;
        word-break: break-word;
      }

      .card-content {
        margin-bottom: 1.5rem;
      }

      .card-content p {
        margin: 0.6rem 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
        line-height: 1.6;
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .card-content strong {
        color: var(--voc-cyan);
        font-weight: 600;
      }

      .card-actions {
        display: flex;
        gap: 0.8rem;
        margin-top: 1.5rem;
        padding-top: 1.2rem;
        border-top: 1px solid var(--border-color);
      }

      .btn-small {
        padding: 0.65rem 1.2rem;
        font-size: 0.85rem;
        font-weight: 600;
        flex: 1;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
      }

      .btn-small.btn-primary {
        background: linear-gradient(135deg, var(--voc-bright-blue), var(--voc-cyan));
        color: white;
      }

      .btn-small.btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 153, 255, 0.3);
      }

      .btn-small.btn-primary:active {
        transform: translateY(0);
      }

      .btn-small.btn-secondary {
        background: rgba(0, 168, 232, 0.1);
        color: var(--voc-cyan);
        border: 1px solid var(--voc-cyan);
      }

      .btn-small.btn-secondary:hover {
        background: rgba(0, 168, 232, 0.2);
        box-shadow: 0 4px 12px rgba(0, 168, 232, 0.2);
      }

      .btn-small.btn-danger {
        background: rgba(255, 82, 82, 0.15);
        color: #FF6B6B;
        border: 1px solid #FF6B6B;
      }

      .btn-small.btn-danger:hover {
        background: rgba(255, 82, 82, 0.25);
        box-shadow: 0 4px 12px rgba(255, 82, 82, 0.2);
      }

      .badge {
        display: inline-block;
        padding: 0.35rem 0.9rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        border: 1px solid;
      }

      .badge.active {
        background: rgba(76, 175, 80, 0.2);
        color: var(--voc-green);
        border-color: var(--voc-green);
      }

      .badge.inactive {
        background: rgba(255, 82, 82, 0.2);
        color: #FF6B6B;
        border-color: #FF6B6B;
      }

      .badge.role-owner, .badge.admin-super_admin {
        background: rgba(0, 153, 255, 0.2);
        color: var(--voc-bright-blue);
        border-color: var(--voc-bright-blue);
      }

      .badge.role-admin, .badge.admin-admin {
        background: rgba(0, 168, 232, 0.2);
        color: var(--voc-cyan);
        border-color: var(--voc-cyan);
      }

      .badge.role-manager, .badge.admin-moderator {
        background: rgba(255, 152, 0, 0.2);
        color: var(--voc-orange);
        border-color: var(--voc-orange);
      }

      .badge.role-staff {
        background: rgba(180, 190, 197, 0.2);
        color: var(--text-secondary);
        border-color: var(--text-secondary);
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        color: var(--text-muted);
        font-size: 1.1rem;
        font-weight: 500;
      }

      .loading {
        text-align: center;
        padding: 3rem 2rem;
        color: var(--text-secondary);
        font-size: 1rem;
      }

      .error {
        background: rgba(255, 82, 82, 0.15);
        border: 2px solid #FF6B6B;
        border-radius: 8px;
        padding: 1.2rem;
        color: #FFB3B3;
        font-weight: 500;
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
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 1000;
        transition: opacity 0.3s ease;
        animation: fadeIn 0.2s ease;
      }

      .modal.hidden {
        display: none;
        opacity: 0;
      }

      .modal-content {
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2.5rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-xl);
        animation: slideUp 0.3s ease;
      }

      .modal-content.modal-lg {
        max-width: 700px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 2px solid var(--border-color);
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--voc-bright-blue);
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.8rem;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-close:hover {
        color: var(--voc-bright-blue);
        transform: rotate(90deg);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.6rem;
        font-weight: 600;
        color: var(--voc-bright-blue);
        text-transform: uppercase;
        font-size: 0.9rem;
        letter-spacing: 0.3px;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 0.85rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.95rem;
        font-family: inherit;
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;
      }

      .form-group input::placeholder,
      .form-group textarea::placeholder {
        color: var(--text-muted);
      }

      .form-group input:hover,
      .form-group select:hover,
      .form-group textarea:hover {
        border-color: rgba(0, 153, 255, 0.3);
        background: rgba(255, 255, 255, 0.08);
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: var(--voc-bright-blue);
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.15);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.2rem;
      }

      .subdomain-input {
        display: flex;
        align-items: center;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;
      }

      .subdomain-input:focus-within {
        border-color: var(--voc-bright-blue);
        background: rgba(255, 255, 255, 0.1);
      }

      .subdomain-input input {
        border: none;
        flex: 1;
        border-radius: 0;
        background: transparent;
        color: var(--text-primary);
        padding: 0.85rem;
      }

      .subdomain-input input:focus {
        outline: none;
      }

      .subdomain-input span {
        padding: 0.85rem 1.2rem;
        background: rgba(0, 153, 255, 0.1);
        border-left: 2px solid var(--border-color);
        color: var(--text-secondary);
        white-space: nowrap;
        font-weight: 600;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2.5rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--border-color);
      }

      .form-actions .btn {
        flex: 1;
        max-width: 200px;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
      }

      /* Toast notifications */
      .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1.2rem 1.5rem;
        border-radius: 8px;
        font-size: 0.95rem;
        z-index: 2000;
        transform: translateY(120%);
        transition: transform 0.3s ease;
        font-weight: 600;
        border-left: 4px solid;
        box-shadow: var(--shadow-lg);
      }

      .toast.show {
        transform: translateY(0);
        animation: slideUp 0.3s ease;
      }

      .toast-success {
        background: rgba(76, 175, 80, 0.15);
        color: var(--voc-green);
        border-left-color: var(--voc-green);
      }

      .toast-error {
        background: rgba(255, 82, 82, 0.15);
        color: #FFB3B3;
        border-left-color: #FF6B6B;
      }

      .toast-info {
        background: rgba(0, 168, 232, 0.15);
        color: var(--voc-cyan);
        border-left-color: var(--voc-cyan);
      }

      /* Professional Button Styles */
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
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        white-space: nowrap;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--voc-bright-blue), var(--voc-cyan));
        color: white;
        border-color: transparent;
        box-shadow: var(--shadow-md);
      }

      .btn-primary:hover:not(:disabled) {
        background: linear-gradient(135deg, var(--voc-dark-navy), var(--voc-bright-blue));
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .btn-primary:active:not(:disabled) {
        transform: translateY(0);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border-color: var(--border-color);
      }

      .btn-secondary:hover:not(:disabled) {
        background: rgba(0, 168, 232, 0.15);
        border-color: var(--voc-bright-blue);
        color: var(--voc-bright-blue);
      }

      /* Responsive Design */
      @media (max-width: 1024px) {
        .admin-list {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
      }

      @media (max-width: 768px) {
        .admin-header {
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .admin-title-section h1 {
          font-size: 1.8rem;
        }

        .admin-nav {
          padding: 0 1rem;
          overflow-x: auto;
        }

        .admin-nav-btn {
          padding: 1rem 1.2rem;
          font-size: 0.9rem;
        }

        .admin-content {
          padding: 0 1rem;
          margin: 2rem auto;
        }

        .admin-list {
          grid-template-columns: 1fr;
          gap: 1.2rem;
        }

        .form-row {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .view-header {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }

        .filter-select {
          width: 100%;
        }

        .modal-content {
          padding: 1.5rem;
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions .btn {
          max-width: 100%;
        }
      }

      @media (max-width: 480px) {
        .admin-header {
          padding: 1rem;
        }

        .admin-title-section h1 {
          font-size: 1.5rem;
        }

        .admin-nav {
          padding: 0 0.5rem;
        }

        .card-actions {
          flex-direction: column;
          gap: 0.6rem;
        }

        .btn-small {
          padding: 0.6rem 1rem;
          font-size: 0.8rem;
        }

        .toast {
          bottom: 1rem;
          right: 1rem;
          left: 1rem;
          width: auto;
        }
      }
    `;

    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup
  }
}

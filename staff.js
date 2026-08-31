// Staff Management Module
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';

export class StaffPage {
  constructor() {
    this.currentEvent = null;
    this.currentUser = null;
    this.staffList = [];
    this.assignmentsList = [];
    this.onBack = null;
    this.currentAssignmentId = null;
  }

  async render(eventId, currentUser, onBack) {
    this.currentEvent = eventId;
    this.currentUser = currentUser;
    this.onBack = onBack;

    const container = document.getElementById('app');

    // Render navbar
    const navbar = new Navbar(currentUser, () => {});
    const navbarHtml = navbar.render();

    const staffHtml = `
      ${navbarHtml}
      <div class="staff-dashboard">
        <div class="staff-header">
          <div class="staff-header-top">
            <h1>Staff Management</h1>
            <button class="btn btn-secondary btn-small" id="back-btn-staff">← Back to Dashboard</button>
          </div>
        </div>

        <div class="staff-controls">
          <button class="btn btn-primary" id="add-staff-btn">+ Add Staff Member</button>
          <div class="staff-filters">
            <select id="role-filter">
              <option value="">All Roles</option>
              <option value="Event Director">Event Director</option>
              <option value="Event Safety Officer">Event Safety Officer</option>
              <option value="Event Coordinator">Event Coordinator</option>
              <option value="Operations Staff">Operations Staff</option>
              <option value="Marshal">Marshal</option>
              <option value="Volunteer">Volunteer</option>
            </select>
          </div>
        </div>

        <div class="staff-content">
          <div class="staff-tabs">
            <button class="tab-btn active" data-tab="staff-list">Staff List</button>
            <button class="tab-btn" data-tab="checkin">Check-in/out</button>
            <button class="tab-btn" data-tab="assignments">Assignments</button>
          </div>

          <div id="staff-list" class="tab-content active">
            <div class="staff-grid" id="staff-grid">
              <div class="loading">Loading staff...</div>
            </div>
          </div>

          <div id="checkin" class="tab-content">
            <div class="checkin-container" id="checkin-container">
              <div class="loading">Loading staff for check-in...</div>
            </div>
          </div>

          <div id="assignments" class="tab-content">
            <div class="assignments-container" id="assignments-container">
              <div class="loading">Loading assignments...</div>
            </div>
          </div>
        </div>

        <!-- Add/Edit Staff Modal -->
        <div class="staff-modal" id="staff-modal" style="display: none;">
          <div class="modal-content">
            <button class="modal-close" id="close-staff-modal">&times;</button>
            <h2 id="modal-title">Add Staff Member</h2>
            <form id="staff-form">
              <div class="form-group">
                <label>Name *</label>
                <input type="text" id="staff-name" required />
              </div>

              <div class="form-group">
                <label>Email *</label>
                <input type="email" id="staff-email" required />
              </div>

              <div class="form-group">
                <label>Phone *</label>
                <input type="tel" id="staff-phone" required />
              </div>

              <div class="form-group">
                <label>Alternate Phone</label>
                <input type="tel" id="staff-alt-phone" />
              </div>

              <div class="form-group">
                <label>ID Number</label>
                <input type="text" id="staff-id" />
              </div>

              <div class="form-group">
                <label>Roles (select multiple)</label>
                <div class="role-checkboxes">
                  <label><input type="checkbox" value="Event Director" class="role-checkbox"> Event Director</label>
                  <label><input type="checkbox" value="Event Safety Officer" class="role-checkbox"> Event Safety Officer</label>
                  <label><input type="checkbox" value="Event Coordinator" class="role-checkbox"> Event Coordinator</label>
                  <label><input type="checkbox" value="Operations Staff" class="role-checkbox"> Operations Staff</label>
                  <label><input type="checkbox" value="Marshal" class="role-checkbox"> Marshal</label>
                  <label><input type="checkbox" value="Volunteer" class="role-checkbox"> Volunteer</label>
                </div>
              </div>

              <div class="form-group" id="functions-group" style="display: none;">
                <label>Operations Functions</label>
                <div class="functions-input">
                  <input type="text" id="function-input" placeholder="e.g., Admin, Water tables, Tickets, Entries" />
                  <button type="button" id="add-function-btn" class="btn btn-sm btn-secondary">Add Function</button>
                </div>
                <div id="functions-list" class="functions-list"></div>
              </div>

              <div id="error-message" class="error-message"></div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="cancel-staff">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Staff Member</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Add/Edit Assignment Modal -->
        <div class="staff-modal" id="assignment-modal" style="display: none;">
          <div class="modal-content">
            <button class="modal-close" id="close-assignment-modal">&times;</button>
            <h2 id="assignment-modal-title">Create Assignment</h2>
            <form id="assignment-form">
              <div class="form-group">
                <label>Staff Member *</label>
                <select id="assignment-staff" required>
                  <option value="">Select a staff member</option>
                </select>
              </div>

              <div class="form-group">
                <label>Assignment/Area *</label>
                <input type="text" id="assignment-name" placeholder="e.g., Gate A, Medical Tent, Registration Desk" required />
              </div>

              <div class="form-group">
                <label>Start Time</label>
                <input type="time" id="assignment-start" />
              </div>

              <div class="form-group">
                <label>End Time</label>
                <input type="time" id="assignment-end" />
              </div>

              <div class="form-group">
                <label>Status *</label>
                <select id="assignment-status" required>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div id="assignment-error-message" class="error-message"></div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="cancel-assignment">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = staffHtml;

    // Add styles
    this.addStyles();

    // Load staff and setup listeners
    await this.loadStaff();
    this.setupEventListeners();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .staff-dashboard {
        min-height: calc(100vh - 60px);
        background: var(--bg-secondary);
        padding: 2rem;
      }

      .staff-header {
        margin-bottom: 2rem;
      }

      .staff-header-top {
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

      .staff-header-top h1 {
        margin: 0;
        color: var(--primary);
        font-size: 2rem;
      }

      .staff-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .staff-filters {
        flex: 1;
        min-width: 200px;
      }

      .staff-filters select {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .staff-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
      }

      .staff-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
      }

      .tab-btn {
        padding: 0.75rem 1.5rem;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
      }

      .tab-btn:hover {
        color: var(--primary);
      }

      .tab-btn.active {
        color: var(--primary);
        border-bottom-color: var(--primary);
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
      }

      .staff-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .staff-card {
        background: rgba(0, 153, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
      }

      .staff-card:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }

      .staff-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .staff-info {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
      }

      .staff-roles {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .role-badge {
        display: inline-block;
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: white;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .staff-functions-list {
        font-size: 0.85rem;
        color: var(--primary);
        margin-top: 0.5rem;
      }

      .staff-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .staff-actions .btn {
        flex: 1;
        font-size: 0.85rem;
        padding: 0.5rem;
      }

      .checkin-container, .assignments-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .checkin-card, .assignment-card {
        background: rgba(0, 153, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
      }

      .checkin-status {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 1rem;
        padding: 0.75rem;
        border-radius: 8px;
        text-align: center;
      }

      .checkin-status.checked-in {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
      }

      .checkin-status.checked-out {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
      }

      .checkin-actions {
        display: flex;
        gap: 0.5rem;
      }

      .checkin-actions .btn {
        flex: 1;
      }

      .staff-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .staff-modal .modal-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-secondary);
        float: right;
        transition: all 0.2s ease;
      }

      .modal-close:hover {
        color: var(--text-primary);
      }

      .form-group {
        margin-bottom: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .form-group label {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .form-group input, .form-group select {
        padding: 0.85rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.95rem;
      }

      .role-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
      }

      .role-checkboxes label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: normal;
        text-transform: none;
        letter-spacing: normal;
        cursor: pointer;
      }

      .role-checkboxes input {
        cursor: pointer;
        width: auto;
      }

      .functions-input {
        display: flex;
        gap: 0.5rem;
      }

      .functions-input input {
        flex: 1;
      }

      .functions-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .function-tag {
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: white;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .function-tag button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1rem;
        padding: 0;
        display: flex;
        align-items: center;
      }

      .error-message {
        color: #ff6b6b;
        font-size: 0.9rem;
        padding: 1rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        display: none;
        margin: 1rem 0;
      }

      .error-message.show {
        display: block;
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--border-color);
      }

      .modal-actions .btn {
        flex: 1;
        max-width: 150px;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
        font-size: 1.1rem;
      }

      .assignments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .assignment-card {
        background: rgba(0, 153, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
      }

      .assignment-card:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }

      .assignment-details {
        margin: 1rem 0;
        padding: 1rem;
        background: rgba(0, 153, 255, 0.1);
        border-radius: 8px;
      }

      .assignment-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--primary);
        margin-bottom: 0.5rem;
      }

      .assignment-time {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .assignment-status {
        display: inline-block;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        margin: 0.75rem 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .assignment-status.pending {
        background: rgba(255, 193, 7, 0.2);
        color: #FFC107;
      }

      .assignment-status.assigned {
        background: rgba(33, 150, 243, 0.2);
        color: #2196F3;
      }

      .assignment-status.completed {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
      }

      .assignment-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .assignment-actions .btn {
        flex: 1;
        font-size: 0.85rem;
        padding: 0.5rem;
      }

      @media (max-width: 768px) {
        .staff-dashboard {
          padding: 1rem;
        }

        .staff-header-top {
          flex-direction: column;
          gap: 1rem;
        }

        .staff-grid, .checkin-container, .assignments-container {
          grid-template-columns: 1fr;
        }

        .staff-modal .modal-content {
          width: 95%;
          max-height: 95vh;
        }

        .role-checkboxes {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async loadStaff() {
    try {
      const { data, error } = await supabase
        .from('event_staff')
        .select(`
          *,
          staff_roles (
            id,
            role,
            staff_functions (
              id,
              function_name
            )
          )
        `)
        .eq('event_id', this.currentEvent);

      if (error) throw error;

      this.staffList = data || [];
      this.renderStaffList();
      this.renderCheckinList();
      await this.loadAssignments();
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  }

  async loadAssignments() {
    try {
      const { data, error } = await supabase
        .from('staff_assignments')
        .select(`
          *,
          event_staff (
            id,
            name,
            email
          )
        `)
        .eq('event_id', this.currentEvent)
        .order('start_time', { ascending: false });

      if (error) throw error;

      this.assignmentsList = data || [];
      this.renderAssignmentsList();
    } catch (error) {
      console.error('Error loading assignments:', error);
      this.assignmentsList = [];
    }
  }

  renderStaffList() {
    const grid = document.getElementById('staff-grid');
    const filterRole = document.getElementById('role-filter').value;

    if (this.staffList.length === 0) {
      grid.innerHTML = '<div class="loading">No staff members added yet</div>';
      return;
    }

    let filteredStaff = this.staffList;
    if (filterRole) {
      filteredStaff = this.staffList.filter(staff =>
        staff.staff_roles.some(r => r.role === filterRole)
      );
    }

    grid.innerHTML = filteredStaff.map(staff => {
      const roles = staff.staff_roles.map(r => r.role).join(', ');
      const functionsHtml = staff.staff_roles
        .filter(r => r.staff_functions && r.staff_functions.length > 0)
        .map(r => r.staff_functions.map(f => `<span>${f.function_name}</span>`).join(''))
        .join('');

      return `
        <div class="staff-card">
          <div class="staff-name">${staff.name}</div>
          <div class="staff-info">📧 ${staff.email}</div>
          <div class="staff-info">📱 ${staff.phone}</div>
          ${staff.alternate_phone ? `<div class="staff-info">📞 ${staff.alternate_phone}</div>` : ''}
          ${staff.id_number ? `<div class="staff-info">🆔 ${staff.id_number}</div>` : ''}

          <div class="staff-roles">
            ${staff.staff_roles.map(r => `<span class="role-badge">${r.role}</span>`).join('')}
          </div>

          ${functionsHtml ? `<div class="staff-functions-list">${functionsHtml}</div>` : ''}

          <div class="staff-actions">
            <button class="btn btn-sm btn-primary" data-edit="${staff.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-delete="${staff.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners for edit/delete buttons
    grid.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => this.editStaff(btn.dataset.edit));
    });

    grid.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteStaff(btn.dataset.delete));
    });
  }

  renderCheckinList() {
    const container = document.getElementById('checkin-container');

    if (this.staffList.length === 0) {
      container.innerHTML = '<div class="loading">No staff members</div>';
      return;
    }

    container.innerHTML = this.staffList.map(staff => `
      <div class="checkin-card">
        <div class="staff-name">${staff.name}</div>
        <div class="staff-info">${staff.staff_roles.map(r => r.role).join(', ')}</div>

        <div class="checkin-status checked-in">✓ Ready to Check In</div>

        <div class="checkin-actions">
          <button class="btn btn-sm btn-success" data-checkin="${staff.id}">Check In</button>
          <button class="btn btn-sm btn-warning" data-checkout="${staff.id}">Check Out</button>
        </div>
      </div>
    `).join('');

    // Add checkin/checkout listeners
    container.querySelectorAll('[data-checkin]').forEach(btn => {
      btn.addEventListener('click', () => this.checkIn(btn.dataset.checkin));
    });

    container.querySelectorAll('[data-checkout]').forEach(btn => {
      btn.addEventListener('click', () => this.checkOut(btn.dataset.checkout));
    });
  }

  renderAssignmentsList() {
    const container = document.getElementById('assignments-container');

    if (!this.assignmentsList || this.assignmentsList.length === 0) {
      container.innerHTML = `
        <div class="loading">
          <p>No assignments yet</p>
          <button class="btn btn-primary" id="create-assignment-btn" style="margin-top: 1rem;">+ Create Assignment</button>
        </div>
      `;
      const createBtn = container.querySelector('#create-assignment-btn');
      if (createBtn) {
        createBtn.addEventListener('click', () => this.openAssignmentModal());
      }
      return;
    }

    const assignmentsHtml = this.assignmentsList.map(assignment => {
      const staff = assignment.event_staff;
      const startTime = assignment.start_time ? new Date(assignment.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBA';
      const endTime = assignment.end_time ? new Date(assignment.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBA';
      const statusClass = assignment.status === 'completed' ? 'completed' : assignment.status === 'assigned' ? 'assigned' : 'pending';

      return `
        <div class="assignment-card">
          <div class="staff-name">${staff.name}</div>
          <div class="staff-info">📧 ${staff.email}</div>

          <div class="assignment-details">
            <div class="assignment-title">${assignment.assignment}</div>
            <div class="assignment-time">
              <span>⏱️ ${startTime} - ${endTime}</span>
            </div>
          </div>

          <div class="assignment-status ${statusClass}">
            ${assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
          </div>

          <div class="assignment-actions">
            <button class="btn btn-sm btn-primary" data-edit-assignment="${assignment.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-delete-assignment="${assignment.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <button class="btn btn-primary" id="create-assignment-btn">+ Create Assignment</button>
      </div>
      <div class="assignments-grid">
        ${assignmentsHtml}
      </div>
    `;

    // Add event listeners
    const createBtn = container.querySelector('#create-assignment-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openAssignmentModal());
    }

    container.querySelectorAll('[data-edit-assignment]').forEach(btn => {
      btn.addEventListener('click', () => this.editAssignment(btn.dataset.editAssignment));
    });

    container.querySelectorAll('[data-delete-assignment]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteAssignment(btn.dataset.deleteAssignment));
    });
  }

  async checkIn(staffId) {
    try {
      const { error } = await supabase
        .from('staff_checkin')
        .insert([{
          staff_id: staffId,
          event_id: this.currentEvent,
          check_in_time: new Date().toISOString()
        }]);

      if (error) throw error;
      alert('Staff checked in successfully');
      this.renderCheckinList();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in staff');
    }
  }

  async checkOut(staffId) {
    try {
      const { error } = await supabase
        .from('staff_checkin')
        .update({ check_out_time: new Date().toISOString() })
        .eq('staff_id', staffId)
        .is('check_out_time', null);

      if (error) throw error;
      alert('Staff checked out successfully');
      this.renderCheckinList();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out staff');
    }
  }

  setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn-staff');
    if (backBtn && this.onBack) {
      backBtn.addEventListener('click', () => this.onBack());
    }

    // Add staff button
    document.getElementById('add-staff-btn').addEventListener('click', () => {
      this.openStaffModal();
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        e.target.classList.add('active');
        document.getElementById(e.target.dataset.tab).classList.add('active');
      });
    });

    // Role filter
    document.getElementById('role-filter').addEventListener('change', () => {
      this.renderStaffList();
    });

    // Modal close
    document.getElementById('close-staff-modal').addEventListener('click', () => {
      this.closeStaffModal();
    });

    document.getElementById('cancel-staff').addEventListener('click', () => {
      this.closeStaffModal();
    });

    // Assignment modal close
    document.getElementById('close-assignment-modal').addEventListener('click', () => {
      this.closeAssignmentModal();
    });

    document.getElementById('cancel-assignment').addEventListener('click', () => {
      this.closeAssignmentModal();
    });

    // Assignment form submission
    document.getElementById('assignment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAssignment();
    });

    // Role checkboxes for showing/hiding functions
    document.querySelectorAll('.role-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const hasOpsRole = Array.from(document.querySelectorAll('.role-checkbox'))
          .some(cb => cb.checked && cb.value === 'Operations Staff');
        document.getElementById('functions-group').style.display = hasOpsRole ? 'block' : 'none';
      });
    });

    // Add function button
    document.getElementById('add-function-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.addFunction();
    });

    // Form submission
    document.getElementById('staff-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveStaff();
    });
  }

  openStaffModal() {
    document.getElementById('staff-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Add Staff Member';
    document.getElementById('staff-form').reset();
    document.getElementById('functions-group').style.display = 'none';
    document.getElementById('functions-list').innerHTML = '';
    document.getElementById('error-message').classList.remove('show');
  }

  closeStaffModal() {
    document.getElementById('staff-modal').style.display = 'none';
  }

  addFunction() {
    const input = document.getElementById('function-input');
    const functionName = input.value.trim();

    if (!functionName) {
      alert('Please enter a function');
      return;
    }

    const functionsList = document.getElementById('functions-list');
    const tag = document.createElement('div');
    tag.className = 'function-tag';
    tag.innerHTML = `
      ${functionName}
      <button type="button">×</button>
    `;

    tag.querySelector('button').addEventListener('click', () => tag.remove());
    functionsList.appendChild(tag);
    input.value = '';
  }

  async saveStaff() {
    const name = document.getElementById('staff-name').value;
    const email = document.getElementById('staff-email').value;
    const phone = document.getElementById('staff-phone').value;
    const altPhone = document.getElementById('staff-alt-phone').value;
    const idNumber = document.getElementById('staff-id').value;
    const selectedRoles = Array.from(document.querySelectorAll('.role-checkbox:checked'))
      .map(cb => cb.value);
    const functions = Array.from(document.querySelectorAll('.function-tag'))
      .map(tag => tag.textContent.replace('×', '').trim());

    const errorMsg = document.getElementById('error-message');

    if (!name || !email || !phone || selectedRoles.length === 0) {
      errorMsg.textContent = 'Please fill in all required fields and select at least one role';
      errorMsg.classList.add('show');
      return;
    }

    try {
      // Insert staff member
      const { data: staffData, error: staffError } = await supabase
        .from('event_staff')
        .insert([{
          event_id: this.currentEvent,
          name,
          email,
          phone,
          alternate_phone: altPhone,
          id_number: idNumber
        }])
        .select();

      if (staffError) throw staffError;

      const staffId = staffData[0].id;

      // Insert roles
      for (const role of selectedRoles) {
        const { data: roleData, error: roleError } = await supabase
          .from('staff_roles')
          .insert([{
            staff_id: staffId,
            role
          }])
          .select();

        if (roleError) throw roleError;

        // Insert functions if role is Operations Staff
        if (role === 'Operations Staff' && functions.length > 0) {
          const staffRoleId = roleData[0].id;
          for (const func of functions) {
            const { error: funcError } = await supabase
              .from('staff_functions')
              .insert([{
                staff_role_id: staffRoleId,
                function_name: func
              }]);

            if (funcError) throw funcError;
          }
        }
      }

      this.closeStaffModal();
      await this.loadStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      errorMsg.textContent = error.message || 'Failed to save staff member';
      errorMsg.classList.add('show');
    }
  }

  async editStaff(staffId) {
    const staff = this.staffList.find(s => s.id === staffId);
    if (!staff) return;

    // Populate form
    document.getElementById('staff-name').value = staff.name;
    document.getElementById('staff-email').value = staff.email;
    document.getElementById('staff-phone').value = staff.phone;
    document.getElementById('staff-alt-phone').value = staff.alternate_phone || '';
    document.getElementById('staff-id').value = staff.id_number || '';

    // Select roles
    document.querySelectorAll('.role-checkbox').forEach(cb => {
      cb.checked = staff.staff_roles.some(r => r.role === cb.value);
    });

    // Show/hide functions group
    const hasOpsRole = staff.staff_roles.some(r => r.role === 'Operations Staff');
    document.getElementById('functions-group').style.display = hasOpsRole ? 'block' : 'none';

    // Show functions
    const functionsList = document.getElementById('functions-list');
    functionsList.innerHTML = '';
    const opsFunctions = staff.staff_roles.find(r => r.role === 'Operations Staff');
    if (opsFunctions && opsFunctions.staff_functions) {
      opsFunctions.staff_functions.forEach(f => {
        const tag = document.createElement('div');
        tag.className = 'function-tag';
        tag.innerHTML = `
          ${f.function_name}
          <button type="button">×</button>
        `;
        tag.querySelector('button').addEventListener('click', () => tag.remove());
        functionsList.appendChild(tag);
      });
    }

    document.getElementById('modal-title').textContent = 'Edit Staff Member';
    document.getElementById('staff-modal').style.display = 'flex';
  }

  async deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const { error } = await supabase
        .from('event_staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
      await this.loadStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  }

  openAssignmentModal() {
    // Populate staff dropdown
    const staffSelect = document.getElementById('assignment-staff');
    staffSelect.innerHTML = '<option value="">Select a staff member</option>';

    this.staffList.forEach(staff => {
      const option = document.createElement('option');
      option.value = staff.id;
      option.textContent = `${staff.name} (${staff.staff_roles.map(r => r.role).join(', ')})`;
      staffSelect.appendChild(option);
    });

    document.getElementById('assignment-modal').style.display = 'flex';
    document.getElementById('assignment-modal-title').textContent = 'Create Assignment';
    document.getElementById('assignment-form').reset();
    document.getElementById('assignment-error-message').classList.remove('show');
    this.currentAssignmentId = null;
  }

  closeAssignmentModal() {
    document.getElementById('assignment-modal').style.display = 'none';
  }

  async saveAssignment() {
    const staffId = document.getElementById('assignment-staff').value;
    const assignmentName = document.getElementById('assignment-name').value;
    const startTime = document.getElementById('assignment-start').value;
    const endTime = document.getElementById('assignment-end').value;
    const status = document.getElementById('assignment-status').value;
    const errorMsg = document.getElementById('assignment-error-message');

    if (!staffId || !assignmentName || !status) {
      errorMsg.textContent = 'Please fill in all required fields';
      errorMsg.classList.add('show');
      return;
    }

    try {
      const startDateTime = startTime ? new Date(`2000-01-01T${startTime}`).toISOString() : null;
      const endDateTime = endTime ? new Date(`2000-01-01T${endTime}`).toISOString() : null;

      if (this.currentAssignmentId) {
        // Update existing assignment
        const { error } = await supabase
          .from('staff_assignments')
          .update({
            staff_id: staffId,
            assignment: assignmentName,
            start_time: startDateTime,
            end_time: endDateTime,
            status
          })
          .eq('id', this.currentAssignmentId);

        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('staff_assignments')
          .insert([{
            staff_id: staffId,
            event_id: this.currentEvent,
            assignment: assignmentName,
            start_time: startDateTime,
            end_time: endDateTime,
            status
          }]);

        if (error) throw error;
      }

      this.closeAssignmentModal();
      await this.loadAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      errorMsg.textContent = error.message || 'Failed to save assignment';
      errorMsg.classList.add('show');
    }
  }

  async editAssignment(assignmentId) {
    const assignment = this.assignmentsList.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Populate staff dropdown
    const staffSelect = document.getElementById('assignment-staff');
    staffSelect.innerHTML = '<option value="">Select a staff member</option>';

    this.staffList.forEach(staff => {
      const option = document.createElement('option');
      option.value = staff.id;
      option.textContent = `${staff.name} (${staff.staff_roles.map(r => r.role).join(', ')})`;
      staffSelect.appendChild(option);
    });

    // Populate form with assignment data
    staffSelect.value = assignment.staff_id;
    document.getElementById('assignment-name').value = assignment.assignment;
    document.getElementById('assignment-status').value = assignment.status;

    if (assignment.start_time) {
      const startDate = new Date(assignment.start_time);
      document.getElementById('assignment-start').value = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    }

    if (assignment.end_time) {
      const endDate = new Date(assignment.end_time);
      document.getElementById('assignment-end').value = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    }

    document.getElementById('assignment-modal-title').textContent = 'Edit Assignment';
    document.getElementById('assignment-modal').style.display = 'flex';
    document.getElementById('assignment-error-message').classList.remove('show');
    this.currentAssignmentId = assignmentId;
  }

  async deleteAssignment(assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error } = await supabase
        .from('staff_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      await this.loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    }
  }

  destroy() {
    // Cleanup if needed
  }
}

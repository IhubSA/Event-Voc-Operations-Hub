// Enhanced Staff Management Module with Marshal Position Assignment
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';

export class StaffPage {
  constructor() {
    this.currentEvent = null;
    this.currentUser = null;
    this.staffList = [];
    this.assignmentsList = [];
    this.marshalLocations = [];
    this.marshalAssignments = {}; // Track which marshal positions are assigned
    this.onBack = null;
    this.currentAssignmentId = null;
    this.selectedMarshalPosition = null; // Track selected marshal for quick assignment
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
            <button class="tab-btn" data-tab="marshal-positions">Marshal Positions</button>
            <button class="tab-btn" data-tab="checkin">Check-in/out</button>
            <button class="tab-btn" data-tab="assignments">Assignments</button>
          </div>

          <div id="staff-list" class="tab-content active">
            <div class="staff-grid" id="staff-grid">
              <div class="loading">Loading staff...</div>
            </div>
          </div>

          <div id="marshal-positions" class="tab-content">
            <div class="marshal-positions-container" id="marshal-positions-container">
              <div class="loading">Loading marshal positions...</div>
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
                <label>Assignment Type *</label>
                <select id="assignment-type" required>
                  <option value="custom">Custom Area</option>
                  <option value="marshal-position">Marshal Position</option>
                </select>
              </div>

              <div class="form-group" id="custom-assignment-group">
                <label>Custom Area/Position</label>
                <input type="text" id="assignment-name" placeholder="e.g., Gate A, Medical Tent, Registration Desk" />
              </div>

              <div class="form-group" id="marshal-position-group" style="display: none;">
                <label>Marshal Position *</label>
                <select id="assignment-marshal-position">
                  <option value="">Select a marshal position</option>
                </select>
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
    await this.loadMarshalLocations();
    await this.loadAssignments();
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
        flex-wrap: wrap;
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
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
      }

      .marshal-positions-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .marshal-position-card {
        background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(0, 153, 255, 0.05) 100%);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .marshal-position-card:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
        transform: translateY(-4px);
      }

      .marshal-position-card.assigned {
        border-color: var(--success);
        background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(76, 175, 80, 0.05) 100%);
      }

      .marshal-position-card .position-status {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .marshal-position-card .position-status.unassigned {
        background: rgba(255, 82, 82, 0.2);
        color: #FF5252;
      }

      .marshal-position-card .position-status.assigned {
        background: rgba(76, 175, 80, 0.2);
        color: var(--success);
      }

      .marshal-position-card .position-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--primary);
        margin-bottom: 0.75rem;
      }

      .marshal-position-card .position-route {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .marshal-position-card .position-coords {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-family: monospace;
      }

      .marshal-position-card .assigned-staff {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.75rem;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }

      .marshal-position-card .assigned-staff .staff-name {
        font-weight: 700;
        color: var(--primary);
        margin-bottom: 0.25rem;
      }

      .marshal-position-card .assigned-staff .staff-email {
        color: var(--text-secondary);
        font-size: 0.8rem;
      }

      .marshal-position-card .action-btn {
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .marshal-position-card .assign-btn {
        background: linear-gradient(135deg, var(--primary), #00A8E8);
        color: white;
      }

      .marshal-position-card .assign-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 153, 255, 0.3);
      }

      .marshal-position-card .change-btn {
        background: rgba(255, 152, 0, 0.2);
        color: #FF9800;
      }

      .marshal-position-card .change-btn:hover {
        background: rgba(255, 152, 0, 0.3);
      }

      .marshal-position-card .remove-btn {
        background: rgba(255, 82, 82, 0.2);
        color: #FF5252;
        margin-top: 0.5rem;
        font-size: 0.85rem;
        padding: 0.5rem;
      }

      .marshal-position-card .remove-btn:hover {
        background: rgba(255, 82, 82, 0.3);
      }

      .staff-card {
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
      }

      .staff-card:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
      }

      .staff-role-section {
        margin-bottom: 2rem;
      }

      .staff-role-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--primary);
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid var(--border-color);
      }

      .staff-role-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }

      .staff-name {
        font-weight: 700;
        color: var(--text-primary);
        font-size: 1rem;
        margin-bottom: 0.5rem;
      }

      .staff-info {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }

      .staff-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        flex-wrap: wrap;
      }

      .staff-actions button {
        flex: 1;
        min-width: 100px;
      }

      .role-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        margin-top: 0.75rem;
      }

      .assignments-container {
        display: grid;
        gap: 1.5rem;
      }

      .assignment-item {
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
      }

      .assignment-item:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-md);
      }

      .assignment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .assignment-staff-info {
        flex: 1;
      }

      .assignment-staff-name {
        font-weight: 700;
        color: var(--primary);
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }

      .assignment-area {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .assignment-time {
        color: var(--text-secondary);
        font-size: 0.85rem;
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
      }

      .assignment-status {
        padding: 0.4rem 1rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .assignment-status.pending {
        background: rgba(255, 193, 7, 0.2);
        color: #FFC107;
      }

      .assignment-status.assigned {
        background: rgba(76, 175, 80, 0.2);
        color: var(--success);
      }

      .assignment-status.completed {
        background: rgba(100, 100, 100, 0.2);
        color: #999;
      }

      .assignment-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }

      .assignment-actions button {
        flex: 1;
        padding: 0.7rem 1.2rem;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        transition: all 0.3s ease;
      }

      .assignment-actions button:hover {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 153, 255, 0.2);
      }

      .assignment-actions button:active {
        transform: translateY(0);
      }

      .staff-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: var(--shadow-xl);
      }

      .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 2rem;
        cursor: pointer;
        transition: color 0.3s ease;
      }

      .modal-close:hover {
        color: var(--primary);
      }

      .modal-content h2 {
        margin-top: 0;
        color: var(--primary);
        margin-bottom: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .form-group label {
        font-weight: 600;
        color: var(--text-primary);
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-family: inherit;
        transition: all 0.3s ease;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.15);
      }

      .role-checkboxes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .role-checkboxes label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-weight: normal;
      }

      .role-checkboxes input {
        width: auto;
        cursor: pointer;
      }

      .functions-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .function-tag {
        background: rgba(0, 153, 255, 0.2);
        color: var(--primary);
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .function-tag button {
        background: none;
        border: none;
        color: var(--primary);
        cursor: pointer;
        font-weight: bold;
        padding: 0;
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }

      .modal-actions button {
        flex: 1;
      }

      .error-message {
        color: #FF5252;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        display: none;
      }

      .error-message.show {
        display: block;
      }

      .loading {
        text-align: center;
        color: var(--text-secondary);
        padding: 2rem;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--primary), #00A8E8);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 153, 255, 0.3);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border: 2px solid var(--border-color);
      }

      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: var(--primary);
      }

      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
      }

      .btn-small {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }

      @media (max-width: 768px) {
        .staff-dashboard {
          padding: 1rem;
        }

        .staff-header-top {
          flex-direction: column;
          gap: 1rem;
        }

        .staff-tabs {
          flex-wrap: wrap;
        }

        .tab-btn {
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
        }

        .role-checkboxes {
          grid-template-columns: 1fr;
        }

        .marshal-positions-container {
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
            role
          )
        `)
        .eq('event_id', this.currentEvent);

      if (error) throw error;

      this.staffList = data || [];
      this.renderStaffList();
    } catch (error) {
      console.error('Error loading staff:', error);
      this.staffList = [];
    }
  }

  async loadMarshalLocations() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, marshals, name, type')
        .eq('event_id', this.currentEvent);

      if (error) throw error;

      this.marshalLocations = [];
      if (data && Array.isArray(data)) {
        data.forEach((route) => {
          if (route.marshals && Array.isArray(route.marshals) && route.marshals.length > 0) {
            route.marshals.forEach((marshal, idx) => {
              if (marshal.lat && marshal.lng) {
                this.marshalLocations.push({
                  id: `${route.id}-marshal-${idx}`,
                  name: marshal.name || `${route.name} - Position ${idx + 1}`,
                  routeName: route.name,
                  routeId: route.id,
                  lat: marshal.lat,
                  lng: marshal.lng,
                });
              }
            });
          }
        });
      }

      this.renderMarshalPositions();
    } catch (error) {
      console.error('Error loading marshal locations:', error);
      this.marshalLocations = [];
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

      // Build marshal assignments map
      this.marshalAssignments = {};
      this.assignmentsList.forEach(assignment => {
        if (assignment.assignment && assignment.assignment.startsWith('MARSHAL-')) {
          // Extract just the position ID (remove 'MARSHAL-' prefix)
          const marshalId = assignment.assignment.replace('MARSHAL-', '');
          this.marshalAssignments[marshalId] = {
            staffId: assignment.staff_id,
            staffName: assignment.event_staff?.name || 'Unknown',
            staffEmail: assignment.event_staff?.email || '',
            assignmentId: assignment.id
          };
        }
      });

      this.renderMarshalPositions();
      this.renderAssignmentsList();
    } catch (error) {
      console.error('Error loading assignments:', error);
      this.assignmentsList = [];
    }
  }

  renderMarshalPositions() {
    const container = document.getElementById('marshal-positions-container');
    if (!container) return;

    if (this.marshalLocations.length === 0) {
      container.innerHTML = '<div class="loading">No marshal positions available</div>';
      return;
    }

    const html = this.marshalLocations.map(marshal => {
      const assignment = this.marshalAssignments[marshal.id];
      const isAssigned = !!assignment;

      return `
        <div class="marshal-position-card ${isAssigned ? 'assigned' : ''}">
          <div class="position-status ${isAssigned ? 'assigned' : 'unassigned'}">
            ${isAssigned ? '✓ Assigned' : 'Unassigned'}
          </div>

          <div class="position-title">${marshal.name}</div>
          <div class="position-route">📍 Route: ${marshal.routeName}</div>
          <div class="position-coords">📌 ${marshal.lat.toFixed(4)}, ${marshal.lng.toFixed(4)}</div>

          ${isAssigned ? `
            <div class="assigned-staff">
              <div class="staff-name">${assignment.staffName}</div>
              <div class="staff-email">${assignment.staffEmail}</div>
            </div>
          ` : ''}

          ${isAssigned ? `
            <button class="action-btn change-btn" onclick="staffPage.openAssignmentModalForMarshal('${marshal.id}', true)">
              Change Assignment
            </button>
            <button class="action-btn remove-btn" onclick="staffPage.removeAssignment('${assignment.assignmentId}')">
              Remove Assignment
            </button>
          ` : `
            <button class="action-btn assign-btn" onclick="staffPage.openAssignmentModalForMarshal('${marshal.id}', false)">
              + Assign Marshal
            </button>
          `}
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  renderStaffList() {
    const grid = document.getElementById('staff-grid');
    const filterRole = document.getElementById('role-filter').value;

    if (this.staffList.length === 0) {
      grid.innerHTML = '<div class="loading">No staff members added yet</div>';
      return;
    }

    const roles = [
      'Event Director',
      'Event Safety Officer',
      'Event Coordinator',
      'Operations Staff',
      'Marshal',
      'Volunteer'
    ];

    let html = '';

    roles.forEach(role => {
      const staffInRole = this.staffList.filter(staff =>
        staff.staff_roles.some(r => r.role === role)
      );

      if (staffInRole.length === 0) return;
      if (filterRole && filterRole !== role) return;

      html += `
        <div class="staff-role-section">
          <div class="staff-role-title">${role} (${staffInRole.length})</div>
          <div class="staff-role-grid">
            ${staffInRole.map(staff => `
              <div class="staff-card">
                <div class="staff-name">${staff.name}</div>
                <div class="staff-info">📧 ${staff.email}</div>
                <div class="staff-info">📱 ${staff.phone}</div>
                ${staff.id_number ? `<div class="staff-info">🆔 ${staff.id_number}</div>` : ''}

                <div class="staff-actions">
                  <button class="btn btn-primary btn-sm" data-assign="${staff.id}" onclick="staffPage.openAssignmentModalForStaff('${staff.id}')">
                    Assign
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="staffPage.editStaff('${staff.id}')">
                    Edit
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="staffPage.deleteStaff('${staff.id}')">
                    Delete
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  renderAssignmentsList() {
    const container = document.getElementById('assignments-container');
    if (!container) return;

    if (this.assignmentsList.length === 0) {
      container.innerHTML = '<div class="loading">No assignments yet</div>';
      return;
    }

    const html = this.assignmentsList.map(assignment => `
      <div class="assignment-item">
        <div class="assignment-header">
          <div class="assignment-staff-info">
            <div class="assignment-staff-name">${assignment.event_staff?.name || 'Unknown'}</div>
            <div class="assignment-area">${assignment.assignment}</div>
            <div class="assignment-time">
              ${assignment.start_time ? `<span>Start: ${new Date(assignment.start_time).toLocaleTimeString()}</span>` : ''}
              ${assignment.end_time ? `<span>End: ${new Date(assignment.end_time).toLocaleTimeString()}</span>` : ''}
            </div>
          </div>
          <span class="assignment-status ${assignment.status}">${assignment.status.toUpperCase()}</span>
        </div>

        <div class="assignment-actions">
          <button class="btn btn-secondary btn-sm" onclick="staffPage.editAssignment('${assignment.id}')">
            Edit
          </button>
          <button class="btn btn-secondary btn-sm" onclick="staffPage.removeAssignment('${assignment.id}')">
            Remove
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(tabId)?.classList.add('active');
      });
    });

    // Add staff button
    document.getElementById('add-staff-btn')?.addEventListener('click', () => {
      this.openStaffModal();
    });

    // Staff form submit
    document.getElementById('staff-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveStaff();
    });

    // Assignment form submit
    document.getElementById('assignment-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAssignment();
    });

    // Assignment type change
    document.getElementById('assignment-type')?.addEventListener('change', (e) => {
      const customGroup = document.getElementById('custom-assignment-group');
      const marshalGroup = document.getElementById('marshal-position-group');

      if (e.target.value === 'marshal-position') {
        customGroup.style.display = 'none';
        marshalGroup.style.display = 'block';
        document.getElementById('assignment-name').removeAttribute('required');
        document.getElementById('assignment-marshal-position').setAttribute('required', 'required');
      } else {
        customGroup.style.display = 'block';
        marshalGroup.style.display = 'none';
        document.getElementById('assignment-name').setAttribute('required', 'required');
        document.getElementById('assignment-marshal-position').removeAttribute('required');
      }
    });

    // Modal close buttons
    document.getElementById('close-staff-modal')?.addEventListener('click', () => {
      this.closeStaffModal();
    });

    document.getElementById('close-assignment-modal')?.addEventListener('click', () => {
      this.closeAssignmentModal();
    });

    document.getElementById('cancel-staff')?.addEventListener('click', () => {
      this.closeStaffModal();
    });

    document.getElementById('cancel-assignment')?.addEventListener('click', () => {
      this.closeAssignmentModal();
    });

    // Back button
    document.getElementById('back-btn-staff')?.addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    // Role filter
    document.getElementById('role-filter')?.addEventListener('change', () => {
      this.renderStaffList();
    });

    // Populate staff dropdown for assignments
    this.populateStaffDropdown();
    this.populateMarshalPositionDropdown();
  }

  populateStaffDropdown() {
    const select = document.getElementById('assignment-staff');
    if (!select) return;

    const options = this.staffList
      .map(staff => `<option value="${staff.id}">${staff.name} (${staff.email})</option>`)
      .join('');

    select.innerHTML = '<option value="">Select a staff member</option>' + options;
  }

  populateMarshalPositionDropdown() {
    const select = document.getElementById('assignment-marshal-position');
    if (!select) return;

    const options = this.marshalLocations
      .map(marshal => `<option value="MARSHAL-${marshal.id}">${marshal.name}</option>`)
      .join('');

    select.innerHTML = '<option value="">Select a marshal position</option>' + options;
  }

  openStaffModal() {
    this.currentAssignmentId = null;
    document.getElementById('modal-title').textContent = 'Add Staff Member';
    document.getElementById('staff-form').reset();
    document.getElementById('error-message').classList.remove('show');
    document.getElementById('staff-modal').style.display = 'flex';
  }

  closeStaffModal() {
    document.getElementById('staff-modal').style.display = 'none';
  }

  openAssignmentModalForStaff(staffId) {
    this.selectedMarshalPosition = null;
    this.currentAssignmentId = null;
    document.getElementById('assignment-modal-title').textContent = 'Create Assignment';
    document.getElementById('assignment-form').reset();
    document.getElementById('assignment-type').value = 'custom';
    document.getElementById('custom-assignment-group').style.display = 'block';
    document.getElementById('marshal-position-group').style.display = 'none';
    document.getElementById('assignment-staff').value = staffId;
    document.getElementById('assignment-error-message').classList.remove('show');
    document.getElementById('assignment-modal').style.display = 'flex';
  }

  openAssignmentModalForMarshal(marshalId, isEdit = false) {
    this.selectedMarshalPosition = marshalId;
    this.currentAssignmentId = null;

    const assignment = this.marshalAssignments[marshalId];
    const marshal = this.marshalLocations.find(m => m.id === marshalId);

    if (isEdit && assignment) {
      document.getElementById('assignment-modal-title').textContent = 'Edit Assignment';
      this.currentAssignmentId = assignment.assignmentId;
      document.getElementById('assignment-staff').value = assignment.staffId;
    } else {
      document.getElementById('assignment-modal-title').textContent = `Assign to ${marshal?.name}`;
      document.getElementById('assignment-form').reset();
    }

    document.getElementById('assignment-type').value = 'marshal-position';
    document.getElementById('custom-assignment-group').style.display = 'none';
    document.getElementById('marshal-position-group').style.display = 'block';
    document.getElementById('assignment-marshal-position').value = `MARSHAL-${marshalId}`;
    document.getElementById('assignment-error-message').classList.remove('show');
    document.getElementById('assignment-modal').style.display = 'flex';
  }

  closeAssignmentModal() {
    this.selectedMarshalPosition = null;
    this.currentAssignmentId = null;
    document.getElementById('assignment-modal').style.display = 'none';
  }

  async saveStaff() {
    const name = document.getElementById('staff-name').value;
    const email = document.getElementById('staff-email').value;
    const phone = document.getElementById('staff-phone').value;
    const altPhone = document.getElementById('staff-alt-phone').value;
    const idNumber = document.getElementById('staff-id').value;
    const roles = Array.from(document.querySelectorAll('.role-checkbox:checked')).map(cb => cb.value);
    const errorMsg = document.getElementById('error-message');

    if (!name || !email || !phone || roles.length === 0) {
      errorMsg.textContent = 'Please fill in all required fields';
      errorMsg.classList.add('show');
      return;
    }

    try {
      const staffData = {
        event_id: this.currentEvent,
        name,
        email,
        phone,
        alt_phone: altPhone || null,
        id_number: idNumber || null
      };

      const { data, error } = await supabase
        .from('event_staff')
        .insert([staffData])
        .select();

      if (error) throw error;

      const staffId = data[0].id;

      // Insert roles
      const roleInserts = roles.map(role => ({
        staff_id: staffId,
        role
      }));

      const { error: roleError } = await supabase
        .from('staff_roles')
        .insert(roleInserts);

      if (roleError) throw roleError;

      this.closeStaffModal();
      await this.loadStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      errorMsg.textContent = error.message || 'Failed to save staff member';
      errorMsg.classList.add('show');
    }
  }

  async saveAssignment() {
    const staffId = document.getElementById('assignment-staff').value;
    const assignmentType = document.getElementById('assignment-type').value;
    const assignmentName = assignmentType === 'custom'
      ? document.getElementById('assignment-name').value
      : document.getElementById('assignment-marshal-position').value;
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

  editStaff(staffId) {
    const staff = this.staffList.find(s => s.id === staffId);
    if (!staff) return;

    document.getElementById('modal-title').textContent = 'Edit Staff Member';
    document.getElementById('staff-name').value = staff.name;
    document.getElementById('staff-email').value = staff.email;
    document.getElementById('staff-phone').value = staff.phone;
    document.getElementById('staff-alt-phone').value = staff.alt_phone || '';
    document.getElementById('staff-id').value = staff.id_number || '';

    document.querySelectorAll('.role-checkbox').forEach(cb => {
      cb.checked = staff.staff_roles.some(r => r.role === cb.value);
    });

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
      alert('Failed to delete staff member: ' + error.message);
    }
  }

  editAssignment(assignmentId) {
    const assignment = this.assignmentsList.find(a => a.id === assignmentId);
    if (!assignment) return;

    this.currentAssignmentId = assignmentId;
    document.getElementById('assignment-modal-title').textContent = 'Edit Assignment';

    document.getElementById('assignment-staff').value = assignment.staff_id;
    document.getElementById('assignment-status').value = assignment.status;

    if (assignment.assignment.startsWith('MARSHAL-')) {
      document.getElementById('assignment-type').value = 'marshal-position';
      document.getElementById('assignment-marshal-position').value = assignment.assignment;
      document.getElementById('custom-assignment-group').style.display = 'none';
      document.getElementById('marshal-position-group').style.display = 'block';
    } else {
      document.getElementById('assignment-type').value = 'custom';
      document.getElementById('assignment-name').value = assignment.assignment;
      document.getElementById('custom-assignment-group').style.display = 'block';
      document.getElementById('marshal-position-group').style.display = 'none';
    }

    if (assignment.start_time) {
      const start = new Date(assignment.start_time);
      document.getElementById('assignment-start').value = start.toTimeString().slice(0, 5);
    }

    if (assignment.end_time) {
      const end = new Date(assignment.end_time);
      document.getElementById('assignment-end').value = end.toTimeString().slice(0, 5);
    }

    document.getElementById('assignment-error-message').classList.remove('show');
    document.getElementById('assignment-modal').style.display = 'flex';
  }

  async removeAssignment(assignmentId) {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('staff_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      await this.loadAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment: ' + error.message);
    }
  }
}

// Global instance
window.staffPage = new StaffPage();
const staffPage = window.staffPage;

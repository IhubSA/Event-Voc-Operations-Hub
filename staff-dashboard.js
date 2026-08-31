// Staff Dashboard
// Personal dashboard for staff members to check in/out, view assignments, and manage their profile
import { supabase } from './supabase.js';

export class StaffDashboard {
  constructor() {
    this.staffId = null;
    this.staffData = null;
    this.currentEvent = null;
    this.assignments = [];
    this.checkinHistory = [];
    this.roles = [];
  }

  async render(staffId, staffData, onLogout) {
    this.staffId = staffId;
    this.staffData = staffData;

    const container = document.getElementById('app');

    const dashboardHtml = `
      <div class="staff-dashboard-container">
        <!-- Header/Navbar -->
        <nav class="staff-navbar">
          <div class="navbar-content">
            <div class="navbar-left">
              <div class="staff-badge">👥 Staff Portal</div>
              <h1 class="navbar-title">Welcome, ${staffData.name}</h1>
            </div>
            <div class="navbar-right">
              <button class="btn btn-sm btn-secondary" id="logout-btn">Logout</button>
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <div class="staff-dashboard-content">
          <!-- Profile Card -->
          <div class="dashboard-section">
            <h2>Your Information</h2>
            <div class="profile-card">
              <div class="profile-left">
                <div class="profile-avatar">${staffData.name.charAt(0).toUpperCase()}</div>
              </div>
              <div class="profile-details">
                <div class="profile-item">
                  <span class="label">Name:</span>
                  <span class="value">${staffData.name}</span>
                </div>
                <div class="profile-item">
                  <span class="label">Email:</span>
                  <span class="value">${staffData.email}</span>
                </div>
                <div class="profile-item">
                  <span class="label">Phone:</span>
                  <span class="value">${staffData.phone}</span>
                </div>
                ${staffData.id_number ? `
                  <div class="profile-item">
                    <span class="label">ID Number:</span>
                    <span class="value">${staffData.id_number}</span>
                  </div>
                ` : ''}
              </div>
              <div class="profile-roles">
                <h3>Your Roles</h3>
                <div class="roles-list" id="roles-list">
                  <div class="loading">Loading roles...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Check-In/Out Section -->
          <div class="dashboard-section">
            <h2>Check-In/Out</h2>
            <div class="checkin-section">
              <div class="checkin-status" id="checkin-status">
                <div class="status-indicator" id="status-indicator"></div>
                <div class="status-text" id="status-text">Loading status...</div>
              </div>

              <div class="checkin-buttons">
                <button class="btn btn-primary btn-large" id="checkin-btn">
                  ✓ Check In
                </button>
                <button class="btn btn-warning btn-large" id="checkout-btn">
                  ✗ Check Out
                </button>
              </div>

              <div class="checkin-history" id="checkin-history">
                <h3>Today's History</h3>
                <div class="history-list" id="history-list">
                  <div class="loading">Loading check-in history...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Assignments Section -->
          <div class="dashboard-section">
            <h2>Your Assignments</h2>
            <div class="assignments-section">
              <div class="assignments-list" id="assignments-list">
                <div class="loading">Loading assignments...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = dashboardHtml;

    // Add styles
    this.addStyles();

    // Load data
    await this.loadData();

    // Setup event listeners
    this.setupEventListeners(onLogout);
  }

  async loadData() {
    try {
      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('staff_roles')
        .select('role')
        .eq('staff_id', this.staffId);

      if (rolesError) throw rolesError;
      this.roles = rolesData || [];
      this.renderRoles();

      // Load assignments for this staff member
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('staff_assignments')
        .select('*')
        .eq('staff_id', this.staffId)
        .order('start_time', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      this.assignments = assignmentsData || [];
      this.renderAssignments();

      // Load check-in history for today
      const today = new Date().toISOString().split('T')[0];
      const { data: checkinData, error: checkinError } = await supabase
        .from('staff_checkin')
        .select('*')
        .eq('staff_id', this.staffId)
        .gte('check_in_time', `${today}T00:00:00`)
        .order('check_in_time', { ascending: false });

      if (checkinError) throw checkinError;
      this.checkinHistory = checkinData || [];
      this.updateCheckinStatus();
      this.renderCheckinHistory();
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  }

  renderRoles() {
    const rolesList = document.getElementById('roles-list');
    if (this.roles.length === 0) {
      rolesList.innerHTML = '<div class="no-data">No roles assigned</div>';
      return;
    }

    rolesList.innerHTML = this.roles.map(role => `
      <div class="role-tag">${role.role}</div>
    `).join('');
  }

  renderAssignments() {
    const assignmentsList = document.getElementById('assignments-list');
    if (this.assignments.length === 0) {
      assignmentsList.innerHTML = '<div class="no-data">No assignments at this time</div>';
      return;
    }

    assignmentsList.innerHTML = this.assignments.map(assignment => {
      const statusClass = assignment.status === 'completed' ? 'completed' :
                         assignment.status === 'assigned' ? 'assigned' : 'pending';
      const startTime = assignment.start_time ? new Date(assignment.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBA';
      const endTime = assignment.end_time ? new Date(assignment.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBA';

      return `
        <div class="assignment-item">
          <div class="assignment-header">
            <div class="assignment-name">${assignment.assignment}</div>
            <div class="assignment-status ${statusClass}">
              ${assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </div>
          </div>
          <div class="assignment-time">
            ⏱️ ${startTime} - ${endTime}
          </div>
        </div>
      `;
    }).join('');
  }

  renderCheckinHistory() {
    const historyList = document.getElementById('history-list');
    if (this.checkinHistory.length === 0) {
      historyList.innerHTML = '<div class="no-data">No check-ins today</div>';
      return;
    }

    historyList.innerHTML = this.checkinHistory.map(checkin => {
      const checkInTime = new Date(checkin.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const checkOutTime = checkin.check_out_time ? new Date(checkin.check_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Not checked out';

      return `
        <div class="history-item">
          <div class="history-time">
            <span class="in-time">In: ${checkInTime}</span>
            <span class="out-time">Out: ${checkOutTime}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCheckinStatus() {
    const statusDiv = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const checkinBtn = document.getElementById('checkin-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Check if currently checked in
    const lastCheckin = this.checkinHistory[0];
    const isCheckedIn = lastCheckin && !lastCheckin.check_out_time;

    if (isCheckedIn) {
      statusDiv.className = 'status-indicator checked-in';
      statusText.textContent = '✓ Currently Checked In';
      checkinBtn.disabled = true;
      checkoutBtn.disabled = false;
    } else {
      statusDiv.className = 'status-indicator checked-out';
      statusText.textContent = '✗ Currently Checked Out';
      checkinBtn.disabled = false;
      checkoutBtn.disabled = true;
    }
  }

  async performCheckIn() {
    try {
      const { error } = await supabase
        .from('staff_checkin')
        .insert([{
          staff_id: this.staffId,
          event_id: this.staffData.event_id,
          check_in_time: new Date().toISOString()
        }]);

      if (error) throw error;

      // Reload data
      await this.loadData();
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. Please try again.');
    }
  }

  async performCheckOut() {
    try {
      const lastCheckin = this.checkinHistory[0];
      if (!lastCheckin) {
        alert('No active check-in found');
        return;
      }

      const { error } = await supabase
        .from('staff_checkin')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', lastCheckin.id);

      if (error) throw error;

      // Reload data
      await this.loadData();
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Failed to check out. Please try again.');
    }
  }

  setupEventListeners(onLogout) {
    document.getElementById('logout-btn').addEventListener('click', async () => {
      try {
        await supabase.auth.signOut();
        onLogout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    });

    document.getElementById('checkin-btn').addEventListener('click', () => {
      this.performCheckIn();
    });

    document.getElementById('checkout-btn').addEventListener('click', () => {
      this.performCheckOut();
    });
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .staff-dashboard-container {
        min-height: 100vh;
        background: var(--bg-secondary);
      }

      .staff-navbar {
        background: var(--bg-primary);
        border-bottom: 3px solid var(--primary);
        padding: 1.5rem 2rem;
        box-shadow: var(--shadow-md);
      }

      .navbar-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
      }

      .navbar-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .staff-badge {
        background: var(--primary);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .navbar-title {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.5rem;
      }

      .navbar-right {
        display: flex;
        gap: 1rem;
      }

      .staff-dashboard-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .dashboard-section {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        box-shadow: var(--shadow-md);
      }

      .dashboard-section h2 {
        margin: 0 0 1.5rem 0;
        color: var(--primary);
        font-size: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border-color);
      }

      .profile-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 2rem;
        align-items: flex-start;
      }

      .profile-avatar {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: white;
        font-weight: 700;
        box-shadow: var(--shadow-lg);
      }

      .profile-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .profile-item {
        display: flex;
        gap: 1rem;
      }

      .profile-item .label {
        font-weight: 600;
        color: var(--text-secondary);
        min-width: 100px;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.3px;
      }

      .profile-item .value {
        color: var(--text-primary);
        font-size: 1rem;
      }

      .profile-roles {
        padding-left: 1rem;
        border-left: 2px solid var(--border-color);
      }

      .profile-roles h3 {
        margin: 0 0 0.75rem 0;
        color: var(--text-primary);
        font-size: 0.95rem;
      }

      .roles-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .role-tag {
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: white;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .checkin-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .checkin-status {
        background: rgba(0, 153, 255, 0.05);
        border: 2px solid var(--primary);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .status-indicator {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      .status-indicator.checked-in {
        background: #4CAF50;
      }

      .status-indicator.checked-out {
        background: #f44336;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .status-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .checkin-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .btn-large {
        padding: 1rem;
        font-size: 1rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .btn-large:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .btn-large:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .checkin-history {
        border-top: 2px solid var(--border-color);
        padding-top: 1.5rem;
      }

      .checkin-history h3 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
        font-size: 1rem;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .history-item {
        background: rgba(0, 153, 255, 0.05);
        border-left: 3px solid var(--primary);
        padding: 1rem;
        border-radius: 6px;
      }

      .history-time {
        display: flex;
        gap: 2rem;
        font-size: 0.95rem;
      }

      .in-time, .out-time {
        display: flex;
        flex-direction: column;
      }

      .in-time::before {
        content: '✓ Check In: ';
        font-weight: 600;
        color: #4CAF50;
      }

      .out-time::before {
        content: '✗ Check Out: ';
        font-weight: 600;
        color: #f44336;
      }

      .assignments-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .assignment-item {
        background: rgba(0, 153, 255, 0.05);
        border: 1px solid var(--border-color);
        border-radius: 8px;
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
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .assignment-name {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .assignment-status {
        display: inline-block;
        padding: 0.35rem 0.7rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
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

      .assignment-time {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
      }

      .no-data {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
        font-style: italic;
      }

      @media (max-width: 768px) {
        .navbar-content {
          flex-direction: column;
          gap: 1rem;
        }

        .navbar-left {
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .navbar-title {
          font-size: 1.25rem;
        }

        .navbar-right {
          width: 100%;
        }

        .navbar-right .btn {
          width: 100%;
        }

        .staff-dashboard-content {
          padding: 1rem;
        }

        .dashboard-section {
          padding: 1.5rem;
        }

        .profile-card {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .checkin-buttons {
          grid-template-columns: 1fr;
        }

        .history-time {
          flex-direction: column;
          gap: 0.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Participants Management Module
// Admin interface for managing event participants
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';

export class ParticipantsPage {
  constructor() {
    this.currentEvent = null;
    this.currentUser = null;
    this.participantsList = [];
    this.onBack = null;
  }

  async render(eventId, currentUser, onBack, onOpenClubSettings) {
    this.currentEvent = eventId;
    this.currentUser = currentUser;
    this.onBack = onBack;

    const container = document.getElementById('app');

    // Render navbar
    const navbar = new Navbar(currentUser, () => {}, null, onOpenClubSettings);
    const navbarHtml = navbar.render();

    const participantsHtml = `
      <div class="participants-dashboard">
        <div class="participants-header">
          <div class="participants-header-top">
            <h1>Participants Management</h1>
            <button class="btn btn-secondary btn-small" id="back-btn-participants">← Back to Dashboard</button>
          </div>
        </div>

        <div class="participants-controls">
          <div class="search-box">
            <input type="text" id="search-input" placeholder="Search by name, email, or registration #..." />
          </div>
          <div class="filter-controls">
            <select id="status-filter">
              <option value="">All Status</option>
              <option value="registered">Registered</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="dnf">DNF (Did Not Finish)</option>
              <option value="disqualified">Disqualified</option>
            </select>
            <select id="category-filter">
              <option value="">All Categories</option>
            </select>
            <button class="btn btn-secondary" id="export-btn">📥 Export List</button>
            <button class="btn btn-primary" id="add-participant-btn">➕ Add Participant</button>
          </div>
        </div>

        <div class="participants-content">
          <div class="participants-stats">
            <div class="stat-card">
              <div class="stat-number" id="total-count">0</div>
              <div class="stat-label">Total Registered</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="checkin-count">0</div>
              <div class="stat-label">Checked In</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="completed-count">0</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="dnf-count">0</div>
              <div class="stat-label">DNF</div>
            </div>
          </div>

          <div class="participants-table">
            <table id="participants-table">
              <thead>
                <tr>
                  <th>Registration #</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Bib #</th>
                  <th>Status</th>
                  <th>Checked In</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="participants-tbody">
                <tr><td colspan="8" class="loading">Loading participants...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Participant Detail Modal -->
        <div class="participants-modal" id="participants-modal" style="display: none;">
          <div class="modal-content">
            <button class="modal-close" id="close-modal">&times;</button>
            <h2 id="modal-title">Participant Details</h2>

            <div class="participant-details" id="participant-details"></div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" id="close-detail-btn">Close</button>
              <button type="button" class="btn btn-primary" id="checkin-btn">Check In</button>
              <button type="button" class="btn btn-success" id="finish-btn">Mark Finished</button>
              <button type="button" class="btn btn-danger" id="delete-btn">Delete</button>
            </div>
          </div>
        </div>

        <!-- Add Participant Modal -->
        <div class="participants-modal" id="add-participant-modal" style="display: none;">
          <div class="modal-content modal-large">
            <button class="modal-close" id="close-add-modal">&times;</button>
            <h2>Add New Participant</h2>

            <form id="add-participant-form" class="add-participant-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="add-first-name">First Name *</label>
                  <input type="text" id="add-first-name" name="firstName" required />
                </div>
                <div class="form-group">
                  <label for="add-last-name">Last Name *</label>
                  <input type="text" id="add-last-name" name="lastName" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="add-email">Email *</label>
                  <input type="email" id="add-email" name="email" required />
                </div>
                <div class="form-group">
                  <label for="add-phone">Phone</label>
                  <input type="tel" id="add-phone" name="phone" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="add-category">Category *</label>
                  <select id="add-category" name="category" required>
                    <option value="">Select a category</option>
                    <option value="Adult">Adult</option>
                    <option value="Youth">Youth</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="5K">5K</option>
                    <option value="10K">10K</option>
                    <option value="Half Marathon">Half Marathon</option>
                    <option value="Marathon">Marathon</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="add-age-group">Age Group</label>
                  <select id="add-age-group" name="ageGroup">
                    <option value="">Select age group</option>
                    <option value="Under 18">Under 18</option>
                    <option value="18-25">18-25</option>
                    <option value="26-35">26-35</option>
                    <option value="36-45">36-45</option>
                    <option value="46-55">46-55</option>
                    <option value="56-65">56-65</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="add-blood-type">Blood Type</label>
                  <select id="add-blood-type" name="bloodType">
                    <option value="">Select blood type</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="add-medical-conditions">Medical Conditions</label>
                <textarea id="add-medical-conditions" name="medicalConditions" placeholder="e.g., Asthma, Diabetes, Heart Condition"></textarea>
              </div>

              <div class="form-group">
                <label for="add-allergies">Allergies</label>
                <textarea id="add-allergies" name="allergies" placeholder="Food, medication, environmental allergies"></textarea>
              </div>

              <div class="form-group">
                <label for="add-medications">Current Medications</label>
                <textarea id="add-medications" name="medications" placeholder="List any medications being taken"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="add-medical-aid">Medical Aid Provider</label>
                  <input type="text" id="add-medical-aid" name="medicalAidProvider" placeholder="e.g., Discovery, Medshield, Bonitas" />
                </div>
                <div class="form-group">
                  <label for="add-medical-aid-number">Medical Aid Member #</label>
                  <input type="text" id="add-medical-aid-number" name="medicalAidMemberNumber" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="add-doctor-name">Doctor/GP Name</label>
                  <input type="text" id="add-doctor-name" name="doctorName" />
                </div>
                <div class="form-group">
                  <label for="add-doctor-phone">Doctor Phone</label>
                  <input type="tel" id="add-doctor-phone" name="doctorPhone" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="add-emergency-name">Emergency Contact Name</label>
                  <input type="text" id="add-emergency-name" name="emergencyContactName" />
                </div>
                <div class="form-group">
                  <label for="add-emergency-relationship">Relationship</label>
                  <select id="add-emergency-relationship" name="emergencyContactRelationship">
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="add-emergency-phone">Emergency Contact Phone</label>
                <input type="tel" id="add-emergency-phone" name="emergencyContactPhone" />
              </div>

              <div id="add-message" class="add-message"></div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="cancel-add-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="submit-add-btn">Add Participant</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = wrapWithShell(navbarHtml, participantsHtml);

    // Add styles
    this.addStyles();

    // Load participants
    await this.loadParticipants();
    this.setupEventListeners();
  }

  async loadParticipants() {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', this.currentEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.participantsList = data || [];
      this.renderParticipantsTable();
      this.updateStats();
      this.populateCategoryFilter();
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  }

  renderParticipantsTable() {
    const tbody = document.getElementById('participants-tbody');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;

    let filtered = this.participantsList;

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.first_name.toLowerCase().includes(searchTerm) ||
        p.last_name.toLowerCase().includes(searchTerm) ||
        p.email.toLowerCase().includes(searchTerm) ||
        p.registration_number.toLowerCase().includes(searchTerm)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data">No participants found</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(participant => {
      const checkedInTime = participant.checked_in_at
        ? new Date(participant.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '-';

      const statusClass = participant.status === 'completed' ? 'completed' :
                         participant.status === 'checked_in' ? 'checked-in' :
                         participant.status === 'dnf' ? 'dnf' :
                         participant.status === 'disqualified' ? 'disqualified' : 'registered';

      return `
        <tr class="participant-row" data-id="${participant.id}">
          <td><strong>${participant.registration_number}</strong></td>
          <td>${participant.first_name} ${participant.last_name}</td>
          <td>${participant.email}</td>
          <td>${participant.category || '-'}</td>
          <td>${participant.bib_number || '-'}</td>
          <td><span class="status-badge ${statusClass}">${participant.status.replace('_', ' ').toUpperCase()}</span></td>
          <td>${checkedInTime}</td>
          <td>
            <button class="btn btn-sm btn-primary" data-view="${participant.id}">View</button>
          </td>
        </tr>
      `;
    }).join('');

    // Add event listeners
    tbody.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => this.showParticipantDetail(btn.dataset.view));
    });
  }

  showParticipantDetail(participantId) {
    const participant = this.participantsList.find(p => p.id === participantId);
    if (!participant) return;

    const detailsDiv = document.getElementById('participant-details');
    const statusClass = participant.status === 'completed' ? 'completed' :
                       participant.status === 'checked_in' ? 'checked-in' :
                       participant.status === 'dnf' ? 'dnf' :
                       participant.status === 'disqualified' ? 'disqualified' : 'registered';

    detailsDiv.innerHTML = `
      <div class="detail-section">
        <h3>Personal Information</h3>
        <div class="detail-item">
          <span class="label">Registration Number:</span>
          <span class="value">${participant.registration_number}</span>
        </div>
        <div class="detail-item">
          <span class="label">Name:</span>
          <span class="value">${participant.first_name} ${participant.last_name}</span>
        </div>
        <div class="detail-item">
          <span class="label">Email:</span>
          <span class="value">${participant.email}</span>
        </div>
        ${participant.phone ? `
          <div class="detail-item">
            <span class="label">Phone:</span>
            <span class="value">${participant.phone}</span>
          </div>
        ` : ''}
      </div>

      <div class="detail-section">
        <h3>Event Information</h3>
        <div class="detail-item">
          <span class="label">Category:</span>
          <span class="value">${participant.category || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Age Group:</span>
          <span class="value">${participant.age_group || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Bib Number:</span>
          <span class="value">${participant.bib_number || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Status:</span>
          <span class="value"><span class="status-badge ${statusClass}">${participant.status.replace('_', ' ').toUpperCase()}</span></span>
        </div>
      </div>

      <div class="detail-section">
        <h3>Event Timeline</h3>
        <div class="detail-item">
          <span class="label">Registered:</span>
          <span class="value">${new Date(participant.created_at).toLocaleString()}</span>
        </div>
        ${participant.checked_in_at ? `
          <div class="detail-item">
            <span class="label">Checked In:</span>
            <span class="value">${new Date(participant.checked_in_at).toLocaleString()}</span>
          </div>
        ` : ''}
        ${participant.finished_at ? `
          <div class="detail-item">
            <span class="label">Finished:</span>
            <span class="value">${new Date(participant.finished_at).toLocaleString()}</span>
          </div>
        ` : ''}
      </div>

      ${participant.emergency_contact_name || participant.emergency_contact_phone || participant.emergency_contact_relationship ? `
        <div class="detail-section">
          <h3>Emergency Contact</h3>
          ${participant.emergency_contact_name ? `
            <div class="detail-item">
              <span class="label">Name:</span>
              <span class="value">${participant.emergency_contact_name}</span>
            </div>
          ` : ''}
          ${participant.emergency_contact_relationship ? `
            <div class="detail-item">
              <span class="label">Relationship:</span>
              <span class="value">${participant.emergency_contact_relationship}</span>
            </div>
          ` : ''}
          ${participant.emergency_contact_phone ? `
            <div class="detail-item">
              <span class="label">Phone:</span>
              <span class="value">${participant.emergency_contact_phone}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${participant.blood_type || participant.medical_conditions || participant.allergies || participant.medications ? `
        <div class="detail-section">
          <h3>Medical Information</h3>
          ${participant.blood_type ? `
            <div class="detail-item">
              <span class="label">Blood Type:</span>
              <span class="value">${participant.blood_type}</span>
            </div>
          ` : ''}
          ${participant.medical_conditions ? `
            <div class="detail-item">
              <span class="label">Medical Conditions:</span>
              <span class="value">${participant.medical_conditions}</span>
            </div>
          ` : ''}
          ${participant.allergies ? `
            <div class="detail-item">
              <span class="label">Allergies:</span>
              <span class="value">${participant.allergies}</span>
            </div>
          ` : ''}
          ${participant.medications ? `
            <div class="detail-item">
              <span class="label">Current Medications:</span>
              <span class="value">${participant.medications}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${participant.medical_aid_provider || participant.medical_aid_member_number || participant.doctor_name || participant.doctor_phone ? `
        <div class="detail-section">
          <h3>Medical Aid & Doctor Details</h3>
          ${participant.medical_aid_provider ? `
            <div class="detail-item">
              <span class="label">Medical Aid Provider:</span>
              <span class="value">${participant.medical_aid_provider}</span>
            </div>
          ` : ''}
          ${participant.medical_aid_member_number ? `
            <div class="detail-item">
              <span class="label">Medical Aid Member #:</span>
              <span class="value">${participant.medical_aid_member_number}</span>
            </div>
          ` : ''}
          ${participant.doctor_name ? `
            <div class="detail-item">
              <span class="label">Doctor/GP Name:</span>
              <span class="value">${participant.doctor_name}</span>
            </div>
          ` : ''}
          ${participant.doctor_phone ? `
            <div class="detail-item">
              <span class="label">Doctor Phone:</span>
              <span class="value">${participant.doctor_phone}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${participant.race_rules_accepted || participant.terms_accepted || participant.privacy_policy_accepted ? `
        <div class="detail-section">
          <h3>Agreements & Acceptance</h3>
          ${participant.race_rules_accepted ? `
            <div class="detail-item">
              <span class="label">Race Rules Accepted:</span>
              <span class="value">✓ Yes</span>
            </div>
          ` : ''}
          ${participant.terms_accepted ? `
            <div class="detail-item">
              <span class="label">Terms Accepted:</span>
              <span class="value">✓ Yes</span>
            </div>
          ` : ''}
          ${participant.privacy_policy_accepted ? `
            <div class="detail-item">
              <span class="label">Privacy Policy Accepted:</span>
              <span class="value">✓ Yes</span>
            </div>
          ` : ''}
          ${participant.accepted_at ? `
            <div class="detail-item">
              <span class="label">Accepted Date:</span>
              <span class="value">${new Date(participant.accepted_at).toLocaleString()}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

    document.getElementById('modal-title').textContent = `${participant.first_name} ${participant.last_name}`;
    document.getElementById('participants-modal').style.display = 'flex';

    // Setup action buttons
    this.currentParticipantId = participantId;
    this.updateActionButtons(participant);
  }

  updateActionButtons(participant) {
    const checkinBtn = document.getElementById('checkin-btn');
    const finishBtn = document.getElementById('finish-btn');

    // Disable checkin if already checked in
    checkinBtn.disabled = participant.status !== 'registered';
    checkinBtn.textContent = participant.status === 'registered' ? 'Check In' : 'Already Checked In';

    // Disable finish if not checked in
    finishBtn.disabled = participant.status !== 'checked_in';
    finishBtn.textContent = participant.status === 'checked_in' ? 'Mark Finished' : 'Not Checked In';
  }

  updateStats() {
    const total = this.participantsList.length;
    const checkedIn = this.participantsList.filter(p => p.status === 'checked_in').length;
    const completed = this.participantsList.filter(p => p.status === 'completed').length;
    const dnf = this.participantsList.filter(p => p.status === 'dnf').length;

    document.getElementById('total-count').textContent = total;
    document.getElementById('checkin-count').textContent = checkedIn;
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('dnf-count').textContent = dnf;
  }

  populateCategoryFilter() {
    const categories = [...new Set(this.participantsList.map(p => p.category).filter(Boolean))];
    const select = document.getElementById('category-filter');

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  }

  setupEventListeners() {
    // Back button
    document.getElementById('back-btn-participants').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    // Search and filters
    document.getElementById('search-input').addEventListener('input', () => {
      this.renderParticipantsTable();
    });

    document.getElementById('status-filter').addEventListener('change', () => {
      this.renderParticipantsTable();
    });

    document.getElementById('category-filter').addEventListener('change', () => {
      this.renderParticipantsTable();
    });

    // Modal controls
    document.getElementById('close-modal').addEventListener('click', () => {
      document.getElementById('participants-modal').style.display = 'none';
    });

    document.getElementById('close-detail-btn').addEventListener('click', () => {
      document.getElementById('participants-modal').style.display = 'none';
    });

    // Action buttons
    document.getElementById('checkin-btn').addEventListener('click', () => {
      this.checkInParticipant(this.currentParticipantId);
    });

    document.getElementById('finish-btn').addEventListener('click', () => {
      this.finishParticipant(this.currentParticipantId);
    });

    document.getElementById('delete-btn').addEventListener('click', () => {
      this.deleteParticipant(this.currentParticipantId);
    });

    // Export button
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportParticipantsList();
    });

    // Add participant button
    document.getElementById('add-participant-btn').addEventListener('click', () => {
      document.getElementById('add-participant-modal').style.display = 'flex';
    });

    // Close add participant modal
    document.getElementById('close-add-modal').addEventListener('click', () => {
      document.getElementById('add-participant-modal').style.display = 'none';
    });

    document.getElementById('cancel-add-btn').addEventListener('click', () => {
      document.getElementById('add-participant-modal').style.display = 'none';
    });

    // Close modal on background click
    document.getElementById('add-participant-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-participant-modal') {
        document.getElementById('add-participant-modal').style.display = 'none';
      }
    });

    // Add participant form submission
    document.getElementById('add-participant-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddParticipant();
    });
  }

  async checkInParticipant(participantId) {
    try {
      const { error } = await supabase
        .from('participants')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', participantId);

      if (error) throw error;

      await this.loadParticipants();
      const participant = this.participantsList.find(p => p.id === participantId);
      this.showParticipantDetail(participantId);
      alert('Participant checked in successfully');
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in participant');
    }
  }

  async finishParticipant(participantId) {
    try {
      const { error } = await supabase
        .from('participants')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString()
        })
        .eq('id', participantId);

      if (error) throw error;

      await this.loadParticipants();
      this.showParticipantDetail(participantId);
      alert('Participant marked as completed');
    } catch (error) {
      console.error('Finish error:', error);
      alert('Failed to mark participant as finished');
    }
  }

  async deleteParticipant(participantId) {
    if (!confirm('Are you sure you want to delete this participant registration?')) return;

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      document.getElementById('participants-modal').style.display = 'none';
      await this.loadParticipants();
      alert('Participant deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete participant');
    }
  }

  async handleAddParticipant() {
    const form = document.getElementById('add-participant-form');
    const messageDiv = document.getElementById('add-message');
    const submitBtn = document.getElementById('submit-add-btn');

    // Clear previous message
    messageDiv.textContent = '';
    messageDiv.className = 'add-message';

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = {
      event_id: this.currentEvent,
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      category: formData.get('category'),
      age_group: formData.get('ageGroup') || null,
      blood_type: formData.get('bloodType') || null,
      medical_conditions: formData.get('medicalConditions') || null,
      allergies: formData.get('allergies') || null,
      medications: formData.get('medications') || null,
      medical_aid_provider: formData.get('medicalAidProvider') || null,
      medical_aid_member_number: formData.get('medicalAidMemberNumber') || null,
      doctor_name: formData.get('doctorName') || null,
      doctor_phone: formData.get('doctorPhone') || null,
      emergency_contact_name: formData.get('emergencyContactName') || null,
      emergency_contact_relationship: formData.get('emergencyContactRelationship') || null,
      emergency_contact_phone: formData.get('emergencyContactPhone') || null,
      race_rules_accepted: true,
      terms_accepted: true,
      privacy_policy_accepted: true,
      accepted_at: new Date().toISOString(),
      status: 'registered'
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
      // Check if email already registered for this event
      const { data: existing, error: checkError } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', this.currentEvent)
        .eq('email', data.email)
        .single();

      if (existing) {
        throw new Error('This email is already registered for this event');
      }

      // Generate registration number using custom format
      const { data: registrationNum, error: numError } = await supabase
        .rpc('get_next_registration_number_custom', { p_event_id: this.currentEvent });

      if (numError) throw numError;

      data.registration_number = registrationNum;

      // Auto-assign bib number if enabled in settings
      const { data: settings } = await supabase
        .from('event_settings')
        .select('auto_assign_bibs')
        .eq('event_id', this.currentEvent)
        .single();

      if (settings?.auto_assign_bibs) {
        const { data: bibNum } = await supabase
          .rpc('get_next_bib_number', { p_event_id: this.currentEvent });
        data.bib_number = bibNum;
      }

      // Insert participant
      const { error: insertError } = await supabase
        .from('participants')
        .insert([data]);

      if (insertError) throw insertError;

      // Show success message
      messageDiv.className = 'add-message success';
      messageDiv.textContent = `✓ Participant "${data.first_name} ${data.last_name}" added successfully with registration #${registrationNum}`;

      // Reset form
      form.reset();

      // Reload participants list
      setTimeout(() => {
        document.getElementById('add-participant-modal').style.display = 'none';
        this.loadParticipants();
      }, 1500);
    } catch (error) {
      console.error('Add participant error:', error);
      messageDiv.className = 'add-message error';
      messageDiv.textContent = error.message || 'Failed to add participant. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Participant';
    }
  }

  exportParticipantsList() {
    const csv = [
      ['Registration #', 'First Name', 'Last Name', 'Email', 'Phone', 'Category', 'Age Group', 'Bib #', 'Status', 'Checked In', 'Finished', 'Blood Type', 'Medical Conditions', 'Allergies', 'Medications', 'Medical Aid Provider', 'Medical Aid #', 'Doctor Name', 'Doctor Phone', 'Emergency Contact', 'EC Relationship', 'EC Phone', 'Race Rules Accepted', 'Terms Accepted', 'Privacy Accepted', 'Accepted Date'].join(',')
    ];

    this.participantsList.forEach(p => {
      csv.push([
        p.registration_number,
        p.first_name,
        p.last_name,
        p.email,
        p.phone || '',
        p.category || '',
        p.age_group || '',
        p.bib_number || '',
        p.status,
        p.checked_in_at ? new Date(p.checked_in_at).toLocaleString() : '',
        p.finished_at ? new Date(p.finished_at).toLocaleString() : '',
        p.blood_type || '',
        p.medical_conditions || '',
        p.allergies || '',
        p.medications || '',
        p.medical_aid_provider || '',
        p.medical_aid_member_number || '',
        p.doctor_name || '',
        p.doctor_phone || '',
        p.emergency_contact_name || '',
        p.emergency_contact_relationship || '',
        p.emergency_contact_phone || '',
        p.race_rules_accepted ? 'Yes' : 'No',
        p.terms_accepted ? 'Yes' : 'No',
        p.privacy_policy_accepted ? 'Yes' : 'No',
        p.accepted_at ? new Date(p.accepted_at).toLocaleString() : ''
      ].map(cell => `"${cell}"`).join(','));
    });

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .participants-dashboard {
        min-height: calc(100vh - 60px);
        background: var(--bg-secondary);
        padding: 2rem;
      }

      .participants-header {
        margin-bottom: 2rem;
      }

      .participants-header-top {
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

      .participants-header-top h1 {
        margin: 0;
        color: var(--primary);
        font-size: 2rem;
      }

      .participants-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .search-box {
        flex: 1;
        min-width: 250px;
      }

      .search-box input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .filter-controls {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .filter-controls select {
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
      }

      .participants-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
      }

      .participants-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: rgba(0, 153, 255, 0.05);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
      }

      .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary);
        margin-bottom: 0.5rem;
      }

      .stat-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .participants-table {
        overflow-x: auto;
      }

      .participants-table table {
        width: 100%;
        border-collapse: collapse;
      }

      .participants-table thead {
        background: rgba(0, 153, 255, 0.05);
        border-bottom: 2px solid var(--border-color);
      }

      .participants-table th {
        padding: 1rem;
        text-align: left;
        color: var(--text-primary);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.3px;
      }

      .participants-table td {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
      }

      .participant-row:hover {
        background: rgba(0, 153, 255, 0.05);
      }

      .status-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .status-badge.registered {
        background: rgba(255, 193, 7, 0.2);
        color: #FFC107;
      }

      .status-badge.checked-in {
        background: rgba(33, 150, 243, 0.2);
        color: #2196F3;
      }

      .status-badge.completed {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
      }

      .status-badge.dnf {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
      }

      .status-badge.disqualified {
        background: rgba(156, 39, 176, 0.2);
        color: #9C27B0;
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

      .participants-modal {
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

      .participants-modal .modal-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .participants-modal .modal-content.modal-large {
        max-width: 700px;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-secondary);
        float: right;
      }

      .detail-section {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
      }

      .detail-section h3 {
        margin: 0 0 1rem 0;
        color: var(--primary);
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }

      .detail-item .label {
        font-weight: 600;
        color: var(--text-secondary);
      }

      .detail-item .value {
        color: var(--text-primary);
        text-align: right;
      }

      .medical-info {
        background: rgba(0, 153, 255, 0.05);
        border-left: 3px solid var(--primary);
        padding: 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .add-participant-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .add-participant-form .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .add-participant-form .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .add-participant-form label {
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .add-participant-form input,
      .add-participant-form select,
      .add-participant-form textarea {
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-size: 0.9rem;
        font-family: inherit;
        transition: all 0.3s ease;
      }

      .add-participant-form input:focus,
      .add-participant-form select:focus,
      .add-participant-form textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
      }

      .add-participant-form textarea {
        resize: vertical;
        min-height: 80px;
      }

      .add-message {
        padding: 1rem;
        border-radius: 8px;
        display: none;
      }

      .add-message.success {
        display: block;
        background: rgba(76, 175, 80, 0.1);
        border: 2px solid #4CAF50;
        color: #4CAF50;
      }

      .add-message.error {
        display: block;
        background: rgba(255, 107, 107, 0.1);
        border: 2px solid #ff6b6b;
        color: #ff6b6b;
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--border-color);
      }

      .modal-actions .btn {
        flex: 1;
      }

      @media (max-width: 768px) {
        .participants-dashboard {
          padding: 1rem;
        }

        .participants-header-top {
          flex-direction: column;
          gap: 1rem;
        }

        .participants-controls {
          flex-direction: column;
        }

        .search-box {
          min-width: unset;
        }

        .filter-controls {
          flex-direction: column;
          width: 100%;
        }

        .filter-controls select {
          width: 100%;
        }

        .participants-table table {
          font-size: 0.85rem;
        }

        .participants-table th,
        .participants-table td {
          padding: 0.75rem 0.5rem;
        }

        .participants-modal .modal-content {
          width: 95%;
        }

        .add-participant-form .form-row {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup if needed
  }
}

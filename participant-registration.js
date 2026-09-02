// Participant Registration Form
// Public-facing form for participants to register for events
import { supabase } from './supabase.js';

export class ParticipantRegistration {
  constructor() {
    this.eventId = null;
    this.eventData = null;
    this.isSubmitting = false;
    this.lookupTimeout = null;
  }

  async render(eventId, onSuccess, onBack) {
    this.eventId = eventId;
    this.onBack = onBack;

    // Fetch event details
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      this.eventData = event;
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Could not load event details');
      return;
    }

    const container = document.getElementById('app');

    const registrationHtml = `
      <div class="participant-registration-container">
        <div class="registration-background"></div>

        <div class="registration-content">
          ${onBack ? `<button type="button" class="btn-back-link" id="reg-back-link">← Back to races</button>` : ''}
          <div class="registration-card">
            <div class="registration-header">
              <div class="event-info">
                <h1>${this.eventData.name}</h1>
                <p class="event-date">
                  📅 ${new Date(this.eventData.start_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p class="event-location">📍 ${this.eventData.location}</p>
              </div>
              <div class="registration-badge">
                📝 Event Registration
              </div>
            </div>

            <form id="registration-form" class="registration-form">
              <div class="form-section">
                <h3>Personal Information</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="first-name">First Name *</label>
                    <input type="text" id="first-name" name="firstName" required />
                  </div>
                  <div class="form-group">
                    <label for="last-name">Last Name *</label>
                    <input type="text" id="last-name" name="lastName" required />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="email">Email Address *</label>
                    <input type="email" id="email" name="email" required />
                    <p class="field-hint">Registered with us before? We'll fill in your contact details automatically.</p>
                  </div>
                  <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" />
                  </div>
                </div>
              </div>

              <div id="returning-participant-banner" class="returning-banner" style="display:none;"></div>

              <div class="form-section">
                <h3>Event Details</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="category">Category/Division *</label>
                    <select id="category" name="category" required>
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
                    <label for="age-group">Age Group</label>
                    <select id="age-group" name="ageGroup">
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
              </div>

              <div class="form-section">
                <h3>Medical Information</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="blood-type">Blood Type</label>
                    <select id="blood-type" name="bloodType">
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
                  <label for="medical-conditions">Medical Conditions</label>
                  <textarea id="medical-conditions" name="medicalConditions" placeholder="e.g., Asthma, Diabetes, Heart Condition, etc."></textarea>
                </div>

                <div class="form-group">
                  <label for="allergies">Allergies</label>
                  <textarea id="allergies" name="allergies" placeholder="Food allergies, medication allergies, environmental allergies, etc."></textarea>
                </div>

                <div class="form-group">
                  <label for="medications">Current Medications</label>
                  <textarea id="medications" name="medications" placeholder="List any medications you are currently taking..."></textarea>
                </div>
              </div>

              <div class="form-section">
                <h3>Medical Aid & Doctor Details</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="medical-aid">Medical Aid Provider</label>
                    <input type="text" id="medical-aid" name="medicalAidProvider" placeholder="e.g., Discovery, Medshield, Bonitas, etc." />
                  </div>
                  <div class="form-group">
                    <label for="medical-aid-number">Medical Aid Member Number</label>
                    <input type="text" id="medical-aid-number" name="medicalAidMemberNumber" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="doctor-name">Doctor/GP Name</label>
                    <input type="text" id="doctor-name" name="doctorName" />
                  </div>
                  <div class="form-group">
                    <label for="doctor-phone">Doctor Phone Number</label>
                    <input type="tel" id="doctor-phone" name="doctorPhone" />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>Emergency Contact Details</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="emergency-name">Emergency Contact Name</label>
                    <input type="text" id="emergency-name" name="emergencyContactName" />
                  </div>
                  <div class="form-group">
                    <label for="emergency-relationship">Relationship</label>
                    <select id="emergency-relationship" name="emergencyContactRelationship">
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

                <div class="form-row">
                  <div class="form-group">
                    <label for="emergency-phone">Emergency Contact Phone</label>
                    <input type="tel" id="emergency-phone" name="emergencyContactPhone" />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>Race Rules & Terms</h3>

                <div class="checkbox-group">
                  <input type="checkbox" id="rules" name="raceRules" required />
                  <label for="rules">
                    I have read and accept the <a href="#" onclick="event.preventDefault(); showRaceRules();">Race Rules & Safety Requirements</a>
                  </label>
                </div>

                <div class="checkbox-group">
                  <input type="checkbox" id="terms" name="terms" required />
                  <label for="terms">
                    I confirm that the information provided is accurate and I agree to the <a href="#" onclick="event.preventDefault(); showTerms();">Event Terms and Conditions</a>
                  </label>
                </div>

                <div class="checkbox-group">
                  <input type="checkbox" id="privacy" name="privacy" required />
                  <label for="privacy">
                    I have read and accept the <a href="#" onclick="event.preventDefault(); showPrivacy();">Privacy Policy</a>
                  </label>
                </div>

                <div class="checkbox-group">
                  <input type="checkbox" id="waiver" name="waiver" required />
                  <label for="waiver">
                    I understand the risks associated with this event and assume full responsibility for my participation
                  </label>
                </div>
              </div>

              <div id="submission-message" class="submission-message"></div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-large" id="submit-btn">
                  Complete Registration
                </button>
              </div>

              <div class="form-note">
                <p>* Required fields</p>
              </div>
            </form>
          </div>

          <div class="registration-info">
            <h3>What's Next?</h3>
            <ul>
              <li>✓ Complete your registration</li>
              <li>✓ Receive confirmation email with your registration number</li>
              <li>✓ Check in at the event</li>
              <li>✓ Receive your bib number</li>
              <li>✓ Start the event!</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = registrationHtml;
    this.addStyles();
    this.setupEventListeners(onSuccess);
  }

  async handleSubmit(onSuccess) {
    if (this.isSubmitting) return;

    const form = document.getElementById('registration-form');
    const messageDiv = document.getElementById('submission-message');
    const submitBtn = document.getElementById('submit-btn');

    // Clear previous message
    messageDiv.textContent = '';
    messageDiv.className = 'submission-message';

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const firstName = formData.get('firstName');
    const email = formData.get('email');

    this.isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
      // Registration number, duplicate check, and the insert itself all happen
      // atomically server-side so this public form never gets direct table access.
      const { data: result, error } = await supabase.rpc('register_participant', {
        p_event_id: this.eventId,
        p_first_name: firstName,
        p_last_name: formData.get('lastName'),
        p_email: email,
        p_phone: formData.get('phone') || null,
        p_category: formData.get('category'),
        p_age_group: formData.get('ageGroup') || null,
        p_emergency_contact_name: formData.get('emergencyContactName') || null,
        p_emergency_contact_relationship: formData.get('emergencyContactRelationship') || null,
        p_emergency_contact_phone: formData.get('emergencyContactPhone') || null,
        p_medical_conditions: formData.get('medicalConditions') || null,
        p_medical_aid_provider: formData.get('medicalAidProvider') || null,
        p_medical_aid_member_number: formData.get('medicalAidMemberNumber') || null,
        p_doctor_name: formData.get('doctorName') || null,
        p_doctor_phone: formData.get('doctorPhone') || null,
        p_allergies: formData.get('allergies') || null,
        p_medications: formData.get('medications') || null,
        p_blood_type: formData.get('bloodType') || null,
        p_terms_accepted: formData.get('terms') ? true : false,
        p_privacy_policy_accepted: formData.get('privacy') ? true : false,
        p_race_rules_accepted: formData.get('raceRules') ? true : false
      });

      if (error) throw error;

      const participant = Array.isArray(result) ? result[0] : result;

      // Show success message
      messageDiv.className = 'submission-message success';
      messageDiv.innerHTML = `
        <div class="success-content">
          <h3>✓ Registration Successful!</h3>
          <p>Thank you for registering, ${firstName}!</p>
          <div class="registration-details">
            <p><strong>Registration Number:</strong> ${participant?.registration_number || ''}</p>
          </div>
          <p style="margin-top: 1.5rem; font-size: 0.95rem;">
            Please save your registration number and bring it to the event check-in.
          </p>
        </div>
      `;

      // Reset form
      form.reset();
      const banner = document.getElementById('returning-participant-banner');
      if (banner) banner.style.display = 'none';

      // Call success callback after delay
      setTimeout(() => {
        if (onSuccess) onSuccess(participant);
      }, 2500);
    } catch (error) {
      console.error('Registration error:', error);
      messageDiv.className = 'submission-message error';
      messageDiv.textContent = error.message || 'Registration failed. Please try again.';
      messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      this.isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Registration';
    }
  }

  async handleEmailLookup() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    const banner = document.getElementById('returning-participant-banner');
    if (!email || !banner) return;

    try {
      const { data, error } = await supabase.rpc('lookup_returning_participant', { p_email: email });
      if (error) throw error;

      const match = Array.isArray(data) ? data[0] : data;
      if (!match) {
        banner.style.display = 'none';
        return;
      }

      // Only fill fields the participant hasn't already typed something into
      const fillIfEmpty = (id, value) => {
        const el = document.getElementById(id);
        if (el && !el.value && value) el.value = value;
      };

      fillIfEmpty('first-name', match.first_name);
      fillIfEmpty('last-name', match.last_name);
      fillIfEmpty('phone', match.phone);
      fillIfEmpty('emergency-name', match.emergency_contact_name);
      fillIfEmpty('emergency-phone', match.emergency_contact_phone);
      if (match.emergency_contact_relationship) {
        const relSelect = document.getElementById('emergency-relationship');
        if (relSelect && !relSelect.value) relSelect.value = match.emergency_contact_relationship;
      }
      if (match.age_group) {
        const ageSelect = document.getElementById('age-group');
        if (ageSelect && !ageSelect.value) ageSelect.value = match.age_group;
      }

      banner.style.display = 'block';
      banner.innerHTML = `👋 Welcome back${match.first_name ? ', ' + match.first_name : ''}! We've filled in your contact details from a previous registration — medical info still needs to be entered fresh each time.`;
    } catch (error) {
      console.error('Returning participant lookup failed:', error);
    }
  }

  setupEventListeners(onSuccess) {
    document.getElementById('registration-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(onSuccess);
    });

    // Look up returning participants by email (debounced) to prefill contact details
    const emailInput = document.getElementById('email');
    emailInput?.addEventListener('blur', () => this.handleEmailLookup());
    emailInput?.addEventListener('input', () => {
      clearTimeout(this.lookupTimeout);
      this.lookupTimeout = setTimeout(() => this.handleEmailLookup(), 900);
    });

    document.getElementById('reg-back-link')?.addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    // Setup global modal functions for policy/rules display
    this.setupPolicyModals();
  }

  setupPolicyModals() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'policy-modals-container';
    document.body.appendChild(modalContainer);

    // Add modal styles
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
      .policy-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 2000;
        align-items: center;
        justify-content: center;
      }

      .policy-modal.show {
        display: flex;
      }

      .policy-modal-content {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        width: 90%;
        max-width: 700px;
        max-height: 80vh;
        overflow-y: auto;
      }

      .policy-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border-color);
      }

      .policy-modal-header h2 {
        margin: 0;
        color: var(--primary);
      }

      .policy-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-secondary);
      }

      .policy-modal-body {
        color: var(--text-primary);
        line-height: 1.6;
      }

      .policy-modal-body h3 {
        margin: 1.5rem 0 0.75rem 0;
        color: var(--primary);
      }

      .policy-modal-body p {
        margin: 0.75rem 0;
      }

      .policy-modal-body ul {
        margin: 0.75rem 0;
        padding-left: 1.5rem;
      }

      .policy-modal-body li {
        margin: 0.5rem 0;
      }
    `;
    document.head.appendChild(modalStyle);

    // Make functions available globally
    window.showRaceRules = () => this.showModal('race-rules');
    window.showTerms = () => this.showModal('terms');
    window.showPrivacy = () => this.showModal('privacy');
    window.closeModal = (modalId) => this.closeModal(modalId);
  }

  showModal(modalType) {
    let modal = document.getElementById(`${modalType}-modal`);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = `${modalType}-modal`;
      modal.className = 'policy-modal';

      let title = '';
      let content = '';

      if (modalType === 'race-rules') {
        title = 'Race Rules & Safety Requirements';
        content = `
          <div class="policy-modal-body">
            <h3>Race Rules</h3>
            <p>All participants must adhere to the following rules and requirements:</p>
            <ul>
              <li>Participants must register before the event start time</li>
              <li>All runners must wear their bib numbers visibly at all times during the race</li>
              <li>Follow all race marshal instructions and stay on the marked course</li>
              <li>No mechanical assistance is permitted</li>
              <li>Respect all safety protocols and barriers</li>
              <li>Ensure you have adequate hydration and nutrition</li>
            </ul>

            <h3>Safety Requirements</h3>
            <p>Your safety is our priority. Please note:</p>
            <ul>
              <li>Medical support will be available at designated points</li>
              <li>Course marshals will monitor all participants</li>
              <li>In case of emergency, immediately alert the nearest marshal or medical staff</li>
              <li>Participants with health concerns should consult medical staff at check-in</li>
              <li>Pace yourself and know your limits</li>
              <li>Weather conditions may affect the race - be prepared for changes</li>
            </ul>

            <h3>Disqualification</h3>
            <p>Participants may be disqualified for:</p>
            <ul>
              <li>Not displaying their bib number</li>
              <li>Receiving external mechanical assistance</li>
              <li>Unsafe or disruptive behavior</li>
              <li>Leaving the marked course</li>
              <li>Violating race rules or safety protocols</li>
            </ul>
          </div>
        `;
      } else if (modalType === 'terms') {
        title = 'Event Terms and Conditions';
        content = `
          <div class="policy-modal-body">
            <h3>Terms and Conditions</h3>
            <p><strong>By registering for this event, you agree to the following:</strong></p>

            <h3>Participation Agreement</h3>
            <p>You confirm that:</p>
            <ul>
              <li>You are physically fit to participate in this event</li>
              <li>You have disclosed all relevant medical conditions</li>
              <li>You will follow all race rules and instructions from officials</li>
              <li>You understand the risks involved in participation</li>
            </ul>

            <h3>Code of Conduct</h3>
            <p>All participants must:</p>
            <ul>
              <li>Treat other participants, staff, and spectators with respect</li>
              <li>Not engage in any form of harassment or discrimination</li>
              <li>Not consume alcohol or illegal substances during the event</li>
              <li>Respect the natural environment and leave no trace</li>
            </ul>

            <h3>Event Changes</h3>
            <p>The organizers reserve the right to:</p>
            <ul>
              <li>Modify the course or event schedule if necessary</li>
              <li>Cancel or postpone the event due to weather or safety concerns</li>
              <li>Enforce strict rules on eligibility and participation</li>
              <li>Disqualify participants for rule violations</li>
            </ul>

            <h3>Refund Policy</h3>
            <p>Registration fees are non-refundable except in cases of event cancellation by organizers.</p>
          </div>
        `;
      } else if (modalType === 'privacy') {
        title = 'Privacy Policy';
        content = `
          <div class="policy-modal-body">
            <h3>Privacy Policy</h3>
            <p>We are committed to protecting your personal information.</p>

            <h3>Information Collection</h3>
            <p>We collect the following information:</p>
            <ul>
              <li>Personal details (name, email, phone number)</li>
              <li>Medical information (for emergency response only)</li>
              <li>Event-related data (participation records, results)</li>
            </ul>

            <h3>Use of Information</h3>
            <p>Your information is used for:</p>
            <ul>
              <li>Event registration and management</li>
              <li>Emergency medical response</li>
              <li>Communication about the event</li>
              <li>Improving future events</li>
            </ul>

            <h3>Data Protection</h3>
            <p>We implement security measures to protect your data:</p>
            <ul>
              <li>Encrypted data transmission</li>
              <li>Secure database storage</li>
              <li>Limited access to personal information</li>
              <li>Regular security audits</li>
            </ul>

            <h3>Third-Party Sharing</h3>
            <p>Your information will not be shared with third parties except:</p>
            <ul>
              <li>Medical personnel in case of emergency</li>
              <li>Event officials for legitimate operational purposes</li>
              <li>Legal requirements or government agencies</li>
            </ul>

            <h3>Your Rights</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Request corrections to inaccurate information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Opt-out of communications</li>
            </ul>
          </div>
        `;
      }

      modal.innerHTML = `
        <div class="policy-modal-content">
          <div class="policy-modal-header">
            <h2>${title}</h2>
            <button class="policy-modal-close" onclick="closeModal('${modalType}-modal')">&times;</button>
          </div>
          ${content}
        </div>
      `;

      document.body.appendChild(modal);
    }

    modal.classList.add('show');

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(`${modalType}-modal`);
      }
    });
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .participant-registration-container {
        min-height: 100vh;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        padding: 2rem 1rem;
        font-family: inherit;
      }

      .btn-back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: #fff;
        font-size: 0.9rem;
        font-weight: 600;
        padding: 0.6rem 1.1rem;
        border-radius: 8px;
        cursor: pointer;
        margin-bottom: 1rem;
      }

      .btn-back-link:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      .field-hint {
        margin: 0.4rem 0 0 0;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .returning-banner {
        background: rgba(76, 175, 80, 0.12);
        border: 1px solid #4CAF50;
        color: #2E7D32;
        padding: 0.9rem 1.1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        margin: -0.5rem 0 1.5rem 0;
      }

      .registration-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.05)"/></svg>');
        pointer-events: none;
        z-index: 0;
      }

      .registration-content {
        max-width: 1000px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 2rem;
        align-items: start;
      }

      .registration-card {
        background: var(--bg-primary);
        border-radius: 16px;
        padding: 2.5rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 2px solid var(--border-color);
      }

      .registration-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
        gap: 2rem;
      }

      .event-info h1 {
        margin: 0 0 0.75rem 0;
        color: var(--primary);
        font-size: 1.8rem;
      }

      .event-date, .event-location {
        margin: 0.25rem 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      .registration-badge {
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        white-space: nowrap;
        text-align: center;
      }

      .registration-form {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-section h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid var(--border-color);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 0.85rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-size: 0.95rem;
        font-family: inherit;
        transition: all 0.3s ease;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
      }

      .form-group textarea {
        resize: vertical;
        min-height: 100px;
      }

      .checkbox-group {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        background: rgba(0, 153, 255, 0.05);
        border-radius: 8px;
      }

      .checkbox-group input[type="checkbox"] {
        margin-top: 0.35rem;
        cursor: pointer;
        width: auto !important;
        padding: 0 !important;
        background: transparent !important;
        border: none !important;
      }

      .checkbox-group label {
        margin: 0;
        color: var(--text-primary);
        font-size: 0.95rem;
        text-transform: none;
        letter-spacing: normal;
        cursor: pointer;
      }

      .submission-message {
        padding: 1.5rem;
        border-radius: 8px;
        display: none;
        text-align: center;
      }

      .submission-message.success {
        display: block;
        background: rgba(76, 175, 80, 0.1);
        border: 2px solid #4CAF50;
        color: #4CAF50;
      }

      .submission-message.success h3 {
        margin: 0 0 0.5rem 0;
        color: #4CAF50;
        font-size: 1.3rem;
      }

      .submission-message.success p {
        margin: 0.5rem 0;
        color: var(--text-primary);
      }

      .registration-details {
        background: rgba(0, 0, 0, 0.2);
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
        text-align: left;
      }

      .registration-details p {
        margin: 0.5rem 0;
      }

      .submission-message.error {
        display: block;
        background: rgba(255, 107, 107, 0.1);
        border: 2px solid #ff6b6b;
        color: #ff6b6b;
      }

      .form-actions {
        margin-top: 1rem;
      }

      .btn-large {
        padding: 1rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
      }

      .btn-large:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 153, 255, 0.3);
      }

      .btn-large:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .form-note {
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }

      .registration-info {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 1.5rem;
        border: 2px solid rgba(255, 255, 255, 0.2);
        color: white;
        backdrop-filter: blur(10px);
      }

      .registration-info h3 {
        margin: 0 0 1rem 0;
        font-size: 1.2rem;
      }

      .registration-info ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .registration-info li {
        font-size: 0.95rem;
        line-height: 1.5;
      }

      @media (max-width: 1000px) {
        .registration-content {
          grid-template-columns: 1fr;
        }

        .registration-info {
          display: none;
        }
      }

      @media (max-width: 768px) {
        .registration-card {
          padding: 1.5rem;
        }

        .registration-header {
          flex-direction: column;
          gap: 1rem;
        }

        .event-info h1 {
          font-size: 1.5rem;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .btn-large {
          padding: 0.9rem 1.5rem;
          font-size: 0.95rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

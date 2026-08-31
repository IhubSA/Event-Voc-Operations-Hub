// Participant Registration Form
// Public-facing form for participants to register for events
import { supabase } from './supabase.js';

export class ParticipantRegistration {
  constructor() {
    this.eventId = null;
    this.eventData = null;
    this.isSubmitting = false;
  }

  async render(eventId, onSuccess) {
    this.eventId = eventId;

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
                  </div>
                  <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" />
                  </div>
                </div>
              </div>

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
                <h3>Emergency Contact</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="emergency-name">Emergency Contact Name</label>
                    <input type="text" id="emergency-name" name="emergencyContactName" />
                  </div>
                  <div class="form-group">
                    <label for="emergency-phone">Emergency Contact Phone</label>
                    <input type="tel" id="emergency-phone" name="emergencyContactPhone" />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>Medical Information</h3>

                <div class="form-group">
                  <label for="medical-info">Medical Information & Allergies</label>
                  <textarea id="medical-info" name="medicalInfo" placeholder="Please let us know of any allergies, medications, or medical conditions we should be aware of..."></textarea>
                </div>
              </div>

              <div class="form-section">
                <div class="checkbox-group">
                  <input type="checkbox" id="terms" name="terms" required />
                  <label for="terms">
                    I confirm that the information provided is accurate and I agree to the event terms and conditions.
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
    const data = {
      event_id: this.eventId,
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      category: formData.get('category'),
      age_group: formData.get('ageGroup') || null,
      emergency_contact_name: formData.get('emergencyContactName') || null,
      emergency_contact_phone: formData.get('emergencyContactPhone') || null,
      medical_info: formData.get('medicalInfo') || null
    };

    this.isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
      // Check if email already registered for this event
      const { data: existing, error: checkError } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', this.eventId)
        .eq('email', data.email)
        .single();

      if (existing) {
        throw new Error('This email is already registered for this event');
      }

      // Generate registration number
      const { data: registrationNum, error: numError } = await supabase
        .rpc('get_next_registration_number', { p_event_id: this.eventId });

      if (numError) throw numError;

      data.registration_number = registrationNum;

      // Insert participant
      const { data: participant, error: insertError } = await supabase
        .from('participants')
        .insert([data])
        .select()
        .single();

      if (insertError) throw insertError;

      // Show success message
      messageDiv.className = 'submission-message success';
      messageDiv.innerHTML = `
        <div class="success-content">
          <h3>✓ Registration Successful!</h3>
          <p>Thank you for registering, ${data.first_name}!</p>
          <div class="registration-details">
            <p><strong>Registration Number:</strong> ${participant.registration_number}</p>
            <p><strong>Confirmation:</strong> A confirmation email has been sent to ${data.email}</p>
          </div>
          <p style="margin-top: 1.5rem; font-size: 0.95rem;">
            Please bring this registration number to the event check-in.
          </p>
        </div>
      `;

      // Reset form
      form.reset();

      // Call success callback after delay
      setTimeout(() => {
        if (onSuccess) onSuccess(participant);
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      messageDiv.className = 'submission-message error';
      messageDiv.textContent = error.message || 'Registration failed. Please try again.';
    } finally {
      this.isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Registration';
    }
  }

  setupEventListeners(onSuccess) {
    document.getElementById('registration-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(onSuccess);
    });
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

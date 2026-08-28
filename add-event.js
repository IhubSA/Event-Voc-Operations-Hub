// Add Event Component
import { supabase } from './supabase.js';

export class AddEventModal {
  constructor() {
    this.isLoading = false;
  }

  generateEventCode(eventType, date) {
    // Format: First letter of type + month + day (e.g., S0825 for Sports on Aug 25)
    const typePrefix = eventType ? eventType.substring(0, 1).toUpperCase() : 'E';
    const dateObj = new Date(date);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${typePrefix}${month}${day}`;
  }

  render(onEventCreated, onCancel) {
    const modalHtml = `
      <div class="add-event-overlay" id="add-event-overlay">
        <div class="add-event-modal">
          <div class="modal-header">
            <h2>Create New Event</h2>
            <button class="modal-close" id="modal-close">✕</button>
          </div>

          <form id="add-event-form" class="add-event-form">
            <div class="form-group">
              <label for="event-name">Event Name *</label>
              <input
                type="text"
                id="event-name"
                name="event-name"
                required
                placeholder="e.g., Cape Town Sports Festival"
              />
            </div>

            <div class="form-group">
              <label for="venue">Venue *</label>
              <input
                type="text"
                id="venue"
                name="venue"
                required
                placeholder="e.g., Cape Town, South Africa"
              />
            </div>

            <div class="form-group">
              <label for="event-date">Date *</label>
              <input
                type="date"
                id="event-date"
                name="event-date"
                required
              />
            </div>

            <div class="form-group">
              <label for="event-type">Event Type</label>
              <select id="event-type" name="event-type">
                <option value="Sports">Sports</option>
                <option value="Concert">Concert</option>
                <option value="Conference">Conference</option>
                <option value="Festival">Festival</option>
                <option value="Exhibition">Exhibition</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label for="event-description">Description</label>
              <textarea
                id="event-description"
                name="event-description"
                placeholder="Enter event details..."
                rows="3"
              ></textarea>
            </div>

            <div id="error-message" class="error-message"></div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" id="cancel-btn">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" id="submit-btn">
                <span class="btn-text">Create Event</span>
                <span class="btn-spinner" style="display: none;">⏳</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
      .add-event-overlay {
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
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .add-event-modal {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        width: 90%;
        max-width: 500px;
        box-shadow: var(--shadow-xl);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border-color);
      }

      .modal-header h2 {
        margin: 0;
        color: var(--primary);
        font-size: 1.5rem;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .modal-close:hover {
        color: var(--text-primary);
        background: rgba(0, 153, 255, 0.1);
        border-radius: 6px;
      }

      .add-event-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
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

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 0.85rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.95rem;
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
        border-color: var(--primary);
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.15);
      }

      .form-group textarea {
        resize: vertical;
        min-height: 80px;
      }

      .error-message {
        color: #ff6b6b;
        font-size: 0.9rem;
        padding: 1rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        display: none;
        animation: slideDown 0.3s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .error-message.show {
        display: block;
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--border-color);
      }

      .modal-actions .btn {
        flex: 1;
        max-width: 150px;
      }

      .btn-spinner {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @media (max-width: 480px) {
        .add-event-modal {
          width: 95%;
          padding: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.25rem;
        }

        .modal-actions {
          flex-direction: column;
        }

        .modal-actions .btn {
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Setup event listeners
    this.setupEventListeners(onEventCreated, onCancel);
  }

  setupEventListeners(onEventCreated, onCancel) {
    const form = document.getElementById('add-event-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const modalClose = document.getElementById('modal-close');
    const overlay = document.getElementById('add-event-overlay');
    const errorMessage = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    // Close modal handlers
    const closeModal = () => {
      const modal = document.getElementById('add-event-overlay');
      if (modal) {
        modal.remove();
      }
      onCancel();
    };

    cancelBtn.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (this.isLoading) return;

      const eventName = document.getElementById('event-name').value;
      const venue = document.getElementById('venue').value;
      const eventDate = document.getElementById('event-date').value;
      const eventType = document.getElementById('event-type').value;
      const description = document.getElementById('event-description').value;

      try {
        this.isLoading = true;
        errorMessage.classList.remove('show');
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';

        // Generate event code
        const eventCode = this.generateEventCode(eventType, eventDate);

        // Insert event into Supabase
        const { data, error } = await supabase
          .from('events')
          .insert([
            {
              name: eventName,
              venue: venue,
              date: eventDate,
              code: eventCode,
              event_type: eventType,
              description: description,
              status: 'active',
              created_at: new Date().toISOString()
            }
          ])
          .select();

        if (error) {
          throw error;
        }

        // Close modal and call callback with new event
        const modal = document.getElementById('add-event-overlay');
        if (modal) {
          modal.remove();
        }

        // Call callback with created event
        if (data && data[0]) {
          onEventCreated(data[0]);
        }
      } catch (error) {
        this.isLoading = false;
        console.error('Error creating event:', error);
        errorMessage.textContent = error.message || 'Failed to create event. Please try again.';
        errorMessage.classList.add('show');

        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
      }
    });
  }
}

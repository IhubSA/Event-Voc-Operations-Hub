// Public Registration Landing
// Entry point for the public, unauthenticated self-registration link.
// Shows the club's branding, lists any events currently open for registration,
// and hands off to ParticipantRegistration once a race is chosen.
import { supabase } from './supabase.js';
import { ParticipantRegistration } from './participant-registration.js';

export class PublicRegistration {
  constructor() {
    this.orgId = null;
    this.branding = null;
    this.openEvents = [];
  }

  async render(orgId) {
    this.orgId = orgId;
    const container = document.getElementById('app');

    if (!orgId) {
      container.innerHTML = this.errorScreen(
        'Registration link incomplete',
        'This registration link is missing its club reference. Please use the link your club shared with you.'
      );
      this.addStyles();
      return;
    }

    container.innerHTML = `<div class="pubreg-loading">Loading…</div>`;
    this.addStyles();

    try {
      const { data: brandingRows, error: brandingError } = await supabase
        .rpc('get_public_org_branding', { p_org_id: orgId });

      if (brandingError) throw brandingError;

      const branding = Array.isArray(brandingRows) ? brandingRows[0] : brandingRows;
      if (!branding) {
        container.innerHTML = this.errorScreen(
          'Club not found',
          'We couldn’t find a club for this registration link. Please check the link and try again.'
        );
        return;
      }

      this.branding = branding;

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, name, code, start_date, end_date, location, description')
        .eq('org_id', orgId)
        .eq('registration_open', true)
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      this.openEvents = events || [];
      this.renderEventList();
    } catch (error) {
      console.error('Error loading public registration page:', error);
      container.innerHTML = this.errorScreen(
        'Something went wrong',
        error.message || 'Please try again in a moment.'
      );
    }
  }

  renderHeader() {
    const b = this.branding;
    const logo = b?.logo_url
      ? `<img src="${escapeHtml(b.logo_url)}" alt="${escapeHtml(b.name || 'Club')} logo" class="pubreg-logo" />`
      : `<div class="pubreg-logo pubreg-logo-placeholder">${escapeHtml((b?.name || 'C').trim().charAt(0).toUpperCase() || 'C')}</div>`;

    return `
      <header class="pubreg-header">
        ${logo}
        <div>
          <h1>${escapeHtml(b?.name || 'Event Registration')}</h1>
          ${b?.description ? `<p>${escapeHtml(b.description)}</p>` : ''}
        </div>
      </header>
    `;
  }

  renderEventList() {
    const container = document.getElementById('app');

    // Skip straight to the form if there's exactly one open race
    if (this.openEvents.length === 1) {
      this.openRegistration(this.openEvents[0].id);
      return;
    }

    if (this.openEvents.length === 0) {
      container.innerHTML = `
        <div class="pubreg-page">
          ${this.renderHeader()}
          <div class="pubreg-empty">
            <p>There are no races currently open for registration.</p>
            <p>Please check back later, or contact the club directly.</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="pubreg-page">
        ${this.renderHeader()}
        <div class="pubreg-events">
          <h2>Choose a race to register for</h2>
          <div class="pubreg-events-grid">
            ${this.openEvents.map(ev => `
              <div class="pubreg-event-card" data-event-id="${ev.id}">
                <h3>${escapeHtml(ev.name)}</h3>
                <p class="pubreg-event-meta">📅 ${new Date(ev.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${ev.location ? `<p class="pubreg-event-meta">📍 ${escapeHtml(ev.location)}</p>` : ''}
                ${ev.description ? `<p class="pubreg-event-desc">${escapeHtml(ev.description)}</p>` : ''}
                <button class="btn btn-primary pubreg-register-btn" data-event-id="${ev.id}">Register for this race</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.pubreg-register-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openRegistration(btn.dataset.eventId));
    });
  }

  openRegistration(eventId) {
    const registration = new ParticipantRegistration();
    const onBack = this.openEvents.length > 1 ? () => this.renderEventList() : null;
    registration.render(eventId, () => {
      // After a successful signup, offer the race list again (useful for a
      // parent/coach registering several people) rather than dead-ending.
      if (this.openEvents.length > 1) {
        this.renderEventList();
      } else {
        // Re-render the same single-event form for the next person
        this.openRegistration(eventId);
      }
    }, onBack);
  }

  errorScreen(title, message) {
    return `
      <div class="pubreg-page">
        <div class="pubreg-empty">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  addStyles() {
    if (document.getElementById('public-registration-styles')) return;

    const style = document.createElement('style');
    style.id = 'public-registration-styles';
    style.textContent = `
      body {
        background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
      }

      .pubreg-loading {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        font-size: 1.1rem;
      }

      .pubreg-page {
        min-height: 100vh;
        max-width: 1000px;
        margin: 0 auto;
        padding: 2.5rem 1.5rem;
      }

      .pubreg-header {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-bottom: 2.5rem;
      }

      .pubreg-logo {
        width: 64px;
        height: 64px;
        object-fit: contain;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        padding: 0.4rem;
        flex-shrink: 0;
      }

      .pubreg-logo-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        font-weight: 800;
        color: #fff;
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
      }

      .pubreg-header h1 {
        margin: 0 0 0.3rem 0;
        color: var(--text-primary);
        font-size: 1.75rem;
      }

      .pubreg-header p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      .pubreg-events h2 {
        color: var(--text-primary);
        font-size: 1.3rem;
        margin: 0 0 1.5rem 0;
      }

      .pubreg-events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .pubreg-event-card {
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 1.75rem;
        box-shadow: var(--shadow-md);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .pubreg-event-card h3 {
        margin: 0 0 0.5rem 0;
        color: var(--primary);
        font-size: 1.2rem;
      }

      .pubreg-event-meta {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .pubreg-event-desc {
        margin: 0.5rem 0 0 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .pubreg-register-btn {
        margin-top: 1rem;
      }

      .pubreg-empty {
        text-align: center;
        padding: 4rem 2rem;
        background: var(--bg-primary);
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        color: var(--text-secondary);
      }

      .pubreg-empty h2 {
        color: var(--text-primary);
        margin: 0 0 1rem 0;
      }
    `;
    document.head.appendChild(style);
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

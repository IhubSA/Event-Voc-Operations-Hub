// Org Branding Service
// Central place that loads, caches and renders a club's white-label branding
// (logo, colors, contact details) so every module page can show it consistently.
import { supabase } from './supabase.js';

let cachedBranding = null;
let cachedOrgId = null;
let cachedRole = null;

const BRAND_COLUMNS = `
  id, name, type, logo_url, primary_color, secondary_color, accent_color,
  description, website, phone, email, address, city, state, country, postal_code
`;

export async function loadOrgBranding(orgId, userId) {
  if (!orgId) {
    cachedBranding = null;
    cachedOrgId = null;
    cachedRole = null;
    return null;
  }

  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .select(BRAND_COLUMNS)
      .eq('id', orgId)
      .single();

    if (error) throw error;

    cachedBranding = org;
    cachedOrgId = orgId;

    if (userId) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      cachedRole = member?.role || null;
    }

    return cachedBranding;
  } catch (error) {
    console.error('Failed to load org branding:', error);
    return null;
  }
}

export function getOrgBranding() {
  return cachedBranding;
}

export function getOrgId() {
  return cachedOrgId;
}

export function getOrgRole() {
  return cachedRole;
}

export function canEditClubSettings() {
  return cachedRole === 'owner' || cachedRole === 'admin';
}

export function setOrgBranding(org) {
  cachedBranding = org;
}

export function clearOrgBranding() {
  cachedBranding = null;
  cachedOrgId = null;
  cachedRole = null;
}

export function getOrgLogoUrl() {
  return cachedBranding?.logo_url || null;
}

export function getOrgDisplayName() {
  return cachedBranding?.name || 'Venue Operations Centre';
}

// ---------- Logo upload ----------

export async function uploadOrgLogo(orgId, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${orgId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('org-logos')
    .upload(path, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('org-logos').getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Sidebar + shell rendering ----------

export function getRegistrationLink() {
  if (!cachedOrgId) return null;
  const base = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`;
  return `${base}register.html?org=${cachedOrgId}`;
}

export function renderSidebarHtml() {
  const b = cachedBranding;
  if (!b) return '';

  const initial = escapeHtml((b.name || 'C').trim().charAt(0).toUpperCase() || 'C');
  const logo = b.logo_url
    ? `<img src="${escapeHtml(b.logo_url)}" alt="${escapeHtml(b.name || 'Club')} logo" class="org-sidebar-logo" />`
    : `<div class="org-sidebar-logo org-sidebar-logo-placeholder">${initial}</div>`;

  const addressParts = [b.address, b.city, b.state, b.postal_code, b.country].filter(Boolean);

  const rows = [
    b.phone ? `<div class="org-sidebar-row"><span class="org-sidebar-icon">📞</span><span>${escapeHtml(b.phone)}</span></div>` : '',
    b.email ? `<div class="org-sidebar-row"><span class="org-sidebar-icon">✉️</span><span>${escapeHtml(b.email)}</span></div>` : '',
    b.website ? `<div class="org-sidebar-row"><span class="org-sidebar-icon">🌐</span><a href="${escapeHtml(normalizeUrl(b.website))}" target="_blank" rel="noopener noreferrer">${escapeHtml(b.website)}</a></div>` : '',
    addressParts.length ? `<div class="org-sidebar-row"><span class="org-sidebar-icon">📍</span><span>${escapeHtml(addressParts.join(', '))}</span></div>` : ''
  ].filter(Boolean).join('');

  const regLink = canEditClubSettings() ? getRegistrationLink() : null;
  const regSection = regLink ? `
    <div class="org-sidebar-section org-sidebar-reglink">
      <h3>Participant Registration</h3>
      <p class="org-sidebar-reglink-hint">Share this link so participants can register themselves.</p>
      <input type="text" class="org-sidebar-reglink-input" id="sidebar-registration-link" value="${escapeHtml(regLink)}" readonly />
      <button type="button" class="btn btn-secondary btn-sm btn-full" id="sidebar-copy-registration-link">📋 Copy Link</button>
    </div>
  ` : '';

  return `
    <aside class="org-sidebar">
      <div class="org-sidebar-brand">
        ${logo}
        <h2 class="org-sidebar-name">${escapeHtml(b.name || 'Your Club')}</h2>
        ${b.description ? `<p class="org-sidebar-desc">${escapeHtml(b.description)}</p>` : ''}
      </div>
      ${rows ? `<div class="org-sidebar-section"><h3>Club Details</h3>${rows}</div>` : ''}
      ${regSection}
    </aside>
  `;
}

export function wrapWithShell(navbarHtml, bodyHtml) {
  injectShellStyles();

  // Wire up the sidebar's copy-link button. The sidebar HTML returned here
  // isn't in the DOM yet at this point (the caller still has to assign it to
  // innerHTML), so defer wiring to the next tick -- same pattern navbar.js
  // uses for its own buttons.
  setTimeout(() => {
    const copyBtn = document.getElementById('sidebar-copy-registration-link');
    const linkInput = document.getElementById('sidebar-registration-link');
    if (copyBtn && linkInput) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(linkInput.value);
        } catch (err) {
          // Clipboard API can fail (permissions, non-secure context) --
          // fall back to a manual select so the user can still copy.
          linkInput.select();
          document.execCommand('copy');
        }
        const original = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.disabled = true;
        setTimeout(() => {
          copyBtn.textContent = original;
          copyBtn.disabled = false;
        }, 1800);
      });
    }
  }, 0);

  return `
    ${navbarHtml}
    <div class="app-shell">
      ${renderSidebarHtml()}
      <div class="app-main">${bodyHtml}</div>
    </div>
  `;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function normalizeUrl(url) {
  if (!url) return '#';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function injectShellStyles() {
  if (document.getElementById('org-shell-styles')) return;

  const style = document.createElement('style');
  style.id = 'org-shell-styles';
  style.textContent = `
    .app-shell {
      display: flex;
      align-items: flex-start;
      min-height: calc(100vh - 105px);
      background: linear-gradient(135deg, #0F1419 0%, #1A2332 100%);
    }

    .org-sidebar {
      width: 280px;
      flex-shrink: 0;
      background: linear-gradient(180deg, #1A2332 0%, #0F1419 100%);
      border-right: 2px solid #334455;
      padding: 2rem 1.5rem;
      position: sticky;
      top: 105px;
      align-self: flex-start;
      max-height: calc(100vh - 105px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .org-sidebar-brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #334455;
    }

    .org-sidebar-logo {
      width: 96px;
      height: 96px;
      object-fit: contain;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      padding: 0.5rem;
    }

    .org-sidebar-logo-placeholder {
      width: 96px;
      height: 96px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 800;
      color: #fff;
      background: linear-gradient(135deg, #0099FF, #00A8E8);
    }

    .org-sidebar-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
      line-height: 1.3;
      word-break: break-word;
    }

    .org-sidebar-desc {
      font-size: 0.85rem;
      color: #B0BEC5;
      margin: 0;
      line-height: 1.5;
    }

    .org-sidebar-section h3 {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #78909C;
      margin: 0 0 0.9rem 0;
    }

    .org-sidebar-row {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.85rem;
      color: #B0BEC5;
      margin-bottom: 0.7rem;
      line-height: 1.4;
      word-break: break-word;
    }

    .org-sidebar-row a {
      color: #00A8E8;
      text-decoration: none;
    }

    .org-sidebar-row a:hover {
      text-decoration: underline;
    }

    .org-sidebar-icon {
      flex-shrink: 0;
    }

    .org-sidebar-reglink-hint {
      font-size: 0.78rem;
      color: #78909C;
      margin: 0 0 0.75rem 0;
      line-height: 1.4;
    }

    .org-sidebar-reglink-input {
      width: 100%;
      padding: 0.5rem 0.6rem;
      margin-bottom: 0.6rem;
      border: 1px solid #334455;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      color: #B0BEC5;
      font-size: 0.75rem;
      font-family: monospace;
    }

    .btn-full {
      width: 100%;
    }

    .app-main {
      flex: 1;
      min-width: 0;
    }

    @media (max-width: 900px) {
      .app-shell {
        flex-direction: column;
        min-height: 0;
      }

      .org-sidebar {
        width: 100%;
        position: static;
        max-height: none;
        border-right: none;
        border-bottom: 2px solid #334455;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.25rem;
      }

      .org-sidebar-brand {
        border-bottom: none;
        padding-bottom: 0;
        flex-direction: row;
        text-align: left;
      }

      .org-sidebar-logo,
      .org-sidebar-logo-placeholder {
        width: 56px;
        height: 56px;
        font-size: 1.5rem;
      }

      .org-sidebar-section {
        flex: 1;
        min-width: 200px;
      }

      .org-sidebar button.btn-full {
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
}

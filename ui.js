// VOC UI layer: toasts, command palette, live command bar, quick-report button,
// SITREP generator, theme switching and the event navigation context.
// Everything here is shared by every page, so it's written once and pulled in
// by navbar.js / org-branding.js rather than duplicated per module.
import { supabase } from './supabase.js';
import { icon } from './icons.js';

// ---------------------------------------------------------------------------
// Event navigation context
// app.js registers the active event and a navigate(module) function; the
// sidebar, command palette and quick-report button all read from here.
// ---------------------------------------------------------------------------
const ctx = { event: null, navigate: null, activeModule: null, status: null };

export const MODULES = [
  { key: 'overview', label: 'Command Overview', icon: 'layout', hint: 'Live status of every department' },
  { key: 'medical', label: 'Medical', icon: 'medical', hint: 'Incidents, triage & resources' },
  { key: 'security', label: 'Security', icon: 'shield', hint: 'Threats, incidents & resources' },
  { key: 'safety', label: 'Safety & Compliance', icon: 'alert-triangle', hint: 'Hazards, inspections & risk' },
  { key: 'staff', label: 'Staff', icon: 'users', hint: 'Roles, check-in & assignments' },
  { key: 'participants', label: 'Participants', icon: 'runner', hint: 'Registration, bibs & check-in' },
  { key: 'vendors', label: 'Vendors', icon: 'store', hint: 'Service providers & documents' },
  { key: 'route-map', label: 'Route Map', icon: 'map', hint: 'Routes, water, medical & marshals' },
  { key: 'settings', label: 'Event Settings', icon: 'settings', hint: 'Numbering, registration & event status' },
];

export function setEventContext(event, navigate) {
  ctx.event = event;
  ctx.navigate = navigate;
}
export function clearEventContext() {
  ctx.event = null;
  ctx.navigate = null;
  ctx.activeModule = null;
  ctx.status = null;
}
export function setActiveModule(key) { ctx.activeModule = key; }
export function getEventContext() { return ctx; }

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------------------------------------------------------------------
// Toasts -- non-blocking notifications. window.alert is routed here too, so
// every existing alert() in the modules becomes a clean toast automatically.
// ---------------------------------------------------------------------------
export function toast(message, type = 'info', ms = 4200) {
  let host = document.getElementById('voc-toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'voc-toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const text = String(message ?? '');
  if (type === 'info') {
    if (/error|fail|could not|couldn't|unable|invalid|denied/i.test(text)) type = 'error';
    else if (/success|saved|created|updated|deleted|added|copied|complete/i.test(text)) type = 'success';
    else if (/please|required|warning|must|select/i.test(text)) type = 'warning';
  }
  const iconName = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' }[type] || 'info';
  const el = document.createElement('div');
  el.className = `voc-toast voc-toast-${type}`;
  el.innerHTML = `${icon(iconName)}<div class="voc-toast-msg">${escapeHtml(text).replace(/\n/g, '<br>')}</div><button class="voc-toast-close" aria-label="Dismiss">${icon('x')}</button>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  const close = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); };
  el.querySelector('.voc-toast-close').addEventListener('click', close);
  setTimeout(close, type === 'error' ? ms + 2500 : ms);
}
if (typeof window !== 'undefined' && !window.__vocAlertPatched) {
  window.__vocAlertPatched = true;
  window.alert = (msg) => toast(msg);
}

// ---------------------------------------------------------------------------
// Theme (dark default, light optional) -- remembered per browser.
// ---------------------------------------------------------------------------
export function getTheme() {
  try { return localStorage.getItem('voc-theme') || 'dark'; } catch { return 'dark'; }
}
export function applyTheme(theme = getTheme()) {
  document.documentElement.setAttribute('data-theme', theme);
}
export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('voc-theme', next); } catch { /* private mode */ }
  applyTheme(next);
  document.querySelectorAll('[data-voc-theme-btn]').forEach((b) => { b.innerHTML = icon(next === 'dark' ? 'sun' : 'moon'); });
  toast(`${next === 'dark' ? 'Dark' : 'Light'} mode on`, 'info', 1800);
}
applyTheme();

// ---------------------------------------------------------------------------
// Operational status -- the "is the event safe?" answer, computed from open
// incidents and hazards. RED = any open critical, AMBER = any open high or
// red/orange threat, GREEN otherwise.
// ---------------------------------------------------------------------------
const OPEN = (s) => !['resolved', 'closed', 'completed', 'cancelled'].includes(String(s || '').toLowerCase());

export async function computeOperationalStatus(eventId) {
  const res = { level: 'green', label: 'NORMAL', openIncidents: 0, critical: 0, high: 0, hazards: 0 };
  if (!eventId) return res;
  try {
    const [{ data: inc }, { data: haz }] = await Promise.all([
      supabase.from('incidents').select('id,severity,status,threat_level').eq('event_id', eventId),
      supabase.from('hazards').select('id,severity,status').eq('event_id', eventId),
    ]);
    const open = (inc || []).filter((i) => OPEN(i.status));
    const openHaz = (haz || []).filter((h) => OPEN(h.status));
    res.openIncidents = open.length;
    res.hazards = openHaz.length;
    const sev = (x) => String(x || '').toLowerCase();
    res.critical = open.filter((i) => sev(i.severity) === 'critical' || sev(i.threat_level) === 'red').length
      + openHaz.filter((h) => sev(h.severity) === 'critical').length;
    res.high = open.filter((i) => sev(i.severity) === 'high' || sev(i.threat_level) === 'orange').length
      + openHaz.filter((h) => sev(h.severity) === 'high').length;
    if (res.critical) Object.assign(res, { level: 'red', label: 'CRITICAL' });
    else if (res.high) Object.assign(res, { level: 'amber', label: 'ELEVATED' });
  } catch (e) {
    console.error('Status check failed', e);
  }
  ctx.status = res;
  return res;
}

// ---------------------------------------------------------------------------
// Command bar (sits above the navbar on every signed-in page)
// ---------------------------------------------------------------------------
export function renderCommandBar() {
  const ev = ctx.event;
  const theme = getTheme();
  const eventBlock = ev ? `
      <span class="cb-sep"></span>
      <span class="cb-event" title="${escapeHtml(ev.name)}">${icon('flag')}<span>${escapeHtml(ev.name)}</span></span>
      <span class="cb-status cb-status-loading" id="cb-status" title="Operational status">
        <span class="cb-status-dot"></span><span id="cb-status-text">CHECKING</span>
      </span>` : '';
  return `
    <div class="voc-commandbar">
      <div class="cb-left">
        <img src="./voc-logo.png" alt="VOC" class="cb-logo" />
        <span class="cb-title">Venue Operations Centre</span>
        ${eventBlock}
      </div>
      <div class="cb-right">
        <button type="button" class="cb-search" data-voc-palette>
          ${icon('search')}<span class="cb-search-text">Search or jump to…</span><kbd>Ctrl K</kbd>
        </button>
        <span class="cb-clock" title="South African Standard Time">${icon('clock')}<span id="cb-clock">--:--:--</span><small>SAST</small></span>
        <button type="button" class="cb-icon-btn" data-voc-theme-btn title="Switch light / dark mode" aria-label="Switch light or dark mode">${icon(theme === 'dark' ? 'sun' : 'moon')}</button>
      </div>
    </div>`;
}

let clockTimer = null;
let statusTimer = null;
export function wireCommandBar() {
  const tick = () => {
    const el = document.getElementById('cb-clock');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('en-ZA', { hour12: false, timeZone: 'Africa/Johannesburg' });
  };
  tick();
  clearInterval(clockTimer);
  clockTimer = setInterval(tick, 1000);

  document.querySelectorAll('[data-voc-palette]').forEach((b) => b.addEventListener('click', openPalette));
  document.querySelectorAll('[data-voc-theme-btn]').forEach((b) => b.addEventListener('click', toggleTheme));

  clearInterval(statusTimer);
  if (ctx.event) {
    refreshStatusPill();
    statusTimer = setInterval(refreshStatusPill, 60000);
  }
  renderQuickReport();
}

async function refreshStatusPill() {
  const pill = document.getElementById('cb-status');
  if (!pill || !ctx.event) return;
  const s = await computeOperationalStatus(ctx.event.id);
  pill.className = `cb-status cb-status-${s.level}`;
  document.getElementById('cb-status-text').textContent = s.label;
  pill.title = `${s.openIncidents} open incident(s), ${s.hazards} open hazard(s) — ${s.critical} critical, ${s.high} high`;
  document.dispatchEvent(new CustomEvent('voc:status', { detail: s }));
}

// ---------------------------------------------------------------------------
// Command palette (Ctrl/Cmd + K)
// ---------------------------------------------------------------------------
function paletteItems() {
  const items = [];
  if (ctx.event && ctx.navigate) {
    MODULES.forEach((m) => items.push({ group: 'Go to', label: m.label, hint: m.hint, icon: m.icon, run: () => ctx.navigate(m.key) }));
    items.push(
      { group: 'Actions', label: 'Report medical incident', hint: 'Opens the new incident form', icon: 'heart-pulse', run: () => quickAction('medical') },
      { group: 'Actions', label: 'Report security incident', hint: 'Opens the new incident form', icon: 'siren', run: () => quickAction('security') },
      { group: 'Actions', label: 'Report safety hazard', hint: 'Opens the hazard form', icon: 'alert-octagon', run: () => quickAction('safety') },
      { group: 'Actions', label: 'Add participant', hint: 'Register someone manually', icon: 'user-check', run: () => quickAction('participants') },
      { group: 'Actions', label: 'Generate SITREP', hint: 'Printable situation report for this event', icon: 'printer', run: () => generateSitrep() },
      { group: 'Actions', label: 'Back to all events', hint: 'Leave this event', icon: 'calendar', run: () => ctx.navigate('dashboard') },
    );
  }
  items.push(
    { group: 'System', label: `Switch to ${getTheme() === 'dark' ? 'light' : 'dark'} mode`, hint: 'Change the colour theme', icon: getTheme() === 'dark' ? 'sun' : 'moon', run: toggleTheme },
    { group: 'System', label: 'Keyboard shortcuts', hint: 'Ctrl K search · N new incident · ? help', icon: 'keyboard', run: showShortcuts },
    { group: 'System', label: 'Sign out', hint: 'End your session', icon: 'log-out', run: () => supabase.auth.signOut() },
  );
  return items;
}

let paletteSel = 0;
export function openPalette() {
  if (document.getElementById('voc-palette')) return;
  const wrap = document.createElement('div');
  wrap.id = 'voc-palette';
  wrap.innerHTML = `
    <div class="pal-backdrop"></div>
    <div class="pal-box" role="dialog" aria-label="Command palette">
      <div class="pal-input-row">${icon('search')}<input id="pal-input" placeholder="Type a module or action…" autocomplete="off" /><kbd>Esc</kbd></div>
      <div class="pal-list" id="pal-list"></div>
      <div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
    </div>`;
  document.body.appendChild(wrap);
  const input = wrap.querySelector('#pal-input');
  const list = wrap.querySelector('#pal-list');
  let filtered = [];
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    filtered = paletteItems().filter((i) => !q || `${i.label} ${i.hint} ${i.group}`.toLowerCase().includes(q));
    paletteSel = Math.min(paletteSel, Math.max(filtered.length - 1, 0));
    let lastGroup = '';
    list.innerHTML = filtered.length ? filtered.map((i, idx) => {
      const head = i.group !== lastGroup ? `<div class="pal-group">${i.group}</div>` : '';
      lastGroup = i.group;
      return `${head}<button class="pal-item ${idx === paletteSel ? 'sel' : ''}" data-idx="${idx}">
        <span class="pal-ico">${icon(i.icon)}</span><span class="pal-text"><strong>${escapeHtml(i.label)}</strong><small>${escapeHtml(i.hint)}</small></span>${icon('chevron-right', 'pal-go')}</button>`;
    }).join('') : `<div class="pal-empty">No matches for “${escapeHtml(input.value)}”</div>`;
    list.querySelectorAll('.pal-item').forEach((b) => b.addEventListener('click', () => run(+b.dataset.idx)));
    list.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
  };
  const close = () => wrap.remove();
  const run = (idx) => { const it = filtered[idx]; close(); if (it) it.run(); };
  input.addEventListener('input', () => { paletteSel = 0; draw(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { paletteSel = Math.min(paletteSel + 1, filtered.length - 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { paletteSel = Math.max(paletteSel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') { run(paletteSel); }
    else if (e.key === 'Escape') { close(); }
  });
  wrap.querySelector('.pal-backdrop').addEventListener('click', close);
  paletteSel = 0;
  draw();
  input.focus();
}

function showShortcuts() {
  toast('Ctrl/Cmd + K — search & jump anywhere\nN — report an incident (inside an event)\nShift + S — generate SITREP\nEsc — close dialogs', 'info', 7000);
}

if (typeof document !== 'undefined' && !window.__vocKeysBound) {
  window.__vocKeysBound = true;
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    // Esc closes whichever module dialog is open (they all use .modal-close)
    if (e.key === 'Escape' && !document.getElementById('voc-palette')) {
      const open = [...document.querySelectorAll('.modal-close, .policy-modal-close')].filter((b) => b.offsetParent !== null);
      if (open.length) { open[open.length - 1].click(); return; }
      toggleQuickMenu(false);
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'n' && ctx.event) { e.preventDefault(); toggleQuickMenu(true); }
    if (e.key === 'S' && e.shiftKey && ctx.event) { e.preventDefault(); generateSitrep(); }
    if (e.key === '?') { showShortcuts(); }
  });
}

// ---------------------------------------------------------------------------
// Quick Report floating button -- log an incident from any screen in 2 clicks
// ---------------------------------------------------------------------------
const QUICK_TARGETS = {
  medical: { module: 'medical', btn: 'new-incident-btn' },
  security: { module: 'security', btn: 'new-incident-btn' },
  safety: { module: 'safety', btn: 'new-hazard-btn' },
  participants: { module: 'participants', btn: 'add-participant-btn' },
};

export function quickAction(kind) {
  const t = QUICK_TARGETS[kind];
  if (!t || !ctx.navigate) return;
  ctx.navigate(t.module);
  // Modules render asynchronously; wait for the form button to exist, then open it.
  let tries = 0;
  const timer = setInterval(() => {
    const b = document.getElementById(t.btn);
    if (b) { clearInterval(timer); b.click(); }
    if (++tries > 40) clearInterval(timer);
  }, 100);
}

function renderQuickReport() {
  document.getElementById('voc-fab')?.remove();
  if (!ctx.event || ctx.event.status === 'completed' || ctx.event.status === 'ended') return;
  const fab = document.createElement('div');
  fab.id = 'voc-fab';
  fab.innerHTML = `
    <div class="fab-menu" id="fab-menu" hidden>
      <button data-q="medical">${icon('heart-pulse')}<span>Medical incident</span></button>
      <button data-q="security">${icon('siren')}<span>Security incident</span></button>
      <button data-q="safety">${icon('alert-octagon')}<span>Safety hazard</span></button>
      <button data-q="sitrep">${icon('printer')}<span>Generate SITREP</span></button>
    </div>
    <button class="fab-main" id="fab-main" title="Quick report (N)" aria-expanded="false">${icon('plus')}<span>Quick Report</span></button>`;
  document.body.appendChild(fab);
  fab.querySelector('#fab-main').addEventListener('click', () => toggleQuickMenu());
  fab.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    toggleQuickMenu(false);
    if (b.dataset.q === 'sitrep') generateSitrep(); else quickAction(b.dataset.q);
  }));
}

function toggleQuickMenu(force) {
  const menu = document.getElementById('fab-menu');
  const main = document.getElementById('fab-main');
  if (!menu) return;
  const show = force ?? menu.hidden;
  menu.hidden = !show;
  main.setAttribute('aria-expanded', String(show));
  main.classList.toggle('open', show);
}

// ---------------------------------------------------------------------------
// SITREP -- one-click situation report, printable / save-as-PDF
// ---------------------------------------------------------------------------
export async function generateSitrep() {
  const ev = ctx.event;
  if (!ev) return;
  toast('Compiling situation report…', 'info', 1800);
  const q = (p) => p.then((r) => r.data || []).catch(() => []);
  const [incidents, medical, hazards, staff, checkins, participants, medRes, secRes, risk, vendors] = await Promise.all([
    q(supabase.from('incidents').select('*').eq('event_id', ev.id).order('created_at', { ascending: false })),
    q(supabase.from('medical_incidents').select('*, incidents!inner(event_id,title,status)').eq('incidents.event_id', ev.id)),
    q(supabase.from('hazards').select('*').eq('event_id', ev.id)),
    q(supabase.from('event_staff').select('id,name').eq('event_id', ev.id)),
    q(supabase.from('staff_checkin').select('staff_id,check_in_time,check_out_time').eq('event_id', ev.id)),
    q(supabase.from('participants').select('id,status').eq('event_id', ev.id)),
    q(supabase.from('medical_resources').select('*').eq('event_id', ev.id)),
    q(supabase.from('security_resources').select('*').eq('event_id', ev.id)),
    q(supabase.from('event_risk_categorization').select('*').eq('event_id', ev.id)),
    q(supabase.from('vendors').select('id,status,category').eq('event_id', ev.id)),
  ]);
  const status = await computeOperationalStatus(ev.id);
  const open = incidents.filter((i) => OPEN(i.status));
  const onDuty = new Set(checkins.filter((c) => c.check_in_time && !c.check_out_time).map((c) => c.staff_id)).size;
  const count = (arr, k, v) => arr.filter((x) => String(x[k] || '').toLowerCase() === v).length;
  const sumQty = (arr) => arr.reduce((a, r) => a + (Number(r.quantity) || 1), 0);
  const now = new Date();
  const stamp = now.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' });
  const r = risk[0];
  const colour = { red: '#B91C1C', amber: '#B45309', green: '#15803D' }[status.level];
  const row = (i) => `<tr><td>${new Date(i.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' })}</td><td>${escapeHtml(i.title)}</td><td class="sev sev-${escapeHtml(String(i.severity || '').toLowerCase())}">${escapeHtml(i.severity || '-')}</td><td>${escapeHtml(i.status || '-')}</td></tr>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>SITREP — ${escapeHtml(ev.name)}</title>
  <style>
    *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;margin:0;padding:32px 40px;font-size:13px}
    header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f172a;padding-bottom:14px;margin-bottom:18px}
    h1{font-size:22px;margin:0 0 4px} h2{font-size:14px;text-transform:uppercase;letter-spacing:.06em;margin:22px 0 8px;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
    .meta{color:#475569} .status{padding:8px 14px;border-radius:6px;color:#fff;font-weight:700;background:${colour};text-align:center}
    .status small{display:block;font-weight:500;opacity:.9}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px} .kpi b{display:block;font-size:22px} .kpi span{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
    table{width:100%;border-collapse:collapse} th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0} th{background:#f8fafc;font-size:11px;text-transform:uppercase;color:#475569}
    .sev{font-weight:700;text-transform:capitalize} .sev-critical{color:#B91C1C} .sev-high{color:#C2410C} .sev-medium{color:#A16207} .sev-low{color:#15803D}
    .toolbar{display:flex;justify-content:flex-end;margin:-12px 0 12px} .toolbar button{padding:8px 14px;border:0;border-radius:6px;background:#0f172a;color:#fff;font-weight:600;cursor:pointer}
    footer{margin-top:28px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:8px}
    @media print{.toolbar{display:none} body{padding:0}}
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <header><div><div class="meta">SITUATION REPORT (SITREP)</div><h1>${escapeHtml(ev.name)}</h1>
    <div class="meta">${escapeHtml(ev.location || '')} · Event code ${escapeHtml(ev.code || '-')} · Issued ${stamp} SAST</div></div>
    <div class="status">${status.label}<small>Operational status</small></div></header>
  <h2>Summary</h2>
  <div class="grid">
    <div class="kpi"><b>${open.length}</b><span>Open incidents</span></div>
    <div class="kpi"><b>${status.critical}</b><span>Critical / red</span></div>
    <div class="kpi"><b>${hazards.filter((h) => OPEN(h.status)).length}</b><span>Open hazards</span></div>
    <div class="kpi"><b>${incidents.length - open.length}</b><span>Resolved incidents</span></div>
    <div class="kpi"><b>${onDuty} / ${staff.length}</b><span>Staff on duty</span></div>
    <div class="kpi"><b>${participants.length}</b><span>Participants registered</span></div>
    <div class="kpi"><b>${count(participants, 'status', 'checked_in')}</b><span>Participants checked in</span></div>
    <div class="kpi"><b>${sumQty(medRes) + sumQty(secRes)}</b><span>Resources deployed</span></div>
  </div>
  <h2>Medical</h2>
  <p>${medical.length} patient record(s): ${['critical', 'high', 'medium', 'low'].map((l) => `${count(medical, 'triage_level', l)} ${l}`).join(', ')}. Resources: ${medRes.map((m) => `${escapeHtml(m.resource_type)} ×${m.quantity || 1} (${escapeHtml(m.status)})`).join(', ') || 'none recorded'}.</p>
  <h2>Risk</h2>
  <p>${r ? `Risk category <b>${escapeHtml(String(r.risk_category || '').toUpperCase())}</b> (score ${r.risk_score ?? '-'}) · expected attendance ${r.expected_attendance ?? '-'} · assessment ${escapeHtml(r.status || '')}.` : 'No risk categorisation on record.'} Vendors: ${vendors.length} (${count(vendors, 'status', 'approved')} approved).</p>
  <h2>Open incidents</h2>
  ${open.length ? `<table><thead><tr><th>Time</th><th>Incident</th><th>Severity</th><th>Status</th></tr></thead><tbody>${open.map(row).join('')}</tbody></table>` : '<p>No open incidents.</p>'}
  <h2>Recently resolved</h2>
  ${incidents.filter((i) => !OPEN(i.status)).slice(0, 10).map(row).join('') ? `<table><thead><tr><th>Time</th><th>Incident</th><th>Severity</th><th>Status</th></tr></thead><tbody>${incidents.filter((i) => !OPEN(i.status)).slice(0, 10).map(row).join('')}</tbody></table>` : '<p>None.</p>'}
  <footer>Generated by VOC — Venue Operations Centre. Contains operational information; handle in line with POPIA.</footer>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) { toast('Your browser blocked the report window — allow pop-ups for this site and try again.', 'warning'); return; }
  w.document.write(html);
  w.document.close();
}

// ---------------------------------------------------------------------------
// Event navigation for the sidebar
// ---------------------------------------------------------------------------
export function renderEventNavHtml() {
  const ev = ctx.event;
  if (!ev) return '';
  const active = ctx.activeModule || 'overview';
  const items = MODULES.map((m) => `
    <button type="button" class="evnav-item ${m.key === active ? 'active' : ''}" data-evnav="${m.key}" ${m.key === active ? 'aria-current="page"' : ''}>
      ${icon(m.icon)}<span>${m.label}</span>
    </button>`).join('');
  return `
    <nav class="evnav" aria-label="Event modules">
      <button type="button" class="evnav-back" data-evnav="dashboard">${icon('arrow-left')} All events</button>
      <div class="evnav-event">
        <span class="evnav-label">Current event</span>
        <strong title="${escapeHtml(ev.name)}">${escapeHtml(ev.name)}</strong>
      </div>
      ${items}
      <button type="button" class="evnav-item evnav-sitrep" data-evnav-sitrep>${icon('printer')}<span>Generate SITREP</span></button>
    </nav>`;
}

export function wireEventNav() {
  document.querySelectorAll('[data-evnav]').forEach((b) => b.addEventListener('click', () => ctx.navigate && ctx.navigate(b.dataset.evnav)));
  document.querySelectorAll('[data-evnav-sitrep]').forEach((b) => b.addEventListener('click', generateSitrep));
}

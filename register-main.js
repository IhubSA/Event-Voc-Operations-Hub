// Bootstrap for the public, unauthenticated self-registration page (register.html).
// Reads ?org=<org_id> from the URL and hands off to PublicRegistration.
// Deliberately does NOT import app.js / auth.js -- this page must work with no
// Supabase session at all.
import { PublicRegistration } from './public-registration.js';

function init() {
  const params = new URLSearchParams(window.location.search);
  const orgId = params.get('org');

  const page = new PublicRegistration();
  page.render(orgId);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

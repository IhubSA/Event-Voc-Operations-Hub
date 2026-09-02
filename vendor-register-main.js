// Bootstrap for the public, unauthenticated vendor registration/upload page
// (vendor-registration.html). Reads ?vendor=<vendor_id> from the URL and
// hands off to VendorRegistration. Deliberately does NOT import app.js /
// auth.js -- this page must work with no Supabase session at all.
import { VendorRegistration } from './vendor-registration.js';

function init() {
  const params = new URLSearchParams(window.location.search);
  const vendorId = params.get('vendor');

  const page = new VendorRegistration();
  page.render(vendorId);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

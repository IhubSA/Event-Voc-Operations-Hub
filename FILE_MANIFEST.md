# File Manifest

## Directory Structure

```
voc-system-update/
├── README.md (comprehensive documentation)
├── SETUP_GUIDE.md (quick setup instructions)
├── FILE_MANIFEST.md (this file)
├── database-migrations/
│   ├── participant-schema-enhanced.sql
│   └── event-settings-schema.sql
└── javascript-modules/
    ├── event-settings.js (NEW)
    ├── app.js (UPDATED)
    ├── participant-registration.js (UPDATED)
    ├── participants.js (UPDATED)
    └── integrated-dashboard.js (UPDATED)
```

---

## 📁 Database Migrations

### `participant-schema-enhanced.sql`
**Type:** NEW Database Schema
**Purpose:** Adds enhanced medical and emergency contact fields to participants table
**Size:** ~2 KB
**What It Does:**
- Adds 13 new columns to participants table:
  - Medical info: blood_type, medical_conditions, allergies, medications
  - Doctor details: doctor_name, doctor_phone
  - Medical aid: medical_aid_provider, medical_aid_member_number
  - Emergency contact: emergency_contact_relationship
  - Terms acceptance: race_rules_accepted, terms_accepted, privacy_policy_accepted, accepted_at
- Creates indexes on blood_type, medical_conditions, medical_aid_provider
- Adds row-level security policies

**When to Apply:** FIRST (before event-settings-schema.sql)

**Status:** Run once, modifies existing participants table

---

### `event-settings-schema.sql`
**Type:** NEW Database Schema
**Purpose:** Creates event settings table and custom number generation functions
**Size:** ~4 KB
**What It Does:**
- Creates event_settings table for storing configuration
- Fields: registration_prefix, registration_start_number, registration_current_number
- Fields: bib_prefix, bib_start_number, bib_current_number, auto_assign_bibs
- Creates function: `get_next_registration_number_custom(event_id)` - generates custom-formatted registration numbers
- Creates function: `get_next_bib_number(event_id)` - generates custom-formatted bib numbers
- Creates function: `bulk_assign_bibs(event_id, status)` - assigns bibs to unassigned participants
- Adds row-level security policies for event_settings table

**When to Apply:** SECOND (after participant-schema-enhanced.sql)

**Status:** Run once, creates new table and functions

---

## 💻 JavaScript Modules

### `event-settings.js` ⭐ NEW
**Type:** Frontend Component/Class
**Purpose:** Event Settings configuration interface
**Size:** ~8 KB
**Dependencies:** 
- supabase.js (for database access)

**What It Does:**
- Renders event settings configuration page
- Input fields for registration/bib prefix and starting numbers
- Live preview of number format (e.g., "REG-001")
- "Save Settings" button - applies configuration to event
- "Reset Counters" button - restart number sequence
- "Bulk Assign Bibs" button - assign bibs to unassigned participants
- Shows success/error messages
- Comprehensive styling with responsive design

**Usage:**
```javascript
import { EventSettings } from './event-settings.js';
const eventSettings = new EventSettings();
await eventSettings.render(eventId, onBackCallback);
```

**Methods:**
- `render(eventId, onBack)` - Main render method
- `loadSettings()` - Load current settings from database
- `handleSaveSettings()` - Save changes
- `handleResetCounters()` - Reset number counters
- `handleBulkAssignBibs()` - Assign bibs in bulk

**Styling:** Included (responsive CSS)

---

### `app.js` 🔄 UPDATED
**Type:** Main Application Router
**Purpose:** Route and manage all modules including new EventSettings
**Size:** ~3 KB
**Changes Made:**
- Added import for EventSettings: `import { EventSettings } from './event-settings.js';`
- Added 'settings' case in loadModule() function
- Routes to EventSettings component when 'settings' module selected
- Maintains all existing functionality (medical, security, safety, staff, participants)

**Key Additions:**
```javascript
} else if (moduleName === 'settings') {
  const eventSettings = new EventSettings();
  if (currentPage) {
    currentPage.destroy?.();
  }
  eventSettings.render(currentEvent?.id || currentEvent, backToIntegratedDashboard);
  currentPage = eventSettings;
}
```

**Compatibility:** Fully backwards compatible, no existing code removed

---

### `participant-registration.js` 🔄 UPDATED
**Type:** Frontend Component/Class
**Purpose:** Public-facing participant registration form
**Size:** ~10 KB
**Changes Made:**
- Enhanced form with medical information section:
  - Blood type dropdown
  - Medical conditions textarea
  - Allergies textarea
  - Medications textarea
- Enhanced medical aid & doctor section:
  - Medical aid provider input
  - Medical aid member number input
  - Doctor/GP name input
  - Doctor phone input
- Enhanced emergency contact section:
  - Emergency contact name
  - Emergency contact relationship dropdown
  - Emergency contact phone
- Race rules & terms section:
  - 4 checkboxes for acceptance tracking
  - Links to view race rules, terms, privacy policy
- Updated handleSubmit() to map all new fields
- Added registration number generation using custom format
- Added auto-bib-assignment if enabled in settings
- Added policy modal system for race rules, terms, privacy

**New Functions:**
- `setupPolicyModals()` - Initialize modal system
- `showModal(modalType)` - Display policy modals
- `closeModal(modalId)` - Close policy modals

**Database Calls:**
- Uses `get_next_registration_number_custom()` instead of `get_next_registration_number()`
- Checks event_settings for auto_assign_bibs flag
- Calls `get_next_bib_number()` if enabled

**Styling:** Enhanced with new form sections and modals

---

### `participants.js` 🔄 UPDATED
**Type:** Admin Management Component/Class
**Purpose:** Admin participant management interface
**Size:** ~16 KB
**Changes Made:**
- Added "Add Participant" button in controls bar
- Added "Add Participant" modal with comprehensive form matching registration form
- Added form data mapping for all medical/emergency fields
- Updated showParticipantDetail() to display new medical and emergency fields
- Added new detail sections:
  - Medical Information (blood type, conditions, allergies, medications)
  - Medical Aid & Doctor Details (provider, member #, doctor name/phone)
  - Agreements & Acceptance (tracking of accepted terms)
- Updated CSV export to include all 26 fields
- Added handleAddParticipant() method for admin registration
- Added bulk bib assignment support with button
- Added "Bulk Assign Bibs to Unassigned" button
- Added event listeners for modal controls

**New Methods:**
- `handleAddParticipant()` - Process admin registration form
- `showModal(modalType)` - Display policies/terms

**Database Calls:**
- Uses `get_next_registration_number_custom()` for custom format
- Checks event_settings for auto_assign_bibs
- Calls `get_next_bib_number()` if enabled
- Can call `bulk_assign_bibs()` RPC function

**Styling:** Added styles for add-participant-form, modals, messages

---

### `integrated-dashboard.js` 🔄 UPDATED
**Type:** Dashboard Component/Class
**Purpose:** Main event operations dashboard
**Size:** ~15 KB
**Changes Made:**
- Modified dashboard header to include button container
- Added "⚙️ Event Settings" button in header
- Added CSS for .header-buttons styling
- Added event listener for settings button
- Settings button calls `onModuleSelect('settings')` to navigate to settings page
- Maintains all existing functionality (metrics, alerts, timeline)

**New Elements:**
```html
<div class="header-buttons">
  <button class="btn btn-secondary" id="settings-btn">⚙️ Event Settings</button>
  <button class="btn btn-secondary" id="back-btn">← Back to Events</button>
</div>
```

**CSS Additions:**
- `.header-buttons` - Container for header buttons
- Button layout and spacing

**Backwards Compatible:** All existing dashboard features unchanged

---

## 🗂️ Documentation Files

### `README.md`
Comprehensive documentation covering:
- Package contents overview
- Installation instructions
- Feature descriptions
- Database functions reference
- Data flow diagrams
- Important notes and compatibility
- Testing recommendations

### `SETUP_GUIDE.md`
Quick-start guide with:
- 5-minute setup steps
- First-time use checklist
- Configuration instructions
- Troubleshooting section
- Feature usage examples
- Quick reference

### `FILE_MANIFEST.md` (this file)
Detailed manifest of all files with:
- Directory structure
- File descriptions
- Purposes and dependencies
- When to use/apply each file
- Key methods and changes

---

## 🚀 Implementation Order

1. **Read:** README.md (understand what's included)
2. **Read:** SETUP_GUIDE.md (quick overview)
3. **Apply:** participant-schema-enhanced.sql (database migration)
4. **Apply:** event-settings-schema.sql (database migration)
5. **Copy:** All files from javascript-modules/
6. **Test:** Follow checklist in SETUP_GUIDE.md

---

## 📊 File Statistics

| File | Type | Size | Status |
|------|------|------|--------|
| participant-schema-enhanced.sql | SQL | 2 KB | NEW |
| event-settings-schema.sql | SQL | 4 KB | NEW |
| event-settings.js | JS | 8 KB | NEW |
| app.js | JS | 3 KB | UPDATED |
| participant-registration.js | JS | 10 KB | UPDATED |
| participants.js | JS | 16 KB | UPDATED |
| integrated-dashboard.js | JS | 15 KB | UPDATED |
| README.md | MD | 6 KB | NEW |
| SETUP_GUIDE.md | MD | 5 KB | NEW |
| FILE_MANIFEST.md | MD | 4 KB | NEW |
| **TOTAL** | | **73 KB** | |

---

## ✅ Quality Checklist

- [x] All files included and organized
- [x] Database migrations in correct order
- [x] JavaScript imports properly configured
- [x] Backwards compatibility maintained
- [x] Error handling included
- [x] User feedback/messages included
- [x] Responsive design for mobile
- [x] Documentation complete
- [x] Setup instructions clear
- [x] Troubleshooting guide provided

---

## 📝 Notes

- All files use consistent naming conventions
- CSS is inline in JS files (no external stylesheets needed)
- All functions have error handling and user feedback
- Database RLS policies included for security
- No breaking changes to existing code
- Can be implemented gradually if needed

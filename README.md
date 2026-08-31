# VOC Event Operations Management System - Update Package

This package contains all updates for Phase 3 of the VOC system, including:
- Enhanced Participant Registration with medical/emergency contact details
- Manual admin participant registration
- Customizable registration and bib number sequences
- Event Settings configuration interface

## 📦 Package Contents

### Database Migrations
- **event-settings-schema.sql** - NEW: Event settings table and custom number generation functions
- **participant-schema-enhanced.sql** - NEW: Enhanced participant fields for medical/emergency info

### JavaScript Modules
- **event-settings.js** - NEW: Event Settings configuration interface
- **app.js** - UPDATED: Added EventSettings module routing
- **participant-registration.js** - UPDATED: Enhanced with medical fields and custom number sequences
- **participants.js** - UPDATED: Added manual registration form and bulk bib assignment
- **integrated-dashboard.js** - UPDATED: Added Event Settings button

## 🚀 Installation Steps

### Step 1: Apply Database Migrations
Execute these SQL migrations in Supabase in order:

1. **First**, apply the participant schema enhancement:
   ```
   Run: database-migrations/participant-schema-enhanced.sql
   ```
   This adds 13 new columns to the participants table for medical and emergency contact information.

2. **Second**, apply the event settings schema:
   ```
   Run: database-migrations/event-settings-schema.sql
   ```
   This creates:
   - event_settings table
   - Custom number generation functions
   - Bulk bib assignment function

### Step 2: Replace JavaScript Modules
Replace your existing files with the updated versions from `javascript-modules/`:

- `app.js` → Root of your project
- `event-settings.js` → Add to project (import in app.js)
- `participant-registration.js` → Replace existing
- `participants.js` → Replace existing
- `integrated-dashboard.js` → Replace existing

### Step 3: Update Imports (if needed)
Ensure your HTML or module loader includes:
```javascript
import { EventSettings } from './event-settings.js';
```

The app.js file already includes this import.

## ✨ New Features

### 1. Enhanced Participant Registration
- **Medical Information**: Blood type, conditions, allergies, medications
- **Medical Aid & Doctor Details**: Provider info, doctor contact
- **Emergency Contact Details**: Name, relationship, phone
- **Terms & Conditions**: Race rules, terms, privacy acceptance with modals

### 2. Admin Manual Registration
- **Add Participant Button** in admin dashboard
- Comprehensive form with all medical/emergency fields
- Same validation as public registration
- Auto-generates registration number
- Optional auto-assign bib number

### 3. Customizable Number Sequences
**Registration Numbers** (e.g., REG-001, REG-002):
- Custom prefix (REG, ENTRY, RUN, etc.)
- Custom starting number (1, 100, 1000, etc.)
- Auto-generates for every new registration

**Bib Numbers** (e.g., BIB-001, BIB-002):
- Custom prefix (BIB, BIB#, RUNNER, etc.)
- Custom starting number
- Manual or auto-assignment
- Bulk assign to unassigned participants

### 4. Event Settings Interface
Access via **⚙️ Event Settings** button on event dashboard:
- Configure registration number format
- Configure bib number format
- Toggle auto-assignment of bibs
- Reset number counters
- Bulk assign bibs to participants
- Live preview of number formats

## 📋 Database Functions

### New Functions Created

**get_next_registration_number_custom(event_id)**
- Generates next registration number with custom format
- Returns: "PREFIX-NNN" format

**get_next_bib_number(event_id)**
- Generates next bib number with custom format
- Returns: "PREFIX-NNN" format

**bulk_assign_bibs(event_id, status)**
- Assigns bib numbers to unassigned participants
- Optional status filter (default: 'registered')
- Returns: Updated participants with assigned bibs

## 🔄 Data Flow

### Public Registration
1. Participant fills form (public-facing)
2. System checks email uniqueness
3. Auto-generates registration number using custom format
4. If auto-assign enabled: assigns bib number
5. Stores all medical/emergency/terms data
6. Shows confirmation with registration number

### Admin Registration
1. Admin clicks "Add Participant" button
2. Admin fills comprehensive form
3. System validates email uniqueness
4. Auto-generates registration number
5. If auto-assign enabled: assigns bib number
6. Records participant with all details
7. Shows success message with registration number

### Settings Configuration
1. Admin clicks "⚙️ Event Settings"
2. Admin configures:
   - Registration prefix and start number
   - Bib prefix and start number
   - Auto-assignment toggle
3. Settings saved to event_settings table
4. All new registrations use these settings

## ⚠️ Important Notes

### Database Migration Order
- Always run **participant-schema-enhanced.sql first**
- Then run **event-settings-schema.sql**
- This ensures proper foreign key relationships

### Backwards Compatibility
- Existing participant records will have NULL values for new fields
- This is safe and doesn't break existing functionality
- New registrations will populate all fields

### Number Generation
- Counters start at 0 and increment for each registration
- Numbers are padded to 3 digits: 001, 002, 100, 1000
- Format is: PREFIX-NNN (e.g., REG-001)
- Can reset counters anytime via Event Settings

### Auto-Assignment
- When disabled: Bibs can be assigned manually later via "Bulk Assign" button
- When enabled: Every new registration gets automatic bib
- Admins can always manually override individual bib assignments

## 🧪 Testing Recommendations

1. **Test Public Registration**
   - Register a participant via public form
   - Verify custom registration number is generated
   - Verify bib is auto-assigned if enabled
   - Check medical/emergency fields are stored

2. **Test Admin Registration**
   - Add participant via admin form
   - Try with/without auto-assign enabled
   - Test bulk assign button
   - Verify email duplicate detection

3. **Test Event Settings**
   - Change registration prefix (e.g., "ENTRY")
   - Change starting number (e.g., 100)
   - Change bib prefix and number
   - Toggle auto-assign and test
   - Click "Reset Counters" and verify restart

4. **Test Data Display**
   - View participant details modal
   - Verify medical info displays correctly
   - Verify emergency contact shows
   - Export CSV includes all new fields

## 📞 Support

If you encounter issues:
1. Check database migration order
2. Verify all imports are correct in app.js
3. Clear browser cache and restart app
4. Check browser console for error messages
5. Review Supabase logs for database errors

## 📝 Version History

**Phase 3 Update - Current**
- Added customizable number sequences
- Added event settings interface
- Enhanced participant schema
- Added admin manual registration

**Phase 2** (Previous)
- Staff management system
- Participant registration system
- Dashboard integration

**Phase 1** (Previous)
- Event management
- Medical operations
- Security incidents
- Safety compliance

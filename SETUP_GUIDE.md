# Quick Setup Guide

## ⏱️ 5-Minute Setup

### 1. Database Migrations (2 minutes)

**Step 1a:** Open Supabase SQL Editor

**Step 1b:** Copy and execute this file first:
```
database-migrations/participant-schema-enhanced.sql
```
Wait for success message.

**Step 1c:** Copy and execute this file second:
```
database-migrations/event-settings-schema.sql
```
Wait for success message.

### 2. File Replacement (2 minutes)

Copy these files from `javascript-modules/` to your project:

```
✓ event-settings.js (new file)
✓ app.js (replace existing)
✓ participant-registration.js (replace existing)
✓ participants.js (replace existing)
✓ integrated-dashboard.js (replace existing)
```

### 3. Test (1 minute)

**Restart your app:**
1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Refresh page (F5)
3. Navigate to an event
4. Look for "⚙️ Event Settings" button in header
5. Click it to verify event settings page loads

---

## 🎯 First Time Use Checklist

- [ ] Database migrations applied successfully
- [ ] All files copied to project
- [ ] App restarts without console errors
- [ ] Event Settings button appears on dashboard
- [ ] Event Settings page loads when clicked
- [ ] Can configure registration/bib prefixes
- [ ] Can register a public participant (old form still works)
- [ ] Can add participant manually from admin panel
- [ ] Participant data displays in detail modal
- [ ] CSV export includes all new fields

---

## 🔧 Configuration (After Setup)

For each event you want to customize:

1. **Go to Event Dashboard**
2. **Click "⚙️ Event Settings"**
3. **Configure:**
   - Registration prefix (e.g., "REG" → "ENTRY")
   - Starting number (e.g., "1" → "100")
   - Bib prefix (e.g., "BIB" → "RUNNER")
   - Auto-assign toggle
4. **Click "Save Settings"**
5. **Test with a new registration**

---

## 🐛 Troubleshooting

**"Event Settings button not showing"**
- Clear browser cache
- Ensure integrated-dashboard.js is updated
- Check browser console for errors

**"Registration numbers not generating"**
- Check if event_settings table exists in Supabase
- Verify database migrations ran successfully
- Look for SQL errors in Supabase logs

**"Medical fields showing as blank"**
- Participant records made before migration won't have data
- New registrations will capture the data
- This is normal and doesn't cause errors

**"Auto-assign not working"**
- Check if "Auto-assign bibs" toggle is enabled in settings
- Verify bib_number function exists (check Supabase functions)
- Try resetting counters and testing again

---

## 📋 What Changed

### New Database Tables
- `event_settings` - stores configuration per event

### New Database Functions
- `get_next_registration_number_custom()` - custom format
- `get_next_bib_number()` - custom format
- `bulk_assign_bibs()` - bulk assign bibs

### New Database Columns (participants table)
```
blood_type
medical_conditions
allergies
medications
medical_aid_provider
medical_aid_member_number
doctor_name
doctor_phone
emergency_contact_relationship
race_rules_accepted
terms_accepted
privacy_policy_accepted
accepted_at
```

### New JavaScript Files
- `event-settings.js` - Event settings UI component

### Updated JavaScript Files
- `app.js` - Added EventSettings import and routing
- `participant-registration.js` - Medical fields + custom numbers
- `participants.js` - Admin form + bulk assign
- `integrated-dashboard.js` - Settings button

---

## 🎓 How To Use New Features

### Configure Registrations
1. Go to event dashboard
2. Click "⚙️ Event Settings"
3. Change registration prefix from "REG" to whatever you want
4. Change starting number (default 1)
5. Click "Save"
6. Next new registration uses new format

### Register Participants Manually
1. Go to Participants Management
2. Click "➕ Add Participant"
3. Fill in all details (optional medical info)
4. Click "Add Participant"
5. Registration number auto-generates
6. Bib auto-assigns if enabled in settings

### Assign Bibs Later
1. Go to Participants Management
2. Click "📋 Bulk Assign Bibs to Unassigned"
3. Confirm when prompted
4. All unassigned participants get bibs
5. See success message with count

### Export Participant Data
1. Go to Participants Management
2. Click "📥 Export List"
3. CSV downloaded with all 26 fields including:
   - Blood type, medical conditions, medications
   - Medical aid provider and member number
   - Doctor name and phone
   - Emergency contact with relationship
   - All term acceptance dates

---

## 📞 Quick Reference

**Settings Button Location:** Event Dashboard Header (⚙️)
**Add Participant Button:** Participants Management (➕)
**Bulk Assign Button:** Participants Management (📋)
**Export Button:** Participants Management (📥)

**Default Formats:**
- Registration: REG-001, REG-002, REG-003
- Bib: BIB-001, BIB-002, BIB-003

**Can Customize:**
- Prefixes (REG → ENTRY, BIB → RUNNER, etc.)
- Starting numbers (1 → 100, 1000, etc.)
- Auto-assignment (on/off)

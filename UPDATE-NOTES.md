# VOC Command App: usability and design update (29 Sept 2026)

## How to install
Upload every file in this folder to the root of the **Event-Voc-Operations-Hub** GitHub repo. Replace any existing files with the same name. Vercel rebuilds automatically. You don't need any database changes.

New files: `icons.js`, `ui.js`, `voc-ui.css`
Updated files: every other `.js` file in this folder, plus `index.html` and `main.css`

## New features
- **Live command bar** at the top of every signed-in page. It shows:
  - the current event
  - an automatic operational status (NORMAL / ELEVATED / CRITICAL), worked out from open incidents and hazards
  - a live SAST clock
  - search
  - a light/dark mode switch
- **Operations banner** on the event overview. It shows the event status in colour, plus four numbers: open incidents, critical items, staff on duty and participants checked in.
- **Module navigation in the sidebar.** Once you open an event, every module is one click away (Medical, Security, Safety, Staff, Participants, Vendors, Route Map, Settings). You no longer have to go back to the dashboard between modules.
- **Command palette.** Press **Ctrl+K** (Cmd+K on Mac) and type to jump to any module or run an action.
- **Quick Report button.** A red button at bottom-right (keyboard: **N**) logs a medical incident, security incident or safety hazard from any screen. It opens the right form straight away.
- **One-click SITREP.** A printable situation report covering status, open and resolved incidents, medical, staff, participants, resources and risk. It opens in a new tab ready to print or save as PDF (keyboard: **Shift+S**).
- **Events list:** search, filters (Live / Upcoming / Past), a "Starts in X days" countdown, and the whole card is clickable.
- **Toast notifications** replace the old browser pop-up alerts.
- **Esc** now closes any open form or dialog.

## Professional icons
About 280 emoji have been replaced with one consistent set of line icons (`icons.js`). They take on the colour of the surrounding text, so they suit both themes. Route map markers now use coloured icon pins instead of emoji.

## Bugs fixed
1. **Logout did nothing** on the event overview, Medical, Security, Safety, Staff, Participants, Vendors, Route Map and Event Settings pages.
2. **Medical triage counts on the event dashboard were always 0** because of a "critical" vs "Critical" case mismatch. For the same reason the Critical Alerts panel never appeared.
3. **Medical incidents were missing from the dashboard.** It filtered by `medical_incidents.event_id`, which is often empty. It now filters through the parent incident, the same way the Medical module does.
4. **Security threat level showed "undefined"**, and every threat counted as Green. The value is now read from the parent incident.
5. **Staff "checked in" count** relied on the order rows came back in. It now counts anyone with an open check-in.
6. **Once the events list had been opened, all primary buttons stretched full width** across the app. The cause was a global `.btn-primary { flex: 1 }` rule.
7. **Computers set to light mode got a half-light, half-dark UI.** The theme is now consistent, with an optional light mode.
8. **Route Map legend labels were invisible** (white on white), and the page was out of theme.
9. **Event dates showed "to undefined"** when an event had no end date. Dates are now in South African format.
10. **The navbar added a new `<style>` tag on every page change.** This was a slow memory leak.
11. The login page's placeholder "Demo credentials available for testing" text has been replaced with guidance for users who can't sign in.

## Recommended (not changed)
- The Google Maps API key is visible in `index.html`, which is normal for Maps. Make sure it's **restricted to your domain** in Google Cloud Console so nobody else can use it on your bill.

# Quick Start Guide - 15 Minutes to Live

This guide will get you from zero to a working command centre dashboard in 15 minutes.

## Prerequisites (2 min)
- [ ] Supabase account
- [ ] GitHub account  
- [ ] Vercel account (linked to GitHub)

---

## Step 1: Supabase Setup (5 min)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project in your organization
3. Wait for project initialization (~2 min)
4. Go to **Settings** → **API** and copy:
   - `Project URL` (e.g., `https://xxx.supabase.co`)
   - `Anon Public Key`

### 1.2 Initialize Database
1. Go to **SQL Editor**
2. Copy contents of `database/schema.sql` and paste into SQL editor
3. Click **Run** and wait for completion
4. Copy contents of `database/rls.sql` and paste
5. Click **Run**
6. Copy contents of `database/seed.sql` and paste
7. Click **Run**

**Database now has:**
- ✅ 35+ tables with relationships
- ✅ Row-Level Security on all tables
- ✅ Demo event: "Cape Town Sports Festival 2024"
- ✅ 3 demo venues with zones
- ✅ 20+ incident categories
- ✅ Demo emergency contacts and email templates

### 1.3 Create Demo User
1. Go to **Authentication** → **Users**
2. Click **Invite**
3. Enter: `admin@example.com`
4. Click **Send invite**
5. Copy the User ID that appears
6. Go back to **SQL Editor**
7. Run this SQL (replace `[USER_ID]`):
```sql
-- Create user profile
INSERT INTO users (id, email, full_name, status)
VALUES (
  '[USER_ID]',
  'admin@example.com',
  'Admin User',
  'active'
);

-- Assign to demo event
INSERT INTO event_members (user_id, event_id, role_id, status)
SELECT 
  '[USER_ID]',
  '00000000-0000-0000-0000-000000000002',
  id,
  'active'
FROM roles 
WHERE name IN ('super_administrator', 'joc_commander');
```

---

## Step 2: GitHub Setup (2 min)

### 2.1 Push Code to GitHub
1. Create repository: `Event-VOC-Operations-Hub` on GitHub
2. Clone it locally
3. Copy all files from this zip into the repository
4. Commit and push:
```bash
git add .
git commit -m "Initial JOC Command Centre setup"
git push origin main
```

---

## Step 3: Vercel Deployment (5 min)

### 3.1 Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Select your GitHub repository
4. Click **Import**

### 3.2 Environment Variables (Critical!)
1. In the deployment settings, go to **Environment Variables**
2. Add:
   - **Name:** `VITE_SUPABASE_URL`  
   - **Value:** (paste from Supabase)
   - **Type:** Select **Config** (not Secret!)
3. Click **Add**
4. Add second variable:
   - **Name:** `VITE_SUPABASE_ANON_KEY`  
   - **Value:** (paste from Supabase)
   - **Type:** Select **Config**
5. Click **Deploy**

Wait for deployment to complete (~2-3 min)

---

## Step 4: Test Login (1 min)

1. Click the Vercel deployment URL
2. You should see the JOC Command Centre login page
3. Log in with:
   - Email: `admin@example.com`
   - Password: (the one you set in Supabase)
4. Select "Cape Town Sports Festival 2024"
5. You should see the operations dashboard!

---

## 🎉 Success!

Your command centre is now live with:
- ✅ Authentication working
- ✅ Demo event loaded
- ✅ 3 demo venues and zones
- ✅ Database fully initialized
- ✅ RLS policies enforcing security

## Next Steps

**For Testing:**
- Create more demo users in Supabase Auth
- Assign them to different roles
- Experiment with incident reporting

**For Production:**
- Create real users via Supabase Auth
- Configure email templates for notifications
- Set up emergency contacts
- Create operational groups and team structures

**For Phase 2:**
- Build out medical operations dashboard
- Implement security module
- Add real-time incident escalation
- Create compliance reporting

---

## Troubleshooting

**Can't log in?**
- Check Supabase user exists in Auth
- Verify user profile was created (run SELECT query on users table)
- Check event_members table has entries

**Dashboard shows no events?**
- Verify seed.sql executed successfully
- Check demo event ID in database: `00000000-0000-0000-0000-000000000002`

**Network errors on Vercel?**
- Verify environment variables are set as **Config** type
- Trigger a redeploy in Vercel
- Check Supabase project is active

**RLS policy errors?**
- Ensure user has event_members entry
- Verify role_id is correct in event_members
- Check RLS policies are enabled on tables

---

## Quick Reference

**Supabase Project Details:**
- URL: https://[project-id].supabase.co
- Anon Key: eyJhbG... (from Settings > API)

**Demo Event:**
- ID: `00000000-0000-0000-0000-000000000002`
- Name: Cape Town Sports Festival 2024
- Code: CTSF-2024

**Demo User:**
- Email: admin@example.com
- Roles: Super Administrator, JOC Commander

**Vercel Deployment:**
- Environment: Production
- Branch: main
- Build: `npm run build`
- Output: `dist/`

---

**Need help?** Check README.md for detailed information.

# JOC Command Centre
## Event Operations Management System - Phase 1

A professional command centre application for managing Joint Operations Centre (JOC) and Venue Operations Centre (VOC) activities during large-scale events. Built for enterprise-grade reliability with row-level security, real-time incident management, and multi-role access control.

### 🎯 Phase 1: Foundation (Current)
- ✅ Authentication (Supabase Auth)
- ✅ Event management dashboard
- ✅ Incident reporting and tracking
- ✅ Multi-role access control (RBAC)
- ✅ Database with 35+ tables
- ✅ Row-Level Security (RLS) policies
- ✅ Responsive UI for command centre

### 📋 Project Stack

**Frontend**
- HTML5, CSS3, Vanilla JavaScript (ES6 modules)
- Responsive design system with CSS custom properties
- Light/dark theme support

**Backend & Database**
- Supabase (PostgreSQL + Auth + Real-time)
- 35+ normalized tables with proper relationships
- Row-Level Security policies on all tables
- 10 predefined operational roles

**Deployment**
- GitHub (version control)
- Vercel (static hosting)
- Supabase Cloud (database & authentication)

### 🚀 Quick Start

**Prerequisites:**
- Supabase account with a project initialized
- GitHub account with repository created
- Vercel account connected to GitHub

**Environment Variables:**
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Demo Credentials:**
After creating a user in Supabase Auth:
- Email: your-email@example.com
- Password: (your chosen password)

### 📁 Project Structure

```
Event-VOC-Operations-Hub/
├── index.html              # Entry point
├── main.js                 # Vite entry point
├── package.json            # Dependencies
├── vercel.json            # Vercel deployment config
├── vite.config.js         # Vite configuration
├── .env.example           # Environment variables template
├── src/
│   ├── app.js             # Main app controller
│   ├── services/
│   │   ├── supabase.js    # Supabase client & API helpers
│   │   └── auth.js        # Authentication service
│   ├── pages/
│   │   ├── login.js       # Login page component
│   │   └── dashboard.js   # Dashboard & event selection
│   ├── components/
│   │   └── navbar.js      # Navigation bar
│   └── styles/
│       └── main.css       # Complete styling
└── docs/
    └── ARCHITECTURE.md    # System design & data model
```

### 🔐 Security Features

- **Row-Level Security (RLS)**: All database queries filtered by user roles
- **Authentication**: Supabase Auth with email/password
- **Role-Based Access Control (RBAC)**: 10 predefined roles with specific permissions
- **Audit Logging**: All changes tracked for compliance
- **Data Encryption**: Supabase handles encryption at rest and in transit

### 📊 Database Schema

**Core Tables:**
- `users` - User accounts
- `organisations` - Event organisations
- `events` - Events with metadata
- `venues` - Event venues with capacity
- `zones` - Venue zones (VIP, seating, competition, medical, media)
- `roles` - Predefined operational roles

**Operational Tables:**
- `incidents` - Incident reports with severity
- `tasks` - Task assignments
- `communications` - Messages and notifications
- `operational_groups` - Team structures

**Specialized Tables:**
- `medical_incidents` - Medical emergencies
- `safety_inspections` - Safety checks
- `risk_assessments` - Risk evaluations

**Administrative Tables:**
- `audit_logs` - Immutable audit trail
- `email_templates` - Notification templates
- `emergency_contacts` - Critical contacts

### 👥 Predefined Roles

1. **Super Administrator** - Full system access
2. **Event Administrator** - Event configuration and team management
3. **JOC Commander** - Incident coordination and escalation
4. **VOC Manager** - Venue-specific operations
5. **Safety Officer** - Safety compliance and inspections
6. **Medical Manager** - Medical incidents and responses
7. **Security Manager** - Security incidents and personnel
8. **Police Liaison** - Police coordination
9. **Communications Officer** - Internal communications
10. **Observer (Read-Only)** - View-only access

### 🔄 Typical Workflow

1. **Event Setup** - Event Administrator creates event, venues, and zones
2. **Team Assignment** - Administrators assign personnel to roles
3. **Operations** - Teams log in and see their event dashboard
4. **Incident Reporting** - Any team member can report incidents
5. **Escalation** - JOC Commander reviews and escalates incidents
6. **Resolution** - Teams respond and update incident status

### 📈 Roadmap

**Phase 2: Operations**
- Real-time incident dashboards
- Medical operations module
- Security module
- Safety compliance module
- Task management system

**Phase 3: Intelligence**
- Analytics and reporting
- Trend analysis
- Predictive alerts
- Export capabilities

**Phase 4: Enterprise**
- Multi-event management
- Advanced reporting
- API for third-party integration
- Mobile app

### 🤝 Contributing

This is a project for iHub SA. For contributions and deployment questions, please contact the development team.

### 📄 License

MIT License - See LICENSE file for details

### 📞 Support

For issues and feature requests, please use the GitHub Issues tracker.

---

**Built with ❤️ for professional event operations management**

# Baptism Class Tracker

Frontend: HTML/CSS/JavaScript  
Backend: Supabase (PostgreSQL + Auth)

## 1) Local Setup

1. Install dependencies:
   - `npm install`
2. Configure Supabase credentials:
   - Copy `.env.example` to `.env` (for local reference)
   - Edit `client/js/config.js` and set:
     - `window.SUPABASE_URL`
     - `window.SUPABASE_ANON_KEY` (or publishable key)
3. Open `client/login.html` in browser (or use a static server).

## 2) Supabase Project Setup Guide

1. Create a Supabase project.
2. In Supabase dashboard:
   - Go to `Settings -> API`
   - Copy:
     - Project URL
     - Publishable/anon key
3. Paste those values into `client/js/config.js`.
4. In `Authentication -> Users`, create at least one user (email/password) to log in.

## 3) .env Example

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

## 4) SQL Import Steps (Supabase SQL Editor)

Run scripts in this order:

1. `supabase/01_schema_seed.sql`
   - Creates tables, PK/FK, RLS, and inserts sample data.
2. `supabase/02_safe_schema_migration.sql`
   - Safe canonical migration (`baptism_schedule`), compatibility view, indexes, and `updated_at` trigger.
3. `supabase/03_rls_hardening.sql`
   - Replaces broad RLS with role-aware policies + bootstrap fallback.
4. `supabase/dashboard_view.sql`
   - Dashboard aggregation view.
5. `supabase/attendance_report_view.sql`
   - JOIN report view (participants + attendance + classes).
6. `supabase/subqueries.sql`
   - Three required PostgreSQL subqueries.
7. `supabase/attendance_per_participant_cte.sql`
   - Required CTE-based attendance totals view.

## 5) Requirements Checklist

- ✔ Aggregation
  - `supabase/dashboard_view.sql` (`COUNT`, `AVG`, `MAX`, `MIN`, completed count)
- ✔ JOIN (3 tables)
  - `supabase/attendance_report_view.sql` (`attendance` + `participants` + `classes`)
- ✔ Subqueries (3)
  - `supabase/subqueries.sql`
- ✔ CTE (1)
  - `supabase/attendance_per_participant_cte.sql`

## 6) Frontend Features Connected

- Login/logout/session protection via Supabase Auth.
- CRUD pages wired to Supabase client:
  - Participants, Classes, Attendance, Baptism Schedule, Requirements
- Participant profile page:
  - `client/participant.html` (open from Participants table **Profile**)
- Dashboard reads SQL aggregation view.
- Reports page reads SQL JOIN view (with fallback relational query).
- Loading and error states on each page/action.
- Phase 2 operational UX:
  - `client/attendance_session.html` bulk attendance grid (per class) + save + live roll-call summary
  - Participants list paging + live name search
  - Classes and Attendance table paging
  - Reports CSV export

## 7) Security/Data Hardening Notes

- Canonical table is now `public.baptism_schedule`.
- Legacy compatibility view `public.baptismschedule` is kept for transitional safety.
- Role-aware RLS uses:
  - `users.auth_user_id` (mapped to `auth.users.id`)
  - `public.current_app_role()` helper
- Bootstrap fallback is enabled:
  - if no `auth_user_id` mappings exist yet, authenticated access remains available until mappings are added.

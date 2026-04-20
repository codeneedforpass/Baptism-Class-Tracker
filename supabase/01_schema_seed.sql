create extension if not exists pgcrypto;

drop table if exists public.requirements cascade;
drop view if exists public.baptismschedule cascade;
drop table if exists public.baptism_schedule cascade;
drop table if exists public.attendance cascade;
drop table if exists public.classes cascade;
drop table if exists public.participants cascade;
drop table if exists public.users cascade;

create table public.users (
  user_id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'teacher', 'assistant')),
  created_at timestamptz not null default now()
);

create table public.participants (
  participant_id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  phone text,
  email text,
  enrolled_at timestamptz not null default now(),
  created_by uuid references public.users(user_id) on delete set null
);

create table public.classes (
  class_id uuid primary key default gen_random_uuid(),
  class_name text not null,
  class_date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  instructor_user_id uuid references public.users(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.attendance (
  attendance_id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(participant_id) on delete cascade,
  class_id uuid not null references public.classes(class_id) on delete cascade,
  attendance_status text not null check (attendance_status in ('present', 'absent', 'late', 'excused')),
  marked_at timestamptz not null default now(),
  unique (participant_id, class_id)
);

create table public.baptism_schedule (
  schedule_id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(participant_id) on delete cascade,
  class_id uuid references public.classes(class_id) on delete set null,
  baptism_date date not null,
  baptism_time time not null,
  location text not null,
  status text not null check (status in ('scheduled', 'completed', 'postponed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.requirements (
  requirement_id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(participant_id) on delete cascade,
  requirement_name text not null,
  requirement_status text not null check (requirement_status in ('pending', 'completed', 'waived')),
  verified_at timestamptz,
  notes text
);

alter table public.users enable row level security;
alter table public.participants enable row level security;
alter table public.classes enable row level security;
alter table public.attendance enable row level security;
alter table public.baptism_schedule enable row level security;
alter table public.requirements enable row level security;

create policy "users_auth_all" on public.users for all to authenticated using (true) with check (true);
create policy "participants_auth_all" on public.participants for all to authenticated using (true) with check (true);
create policy "classes_auth_all" on public.classes for all to authenticated using (true) with check (true);
create policy "attendance_auth_all" on public.attendance for all to authenticated using (true) with check (true);
create policy "baptismschedule_auth_all" on public.baptism_schedule for all to authenticated using (true) with check (true);
create policy "requirements_auth_all" on public.requirements for all to authenticated using (true) with check (true);

insert into public.users (user_id, full_name, email, role) values
('11111111-1111-1111-1111-111111111111', 'Grace Allen', 'grace.allen@church.org', 'admin'),
('11111111-1111-1111-1111-111111111112', 'Michael Brown', 'michael.brown@church.org', 'teacher'),
('11111111-1111-1111-1111-111111111113', 'Sarah Carter', 'sarah.carter@church.org', 'assistant'),
('11111111-1111-1111-1111-111111111114', 'David Evans', 'david.evans@church.org', 'teacher'),
('11111111-1111-1111-1111-111111111115', 'Lydia Foster', 'lydia.foster@church.org', 'assistant');

insert into public.participants (participant_id, first_name, last_name, date_of_birth, phone, email, created_by) values
('22222222-2222-2222-2222-222222222221', 'Noah', 'Johnson', '2010-03-14', '555-0101', 'noah.j@example.com', '11111111-1111-1111-1111-111111111112'),
('22222222-2222-2222-2222-222222222222', 'Olivia', 'Smith', '2009-09-02', '555-0102', 'olivia.s@example.com', '11111111-1111-1111-1111-111111111113'),
('22222222-2222-2222-2222-222222222223', 'Ethan', 'Williams', '2011-01-21', '555-0103', 'ethan.w@example.com', '11111111-1111-1111-1111-111111111114'),
('22222222-2222-2222-2222-222222222224', 'Ava', 'Davis', '2010-07-30', '555-0104', 'ava.d@example.com', '11111111-1111-1111-1111-111111111112'),
('22222222-2222-2222-2222-222222222225', 'Lucas', 'Miller', '2008-12-11', '555-0105', 'lucas.m@example.com', '11111111-1111-1111-1111-111111111113');

insert into public.classes (class_id, class_name, class_date, start_time, end_time, location, instructor_user_id) values
('33333333-3333-3333-3333-333333333331', 'Introduction to Baptism', '2026-05-03', '09:00', '10:30', 'Room A', '11111111-1111-1111-1111-111111111112'),
('33333333-3333-3333-3333-333333333332', 'Faith Foundations', '2026-05-10', '09:00', '10:30', 'Room A', '11111111-1111-1111-1111-111111111114'),
('33333333-3333-3333-3333-333333333333', 'Prayer and Commitment', '2026-05-17', '09:00', '10:30', 'Room B', '11111111-1111-1111-1111-111111111112'),
('33333333-3333-3333-3333-333333333334', 'Church Community', '2026-05-24', '09:00', '10:30', 'Room B', '11111111-1111-1111-1111-111111111114'),
('33333333-3333-3333-3333-333333333335', 'Final Preparation', '2026-05-31', '09:00', '10:30', 'Main Hall', '11111111-1111-1111-1111-111111111112');

insert into public.attendance (attendance_id, participant_id, class_id, attendance_status) values
('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', 'present'),
('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331', 'present'),
('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333332', 'late'),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222224', '33333333-3333-3333-3333-333333333333', 'absent'),
('44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222225', '33333333-3333-3333-3333-333333333334', 'excused');

insert into public.baptism_schedule (schedule_id, participant_id, class_id, baptism_date, baptism_time, location, status) values
('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333335', '2026-06-07', '11:00', 'Main Sanctuary', 'scheduled'),
('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333335', '2026-06-07', '11:00', 'Main Sanctuary', 'completed'),
('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333335', '2026-06-14', '11:00', 'Main Sanctuary', 'postponed'),
('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222224', '33333333-3333-3333-3333-333333333335', '2026-06-14', '11:00', 'Main Sanctuary', 'scheduled'),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222225', '33333333-3333-3333-3333-333333333335', '2026-06-21', '11:00', 'Main Sanctuary', 'cancelled');

create or replace view public.baptismschedule as
select * from public.baptism_schedule;

insert into public.requirements (requirement_id, participant_id, requirement_name, requirement_status, verified_at, notes) values
('66666666-6666-6666-6666-666666666661', '22222222-2222-2222-2222-222222222221', 'Completed all classes', 'completed', now(), 'All sessions attended'),
('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222', 'Pastoral interview', 'completed', now(), 'Interview approved'),
('66666666-6666-6666-6666-666666666663', '22222222-2222-2222-2222-222222222223', 'Parental consent form', 'pending', null, 'Waiting for signed form'),
('66666666-6666-6666-6666-666666666664', '22222222-2222-2222-2222-222222222224', 'Faith testimony submitted', 'completed', now(), 'Reviewed by assistant'),
('66666666-6666-6666-6666-666666666665', '22222222-2222-2222-2222-222222222225', 'Baptism class workbook', 'waived', now(), 'Waived by admin');

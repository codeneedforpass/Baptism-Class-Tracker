-- Safe schema migration
-- - Normalizes baptismschedule -> baptism_schedule
-- - Preserves compatibility via view
-- - Adds updated_at and indexes for common queries

begin;

-- 1) Canonical table naming: baptismschedule -> baptism_schedule
do $$
begin
  if to_regclass('public.baptismschedule') is not null
     and to_regclass('public.baptism_schedule') is null then
    execute 'alter table public.baptismschedule rename to baptism_schedule';
  end if;
end $$;

-- 2) Backward compatibility object for existing code paths
drop view if exists public.baptismschedule;
create or replace view public.baptismschedule as
select * from public.baptism_schedule;

-- 3) Add updated_at columns (idempotent)
alter table public.users add column if not exists updated_at timestamptz not null default now();
alter table public.participants add column if not exists updated_at timestamptz not null default now();
alter table public.classes add column if not exists updated_at timestamptz not null default now();
alter table public.attendance add column if not exists updated_at timestamptz not null default now();
alter table public.baptism_schedule add column if not exists updated_at timestamptz not null default now();
alter table public.requirements add column if not exists updated_at timestamptz not null default now();
alter table public.requirements add column if not exists notes text;

-- 4) Optional auth linkage for role-aware RLS
alter table public.users add column if not exists auth_user_id uuid unique;

-- 5) Generic updated_at trigger helper
create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_participants_updated_at on public.participants;
create trigger trg_participants_updated_at
before update on public.participants
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at
before update on public.classes
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at
before update on public.attendance
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_baptism_schedule_updated_at on public.baptism_schedule;
create trigger trg_baptism_schedule_updated_at
before update on public.baptism_schedule
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_requirements_updated_at on public.requirements;
create trigger trg_requirements_updated_at
before update on public.requirements
for each row execute function public.set_row_updated_at();

-- 6) Performance indexes for common filters/sorts
create index if not exists idx_attendance_class_participant
  on public.attendance (class_id, participant_id);

create index if not exists idx_attendance_marked_at
  on public.attendance (marked_at desc);

create index if not exists idx_participants_name
  on public.participants (last_name, first_name);

create index if not exists idx_baptism_schedule_status_date
  on public.baptism_schedule (status, baptism_date);

commit;

-- PostgreSQL CTE: total attendance per participant
-- Run in Supabase SQL editor

create or replace view public.attendance_per_participant as
with attendance_totals as (
  select
    a.participant_id,
    count(*)::int as total_attendance
  from public.attendance a
  group by a.participant_id
)
select
  p.participant_id,
  p.first_name,
  p.last_name,
  coalesce(at.total_attendance, 0) as total_attendance
from public.participants p
left join attendance_totals at
  on at.participant_id = p.participant_id
order by total_attendance desc, p.last_name asc, p.first_name asc;

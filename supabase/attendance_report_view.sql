-- Run this in Supabase SQL editor
-- SQL VIEW joining participants + attendance + classes

create or replace view public.attendance_report as
select
  a.attendance_id,
  a.attendance_status as status,
  a.marked_at,
  p.participant_id,
  p.first_name,
  p.last_name,
  (p.first_name || ' ' || p.last_name) as participant_name,
  c.class_id,
  c.class_name,
  c.class_date
from public.attendance a
join public.participants p on p.participant_id = a.participant_id
join public.classes c on c.class_id = a.class_id;

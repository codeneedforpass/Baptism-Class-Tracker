-- PostgreSQL subqueries for Baptism Class Tracker
-- Run in Supabase SQL editor

-- 1) Participants with baptism schedule
-- Uses an IN() subquery against baptismschedule
select
  p.participant_id,
  p.first_name,
  p.last_name,
  p.email
from public.participants p
where p.participant_id in (
  select bs.participant_id
  from public.baptismschedule bs
);

-- 2) Participants older than average age
-- Uses a scalar subquery with AVG age
select
  p.participant_id,
  p.first_name,
  p.last_name,
  date_part('year', age(current_date, p.date_of_birth))::int as age_years
from public.participants p
where p.date_of_birth is not null
  and date_part('year', age(current_date, p.date_of_birth)) > (
    select avg(date_part('year', age(current_date, p2.date_of_birth)))
    from public.participants p2
    where p2.date_of_birth is not null
  )
order by age_years desc;

-- 3) Classes with no attendance
-- Uses NOT EXISTS correlated subquery
select
  c.class_id,
  c.class_name,
  c.class_date,
  c.location
from public.classes c
where not exists (
  select 1
  from public.attendance a
  where a.class_id = c.class_id
)
order by c.class_date asc;

create or replace view public.dashboard_stats as
with participant_ages as (
  select
    p.participant_id,
    extract(year from age(current_date, p.date_of_birth))::int as age_years
  from public.participants p
  where p.date_of_birth is not null
),
completed_participants as (
  select count(distinct bs.participant_id)::int as completed_count
  from public.baptism_schedule bs
  where bs.status = 'completed'
)
select
  (select count(*)::int from public.participants) as total_participants,
  (select round(avg(age_years)::numeric, 2) from participant_ages) as average_age,
  (select max(age_years) from participant_ages) as oldest_age,
  (select min(age_years) from participant_ages) as youngest_age,
  cp.completed_count as completed_participants_count
from completed_participants cp;

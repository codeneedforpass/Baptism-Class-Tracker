begin;

create or replace function public.has_user_mappings()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users u where u.auth_user_id is not null
  );
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    (select u.role from public.users u where u.auth_user_id = auth.uid() limit 1),
    ''
  );
$$;

drop policy if exists "users_auth_all" on public.users;
drop policy if exists "participants_auth_all" on public.participants;
drop policy if exists "classes_auth_all" on public.classes;
drop policy if exists "attendance_auth_all" on public.attendance;
drop policy if exists "baptismschedule_auth_all" on public.baptism_schedule;
drop policy if exists "requirements_auth_all" on public.requirements;

create policy users_select_policy on public.users
for select to authenticated
using (
  (not public.has_user_mappings()) or
  auth.uid() = auth_user_id or
  public.current_app_role() = 'admin'
);

create policy users_update_policy on public.users
for update to authenticated
using (
  (not public.has_user_mappings()) or
  auth.uid() = auth_user_id or
  public.current_app_role() = 'admin'
)
with check (
  (not public.has_user_mappings()) or
  auth.uid() = auth_user_id or
  public.current_app_role() = 'admin'
);

create policy participants_select_policy on public.participants
for select to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher', 'assistant')
);

create policy participants_write_policy on public.participants
for all to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
)
with check (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
);

create policy classes_select_policy on public.classes
for select to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher', 'assistant')
);

create policy classes_write_policy on public.classes
for all to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
)
with check (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
);

create policy attendance_select_policy on public.attendance
for select to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher', 'assistant')
);

create policy attendance_write_policy on public.attendance
for all to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher', 'assistant')
)
with check (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher', 'assistant')
);

create policy baptism_schedule_select_policy on public.baptism_schedule
for select to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher', 'assistant')
);

create policy baptism_schedule_write_policy on public.baptism_schedule
for all to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
)
with check (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
);

create policy requirements_select_policy on public.requirements
for select to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher', 'assistant')
);

create policy requirements_write_policy on public.requirements
for all to authenticated
using (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
)
with check (
  (not public.has_user_mappings()) or
  public.current_app_role() in ('admin', 'teacher')
);

commit;

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  lane text not null,
  label text not null,
  start_date date not null,
  duration_days integer not null default 1 check (duration_days >= 1),
  assignee text,
  color text not null default 'blue',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_tasks_project_id_idx on public.project_tasks (project_id, sort_order);

alter table public.project_tasks enable row level security;

create policy "anyone can read project_tasks"
  on public.project_tasks for select
  using (true);

create policy "anyone can insert project_tasks"
  on public.project_tasks for insert
  with check (true);

create policy "anyone can update project_tasks"
  on public.project_tasks for update
  using (true) with check (true);

create policy "anyone can delete project_tasks"
  on public.project_tasks for delete
  using (true);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger project_tasks_set_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();
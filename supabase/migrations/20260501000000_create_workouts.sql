create table if not exists public.workouts (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	name text,
	date date not null,
	bodyweight numeric,
	notes text,
	exercises jsonb not null default '[]'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists workouts_user_date_idx
	on public.workouts (user_id, date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
	before update on public.workouts
	for each row
	execute function public.set_updated_at();

alter table public.workouts enable row level security;

drop policy if exists "Users can select their own workouts" on public.workouts;
create policy "Users can select their own workouts"
	on public.workouts
	for select
	using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workouts" on public.workouts;
create policy "Users can insert their own workouts"
	on public.workouts
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workouts" on public.workouts;
create policy "Users can update their own workouts"
	on public.workouts
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own workouts" on public.workouts;
create policy "Users can delete their own workouts"
	on public.workouts
	for delete
	using (auth.uid() = user_id);

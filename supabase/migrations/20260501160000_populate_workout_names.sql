-- Add the name column to existing workouts table
alter table public.workouts
add column if not exists name text;

-- Populate missing workout names based on their date
update public.workouts
set name = 'Workout — ' || to_char(date, 'FMMonth DD, YYYY')
where name is null;

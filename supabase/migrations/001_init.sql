-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null unique,
  name            text,
  age             int,
  gender          text check (gender in ('male','female')),
  weight_kg       numeric(5,2),
  height_cm       numeric(5,1),
  goal            text default 'fat_loss',
  activity_level  numeric(4,2) default 1.65,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can manage own profile"
  on public.profiles for all using (auth.uid() = user_id);

-- ── EXERCISES (public reference data) ────────────────────────────────────────
create table public.exercises (
  id                  text primary key,
  name                text not null,
  primary_muscle      text not null,
  secondary_muscles   text[] default '{}',
  equipment           text,
  category            text check (category in ('compound','isolation','cardio')),
  instructions        text,
  tips                text
);

alter table public.exercises enable row level security;
create policy "Anyone can read exercises"
  on public.exercises for select using (true);

-- ── PROGRAMS ─────────────────────────────────────────────────────────────────
create table public.programs (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  days_per_week int,
  level         text
);

alter table public.programs enable row level security;
create policy "Anyone can read programs"
  on public.programs for select using (true);

create table public.program_days (
  id           uuid primary key default uuid_generate_v4(),
  program_id   uuid references public.programs(id) on delete cascade,
  day_number   int not null,
  day_label    text,
  focus_label  text
);

alter table public.program_days enable row level security;
create policy "Anyone can read program_days"
  on public.program_days for select using (true);

create table public.program_exercises (
  id              uuid primary key default uuid_generate_v4(),
  program_day_id  uuid references public.program_days(id) on delete cascade,
  exercise_id     text references public.exercises(id),
  sets            int default 3,
  target_reps_min int default 8,
  target_reps_max int default 12,
  rest_seconds    int default 120,
  sort_order      int default 0
);

alter table public.program_exercises enable row level security;
create policy "Anyone can read program_exercises"
  on public.program_exercises for select using (true);

-- ── WORKOUT SESSIONS ─────────────────────────────────────────────────────────
create table public.workout_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  program_day_id  uuid references public.program_days(id),
  date            date not null,
  started_at      timestamptz,
  ended_at        timestamptz,
  notes           text,
  completed       boolean default false,
  created_at      timestamptz default now()
);

alter table public.workout_sessions enable row level security;
create policy "Users can manage own workout_sessions"
  on public.workout_sessions for all using (auth.uid() = user_id);

create index idx_workout_sessions_user_date on public.workout_sessions(user_id, date);

-- ── EXERCISE LOGS ─────────────────────────────────────────────────────────────
create table public.exercise_logs (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid references public.workout_sessions(id) on delete cascade not null,
  exercise_id     text references public.exercises(id),
  set_number      int not null,
  weight_kg       numeric(6,2) default 0,
  reps_completed  int default 0,
  rpe             int check (rpe between 1 and 10),
  skipped         boolean default false,
  created_at      timestamptz default now()
);

alter table public.exercise_logs enable row level security;
create policy "Users can manage own exercise_logs"
  on public.exercise_logs for all
  using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_id and ws.user_id = auth.uid()
    )
  );

create index idx_exercise_logs_session on public.exercise_logs(session_id);
create index idx_exercise_logs_exercise on public.exercise_logs(exercise_id);

-- ── CARDIO SESSIONS ───────────────────────────────────────────────────────────
create table public.cardio_sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  type          text check (type in ('zone2','hiit','other')),
  duration_min  int not null,
  distance_km   numeric(6,2),
  avg_hr        int,
  calories      int,
  date          date not null default current_date,
  notes         text,
  created_at    timestamptz default now()
);

alter table public.cardio_sessions enable row level security;
create policy "Users can manage own cardio_sessions"
  on public.cardio_sessions for all using (auth.uid() = user_id);

-- ── BODY METRICS ─────────────────────────────────────────────────────────────
create table public.body_metrics (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  date          date not null default current_date,
  weight_kg     numeric(5,2),
  body_fat_pct  numeric(4,1),
  measurements  jsonb,
  created_at    timestamptz default now(),
  unique(user_id, date)
);

alter table public.body_metrics enable row level security;
create policy "Users can manage own body_metrics"
  on public.body_metrics for all using (auth.uid() = user_id);

-- ── NUTRITION TARGETS ─────────────────────────────────────────────────────────
create table public.nutrition_targets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  calories    int not null default 2400,
  protein_g   int not null default 180,
  carbs_g     int not null default 195,
  fat_g       int not null default 65,
  updated_at  timestamptz default now()
);

alter table public.nutrition_targets enable row level security;
create policy "Users can manage own nutrition_targets"
  on public.nutrition_targets for all using (auth.uid() = user_id);

-- ── NUTRITION LOGS ────────────────────────────────────────────────────────────
create table public.nutrition_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null default current_date,
  meal_type   text check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name   text not null,
  quantity_g  numeric(7,1),
  calories    int,
  protein_g   numeric(6,1),
  carbs_g     numeric(6,1),
  fat_g       numeric(6,1),
  source      text default 'manual',
  created_at  timestamptz default now()
);

alter table public.nutrition_logs enable row level security;
create policy "Users can manage own nutrition_logs"
  on public.nutrition_logs for all using (auth.uid() = user_id);

create index idx_nutrition_logs_user_date on public.nutrition_logs(user_id, date);

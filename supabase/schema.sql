-- Run this once in Supabase Dashboard > SQL Editor.
-- Row-level security ensures each player can only access their own account data.

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text not null unique check (username ~ '^[A-Za-z0-9_]{3,24}$'),
    created_at timestamptz not null default now()
);

create table if not exists public.high_scores (
    user_id uuid not null references auth.users(id) on delete cascade,
    game_name text not null,
    score bigint not null check (score >= 0),
    updated_at timestamptz not null default now(),
    primary key (user_id, game_name)
);

alter table public.profiles enable row level security;
alter table public.high_scores enable row level security;

drop policy if exists "Players read own profile" on public.profiles;
create policy "Players read own profile" on public.profiles
    for select to authenticated using (auth.uid() = id);

drop policy if exists "Players create own profile" on public.profiles;
create policy "Players create own profile" on public.profiles
    for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Players update own profile" on public.profiles;
create policy "Players update own profile" on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Players read own scores" on public.high_scores;
create policy "Players read own scores" on public.high_scores
    for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Players add own scores" on public.high_scores;
create policy "Players add own scores" on public.high_scores
    for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Players update own scores" on public.high_scores;
create policy "Players update own scores" on public.high_scores
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

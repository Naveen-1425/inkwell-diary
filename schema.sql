-- ============================================================
-- Personal Diary & Life Journal — Supabase Schema (V1)
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- 1. PROFILES ---------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- auto-create a profile row whenever a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. DIARY ENTRIES ------------------------------------------------
create table public.diary_entries (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  content text,
  category text default 'Personal',
  mood text,
  favorite boolean default false,
  archived boolean default false,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.diary_entries enable row level security;

create policy "Users can view own entries"
  on public.diary_entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries"
  on public.diary_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries"
  on public.diary_entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries"
  on public.diary_entries for delete using (auth.uid() = user_id);

create index diary_entries_user_id_idx on public.diary_entries(user_id);
create index diary_entries_created_at_idx on public.diary_entries(created_at desc);

-- keep updated_at fresh
create function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.diary_entries
  for each row execute procedure public.handle_updated_at();

-- 3. TAGS -----------------------------------------------------------
create table public.tags (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null
);

alter table public.tags enable row level security;
create policy "Users can manage own tags"
  on public.tags for all using (auth.uid() = user_id);

create table public.entry_tags (
  entry_id bigint references public.diary_entries(id) on delete cascade,
  tag_id bigint references public.tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

alter table public.entry_tags enable row level security;
create policy "Users can manage own entry_tags"
  on public.entry_tags for all using (
    exists (select 1 from public.diary_entries d where d.id = entry_id and d.user_id = auth.uid())
  );

-- 4. STORAGE ----------------------------------------------------------
-- Run once: creates a bucket for entry images & avatars
insert into storage.buckets (id, name, public)
values ('diary-images', 'diary-images', true)
on conflict (id) do nothing;

create policy "Users can upload own images"
  on storage.objects for insert
  with check (bucket_id = 'diary-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own images"
  on storage.objects for select
  using (bucket_id = 'diary-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'diary-images');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'diary-images' and auth.uid()::text = (storage.foldername(name))[1]);

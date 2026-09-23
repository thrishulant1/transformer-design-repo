-- Shared design library for GitLab / GitHub Pages hosting.
-- Run once in Supabase → SQL editor, then put the project URL and anon key into SHARED_LIBRARY in index.html.
create table if not exists public.transformer_designs (
  name        text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.transformer_designs enable row level security;
-- Anyone with the page link and the anon key can read and write designs.
-- Tighten these policies (for example with Supabase Auth) before sharing the link outside your team.
create policy "read designs"   on public.transformer_designs for select using (true);
create policy "insert designs" on public.transformer_designs for insert with check (true);
create policy "update designs" on public.transformer_designs for update using (true) with check (true);
create policy "delete designs" on public.transformer_designs for delete using (true);

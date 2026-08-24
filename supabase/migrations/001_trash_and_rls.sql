-- 휴지통(소프트 삭제) + RLS
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.

-- 1) 휴지통 컬럼 -------------------------------------------------------------
-- deleted_at 이 NULL 이면 살아있는 프로젝트, 값이 있으면 휴지통에 있는 것.
alter table public.mindmaps
  add column if not exists deleted_at timestamptz;

-- 대시보드는 항상 "내 것 중 안 지워진 것"을 조회하므로 그 조합으로 인덱스를 건다.
create index if not exists mindmaps_user_deleted_idx
  on public.mindmaps (user_id, deleted_at);

-- 2) RLS ---------------------------------------------------------------------
-- anon key 는 공개 번들에 박혀 배포되므로, RLS 가 없으면 누구나 남의 행을
-- 읽고 지울 수 있다. 아래 정책은 "본인 행만" 으로 제한한다.
alter table public.mindmaps enable row level security;

drop policy if exists "mindmaps_select_own" on public.mindmaps;
create policy "mindmaps_select_own" on public.mindmaps
  for select using (auth.uid() = user_id);

drop policy if exists "mindmaps_insert_own" on public.mindmaps;
create policy "mindmaps_insert_own" on public.mindmaps
  for insert with check (auth.uid() = user_id);

drop policy if exists "mindmaps_update_own" on public.mindmaps;
create policy "mindmaps_update_own" on public.mindmaps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mindmaps_delete_own" on public.mindmaps;
create policy "mindmaps_delete_own" on public.mindmaps
  for delete using (auth.uid() = user_id);

-- folders 도 같은 방식으로 잠근다. user_id 컬럼이 있을 때만 적용.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'folders' and column_name = 'user_id'
  ) then
    execute 'alter table public.folders enable row level security';
    execute 'drop policy if exists "folders_all_own" on public.folders';
    execute 'create policy "folders_all_own" on public.folders
               for all using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

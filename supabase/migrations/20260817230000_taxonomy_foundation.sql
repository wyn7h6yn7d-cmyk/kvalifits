-- Structured taxonomy foundation for jobs and profiles.
-- Additive only: existing free-text columns are never rewritten or deleted.
-- Catalog tables are the source of stable IDs; aliases collapse duplicate spellings.

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists public.taxonomy_industries (
  id text primary key,
  label_et text not null,
  label_en text not null,
  label_ru text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.taxonomy_professions (
  id text primary key,
  industry_id text not null references public.taxonomy_industries (id) on update cascade,
  label_et text not null,
  label_en text not null,
  label_ru text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists taxonomy_professions_industry_idx
  on public.taxonomy_professions (industry_id)
  where is_active;

create table if not exists public.taxonomy_skills (
  id text primary key,
  label_et text not null,
  label_en text not null,
  label_ru text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.taxonomy_profession_skills (
  profession_id text not null references public.taxonomy_professions (id) on delete cascade on update cascade,
  skill_id text not null references public.taxonomy_skills (id) on delete cascade on update cascade,
  primary key (profession_id, skill_id)
);

create table if not exists public.taxonomy_certificates (
  id text primary key,
  label_et text not null,
  label_en text not null,
  label_ru text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.taxonomy_languages (
  id text primary key,
  label_et text not null,
  label_en text not null,
  label_ru text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.taxonomy_aliases (
  kind text not null
    check (kind in ('industry', 'profession', 'skill', 'certificate', 'language')),
  term_id text not null,
  alias text not null,
  alias_norm text not null,
  primary key (kind, alias_norm)
);

create index if not exists taxonomy_aliases_term_idx
  on public.taxonomy_aliases (kind, term_id);

comment on table public.taxonomy_industries is
  'Canonical industry / domain values. Filter facet `domain` resolves here.';
comment on table public.taxonomy_professions is
  'Canonical professions. Job title stays free text; this ID is used for matching.';
comment on table public.taxonomy_skills is
  'Canonical skill tags for job required_skills and seeker skills.';
comment on table public.taxonomy_certificates is
  'Canonical certificate / competency types. Seeker certificate_name stays free text.';
comment on table public.taxonomy_languages is
  'Normalized language identifiers (ISO 639-1).';
comment on table public.taxonomy_aliases is
  'Synonyms and spelling variants mapping to canonical taxonomy IDs. Unique per kind+normalized alias.';

create or replace function public.taxonomy_aliases_set_norm()
returns trigger
language plpgsql
as $$
begin
  new.alias := trim(new.alias);
  new.alias_norm := public.job_search_norm(new.alias);
  if new.alias_norm is null or new.alias_norm = '' then
    raise exception 'taxonomy alias cannot be empty';
  end if;
  return new;
end;
$$;

drop trigger if exists taxonomy_aliases_set_norm on public.taxonomy_aliases;
create trigger taxonomy_aliases_set_norm
  before insert or update on public.taxonomy_aliases
  for each row
  execute function public.taxonomy_aliases_set_norm();

create or replace function public.taxonomy_aliases_validate_term()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'industry' and not exists (
    select 1 from public.taxonomy_industries t where t.id = new.term_id
  ) then
    raise exception 'taxonomy alias industry term_id % does not exist', new.term_id;
  elsif new.kind = 'profession' and not exists (
    select 1 from public.taxonomy_professions t where t.id = new.term_id
  ) then
    raise exception 'taxonomy alias profession term_id % does not exist', new.term_id;
  elsif new.kind = 'skill' and not exists (
    select 1 from public.taxonomy_skills t where t.id = new.term_id
  ) then
    raise exception 'taxonomy alias skill term_id % does not exist', new.term_id;
  elsif new.kind = 'certificate' and not exists (
    select 1 from public.taxonomy_certificates t where t.id = new.term_id
  ) then
    raise exception 'taxonomy alias certificate term_id % does not exist', new.term_id;
  elsif new.kind = 'language' and not exists (
    select 1 from public.taxonomy_languages t where t.id = new.term_id
  ) then
    raise exception 'taxonomy alias language term_id % does not exist', new.term_id;
  end if;
  return new;
end;
$$;

drop trigger if exists taxonomy_aliases_validate_term on public.taxonomy_aliases;
create trigger taxonomy_aliases_validate_term
  before insert or update on public.taxonomy_aliases
  for each row
  execute function public.taxonomy_aliases_validate_term();

-- ---------------------------------------------------------------------------
-- RLS: public read, admin write
-- ---------------------------------------------------------------------------

alter table public.taxonomy_industries enable row level security;
alter table public.taxonomy_professions enable row level security;
alter table public.taxonomy_skills enable row level security;
alter table public.taxonomy_profession_skills enable row level security;
alter table public.taxonomy_certificates enable row level security;
alter table public.taxonomy_languages enable row level security;
alter table public.taxonomy_aliases enable row level security;

grant select on public.taxonomy_industries to anon, authenticated;
grant select on public.taxonomy_professions to anon, authenticated;
grant select on public.taxonomy_skills to anon, authenticated;
grant select on public.taxonomy_profession_skills to anon, authenticated;
grant select on public.taxonomy_certificates to anon, authenticated;
grant select on public.taxonomy_languages to anon, authenticated;
grant select on public.taxonomy_aliases to anon, authenticated;

grant insert, update, delete on public.taxonomy_industries to authenticated;
grant insert, update, delete on public.taxonomy_professions to authenticated;
grant insert, update, delete on public.taxonomy_skills to authenticated;
grant insert, update, delete on public.taxonomy_profession_skills to authenticated;
grant insert, update, delete on public.taxonomy_certificates to authenticated;
grant insert, update, delete on public.taxonomy_languages to authenticated;
grant insert, update, delete on public.taxonomy_aliases to authenticated;

drop policy if exists taxonomy_industries_select on public.taxonomy_industries;
create policy taxonomy_industries_select on public.taxonomy_industries
  for select to anon, authenticated using (true);

drop policy if exists taxonomy_industries_admin_write on public.taxonomy_industries;
create policy taxonomy_industries_admin_write on public.taxonomy_industries
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists taxonomy_professions_select on public.taxonomy_professions;
create policy taxonomy_professions_select on public.taxonomy_professions
  for select to anon, authenticated using (true);

drop policy if exists taxonomy_professions_admin_write on public.taxonomy_professions;
create policy taxonomy_professions_admin_write on public.taxonomy_professions
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists taxonomy_skills_select on public.taxonomy_skills;
create policy taxonomy_skills_select on public.taxonomy_skills
  for select to anon, authenticated using (true);

drop policy if exists taxonomy_skills_admin_write on public.taxonomy_skills;
create policy taxonomy_skills_admin_write on public.taxonomy_skills
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists taxonomy_profession_skills_select on public.taxonomy_profession_skills;
create policy taxonomy_profession_skills_select on public.taxonomy_profession_skills
  for select to anon, authenticated using (true);

drop policy if exists taxonomy_profession_skills_admin_write on public.taxonomy_profession_skills;
create policy taxonomy_profession_skills_admin_write on public.taxonomy_profession_skills
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists taxonomy_certificates_select on public.taxonomy_certificates;
create policy taxonomy_certificates_select on public.taxonomy_certificates
  for select to anon, authenticated using (true);

drop policy if exists taxonomy_certificates_admin_write on public.taxonomy_certificates;
create policy taxonomy_certificates_admin_write on public.taxonomy_certificates
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists taxonomy_languages_select on public.taxonomy_languages;
create policy taxonomy_languages_select on public.taxonomy_languages
  for select to anon, authenticated using (true);

drop policy if exists taxonomy_languages_admin_write on public.taxonomy_languages;
create policy taxonomy_languages_admin_write on public.taxonomy_languages
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists taxonomy_aliases_select on public.taxonomy_aliases;
create policy taxonomy_aliases_select on public.taxonomy_aliases
  for select to anon, authenticated using (true);

drop policy if exists taxonomy_aliases_admin_write on public.taxonomy_aliases;
create policy taxonomy_aliases_admin_write on public.taxonomy_aliases
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- Resolve helpers (used by search + controlled backfill)
-- ---------------------------------------------------------------------------

create or replace function public.taxonomy_map_one(p_kind text, p_raw text)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select a.term_id
  from public.taxonomy_aliases a
  where a.kind = p_kind
    and a.alias_norm = public.job_search_norm(p_raw)
  limit 1;
$$;

create or replace function public.taxonomy_map_array(p_kind text, p_values text[])
returns text[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(array_agg(distinct public.taxonomy_map_one(p_kind, v) order by public.taxonomy_map_one(p_kind, v)), '{}'::text[])
  from unnest(coalesce(p_values, '{}'::text[])) v
  where nullif(trim(v), '') is not null
    and public.taxonomy_map_one(p_kind, v) is not null;
$$;

create or replace function public.taxonomy_map_csv(p_kind text, p_raw text)
returns text[]
language sql
stable
security invoker
set search_path = public
as $$
  select public.taxonomy_map_array(
    p_kind,
    coalesce(
      array(
        select trim(part)
        from regexp_split_to_table(coalesce(p_raw, ''), '[,;\n]+') part
        where nullif(trim(part), '') is not null
      ),
      '{}'::text[]
    )
  );
$$;

create or replace function public.taxonomy_resolve_ids(p_kind text, p_values text[])
returns text[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(array_agg(distinct x.id), '{}'::text[])
  from (
    select trim(v) as id
    from unnest(coalesce(p_values, '{}'::text[])) v
    where nullif(trim(v), '') is not null
      and (
        (p_kind = 'industry' and exists (select 1 from public.taxonomy_industries t where t.id = trim(v)))
        or (p_kind = 'profession' and exists (select 1 from public.taxonomy_professions t where t.id = trim(v)))
        or (p_kind = 'skill' and exists (select 1 from public.taxonomy_skills t where t.id = trim(v)))
        or (p_kind = 'certificate' and exists (select 1 from public.taxonomy_certificates t where t.id = trim(v)))
        or (p_kind = 'language' and exists (select 1 from public.taxonomy_languages t where t.id = trim(v)))
      )
    union
    select public.taxonomy_map_one(p_kind, v) as id
    from unnest(coalesce(p_values, '{}'::text[])) v
    where public.taxonomy_map_one(p_kind, v) is not null
  ) x
  where x.id is not null;
$$;

revoke all on function public.taxonomy_map_one(text, text) from public;
revoke all on function public.taxonomy_map_array(text, text[]) from public;
revoke all on function public.taxonomy_map_csv(text, text) from public;
revoke all on function public.taxonomy_resolve_ids(text, text[]) from public;
grant execute on function public.taxonomy_map_one(text, text) to anon, authenticated;
grant execute on function public.taxonomy_map_array(text, text[]) to anon, authenticated;
grant execute on function public.taxonomy_map_csv(text, text) to anon, authenticated;
grant execute on function public.taxonomy_resolve_ids(text, text[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Additive columns on existing tables (free-text columns stay)
-- ---------------------------------------------------------------------------

alter table public.job_posts
  add column if not exists industry_id text references public.taxonomy_industries (id) on update cascade,
  add column if not exists profession_id text references public.taxonomy_professions (id) on update cascade,
  add column if not exists skill_ids text[] not null default '{}'::text[],
  add column if not exists certificate_ids text[] not null default '{}'::text[],
  add column if not exists language_ids text[] not null default '{}'::text[];

comment on column public.job_posts.industry_id is
  'Canonical industry ID. employer_profiles.industry text is preserved.';
comment on column public.job_posts.profession_id is
  'Canonical profession ID. job_posts.title remains the free-text listing title.';
comment on column public.job_posts.skill_ids is
  'Canonical skill IDs. required_skills text[] is preserved for display and fallback matching.';
comment on column public.job_posts.certificate_ids is
  'Canonical certificate IDs. certificate_requirements text is preserved.';
comment on column public.job_posts.language_ids is
  'Canonical language IDs (ISO 639-1). languages text[] is preserved.';

alter table public.employer_profiles
  add column if not exists industry_id text references public.taxonomy_industries (id) on update cascade;

comment on column public.employer_profiles.industry_id is
  'Canonical industry ID. industry text is preserved.';

alter table public.seeker_profiles
  add column if not exists profession_id text references public.taxonomy_professions (id) on update cascade,
  add column if not exists skill_ids text[] not null default '{}'::text[],
  add column if not exists language_ids text[] not null default '{}'::text[];

comment on column public.seeker_profiles.profession_id is
  'Canonical profession ID. profile_title remains free text.';
comment on column public.seeker_profiles.skill_ids is
  'Canonical skill IDs. skills text[] is preserved.';
comment on column public.seeker_profiles.language_ids is
  'Canonical language IDs. languages text[] is preserved.';

alter table public.seeker_certificates
  add column if not exists certificate_id text references public.taxonomy_certificates (id) on update cascade;

comment on column public.seeker_certificates.certificate_id is
  'Canonical certificate type. certificate_name / issuer remain free text.';

create index if not exists job_posts_industry_id_idx
  on public.job_posts (industry_id)
  where industry_id is not null;
create index if not exists job_posts_profession_id_idx
  on public.job_posts (profession_id)
  where profession_id is not null;
create index if not exists job_posts_skill_ids_gin
  on public.job_posts using gin (skill_ids);
create index if not exists job_posts_certificate_ids_gin
  on public.job_posts using gin (certificate_ids);
create index if not exists job_posts_language_ids_gin
  on public.job_posts using gin (language_ids);

create index if not exists employer_profiles_industry_id_idx
  on public.employer_profiles (industry_id)
  where industry_id is not null;
create index if not exists seeker_profiles_profession_id_idx
  on public.seeker_profiles (profession_id)
  where profession_id is not null;
create index if not exists seeker_profiles_skill_ids_gin
  on public.seeker_profiles using gin (skill_ids);
create index if not exists seeker_profiles_language_ids_gin
  on public.seeker_profiles using gin (language_ids);

create or replace function public.taxonomy_validate_id_arrays()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'job_posts' then
    if exists (
      select 1 from unnest(coalesce(new.skill_ids, '{}'::text[])) sid
      where not exists (select 1 from public.taxonomy_skills s where s.id = sid)
    ) then
      raise exception 'job_posts.skill_ids contains an unknown skill id';
    end if;
    if exists (
      select 1 from unnest(coalesce(new.certificate_ids, '{}'::text[])) cid
      where not exists (select 1 from public.taxonomy_certificates c where c.id = cid)
    ) then
      raise exception 'job_posts.certificate_ids contains an unknown certificate id';
    end if;
    if exists (
      select 1 from unnest(coalesce(new.language_ids, '{}'::text[])) lid
      where not exists (select 1 from public.taxonomy_languages l where l.id = lid)
    ) then
      raise exception 'job_posts.language_ids contains an unknown language id';
    end if;
  elsif tg_table_name = 'seeker_profiles' then
    if exists (
      select 1 from unnest(coalesce(new.skill_ids, '{}'::text[])) sid
      where not exists (select 1 from public.taxonomy_skills s where s.id = sid)
    ) then
      raise exception 'seeker_profiles.skill_ids contains an unknown skill id';
    end if;
    if exists (
      select 1 from unnest(coalesce(new.language_ids, '{}'::text[])) lid
      where not exists (select 1 from public.taxonomy_languages l where l.id = lid)
    ) then
      raise exception 'seeker_profiles.language_ids contains an unknown language id';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists job_posts_taxonomy_ids on public.job_posts;
create trigger job_posts_taxonomy_ids
  before insert or update of skill_ids, certificate_ids, language_ids
  on public.job_posts
  for each row
  execute function public.taxonomy_validate_id_arrays();

drop trigger if exists seeker_profiles_taxonomy_ids on public.seeker_profiles;
create trigger seeker_profiles_taxonomy_ids
  before insert or update of skill_ids, language_ids
  on public.seeker_profiles
  for each row
  execute function public.taxonomy_validate_id_arrays();

-- ---------------------------------------------------------------------------
-- Seed (current product domain only — not a full ontology)
-- ---------------------------------------------------------------------------

insert into public.taxonomy_industries (id, label_et, label_en, label_ru, sort_order) values
  ('electricity-energy', 'Elekter ja energeetika', 'Electricity and energy', 'Электричество и энергетика', 10),
  ('construction', 'Ehitus', 'Construction', 'Строительство', 20),
  ('metalwork', 'Metallitööd', 'Metalwork', 'Металлообработка', 30),
  ('logistics', 'Logistika ja ladu', 'Logistics and warehousing', 'Логистика и склад', 40),
  ('transport', 'Transport', 'Transport', 'Транспорт', 50)
on conflict (id) do update set
  label_et = excluded.label_et,
  label_en = excluded.label_en,
  label_ru = excluded.label_ru,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.taxonomy_professions (id, industry_id, label_et, label_en, label_ru, sort_order) values
  ('electrician', 'electricity-energy', 'Elektrik', 'Electrician', 'Электрик', 10),
  ('sheet-metal-worker', 'metalwork', 'Plekksepp', 'Sheet metal worker', 'Жестянщик', 20),
  ('warehouse-worker', 'logistics', 'Laotöötaja', 'Warehouse worker', 'Кладовщик', 30),
  ('driver', 'transport', 'Juht', 'Driver', 'Водитель', 40),
  ('installer', 'construction', 'Paigaldaja', 'Installer', 'Монтажник', 50),
  ('construction-worker', 'construction', 'Ehitaja', 'Construction worker', 'Строитель', 60)
on conflict (id) do update set
  industry_id = excluded.industry_id,
  label_et = excluded.label_et,
  label_en = excluded.label_en,
  label_ru = excluded.label_ru,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.taxonomy_skills (id, label_et, label_en, label_ru, sort_order) values
  ('electrical-installation', 'Elektripaigaldus', 'Electrical installation', 'Электромонтаж', 10),
  ('troubleshooting', 'Rikkeotsing', 'Troubleshooting', 'Поиск неисправностей', 20),
  ('plc', 'PLC', 'PLC', 'ПЛК', 30),
  ('cad', 'CAD', 'CAD', 'CAD', 40),
  ('ventilation', 'Ventilatsioon', 'Ventilation', 'Вентиляция', 50),
  ('assembly', 'Montaaž', 'Assembly', 'Сборка', 60)
on conflict (id) do update set
  label_et = excluded.label_et,
  label_en = excluded.label_en,
  label_ru = excluded.label_ru,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.taxonomy_profession_skills (profession_id, skill_id) values
  ('electrician', 'electrical-installation'),
  ('electrician', 'troubleshooting'),
  ('electrician', 'plc'),
  ('sheet-metal-worker', 'ventilation'),
  ('sheet-metal-worker', 'assembly'),
  ('installer', 'assembly'),
  ('installer', 'electrical-installation'),
  ('construction-worker', 'assembly'),
  ('warehouse-worker', 'assembly')
on conflict do nothing;

insert into public.taxonomy_certificates (id, label_et, label_en, label_ru, sort_order) values
  ('a-competency', 'A-pädevus', 'Category A electrical competence', 'Компетенция A', 10),
  ('b-competency', 'B-pädevus', 'Category B electrical competence', 'Компетенция B', 20),
  ('vocational-certificate', 'Kutsetunnistus', 'Vocational certificate', 'Профессиональный сертификат', 30),
  ('occupational-safety', 'Tööohutus', 'Occupational safety', 'Охрана труда', 40),
  ('category-b-license', 'B-kategooria juhiluba', 'Category B driving licence', 'Водительские права категории B', 50)
on conflict (id) do update set
  label_et = excluded.label_et,
  label_en = excluded.label_en,
  label_ru = excluded.label_ru,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.taxonomy_languages (id, label_et, label_en, label_ru, sort_order) values
  ('et', 'Eesti', 'Estonian', 'Эстонский', 10),
  ('en', 'Inglise', 'English', 'Английский', 20),
  ('ru', 'Vene', 'Russian', 'Русский', 30),
  ('fi', 'Soome', 'Finnish', 'Финский', 40),
  ('de', 'Saksa', 'German', 'Немецкий', 50),
  ('fr', 'Prantsuse', 'French', 'Французский', 60),
  ('es', 'Hispaania', 'Spanish', 'Испанский', 70),
  ('sv', 'Rootsi', 'Swedish', 'Шведский', 80),
  ('lv', 'Läti', 'Latvian', 'Латышский', 90),
  ('lt', 'Leedu', 'Lithuanian', 'Литовский', 100)
on conflict (id) do update set
  label_et = excluded.label_et,
  label_en = excluded.label_en,
  label_ru = excluded.label_ru,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.taxonomy_aliases (kind, term_id, alias)
select k.kind, k.term_id, k.alias
from (
  values
    -- industries
    ('industry', 'electricity-energy', 'electricity-energy'),
    ('industry', 'electricity-energy', 'Elekter ja energeetika'),
    ('industry', 'electricity-energy', 'Electricity and energy'),
    ('industry', 'electricity-energy', 'Электричество и энергетика'),
    ('industry', 'electricity-energy', 'elekter'),
    ('industry', 'electricity-energy', 'energeetika'),
    ('industry', 'electricity-energy', 'elektritööd'),
    ('industry', 'electricity-energy', 'elektri tööd'),
    ('industry', 'electricity-energy', 'elektritoo'),
    ('industry', 'electricity-energy', 'elektritood'),
    ('industry', 'electricity-energy', 'elektrialane'),
    ('industry', 'construction', 'construction'),
    ('industry', 'construction', 'Ehitus'),
    ('industry', 'construction', 'Construction'),
    ('industry', 'construction', 'Строительство'),
    ('industry', 'construction', 'ehitustoo'),
    ('industry', 'construction', 'ehitustood'),
    ('industry', 'metalwork', 'metalwork'),
    ('industry', 'metalwork', 'Metallitööd'),
    ('industry', 'metalwork', 'Metalwork'),
    ('industry', 'metalwork', 'Металлообработка'),
    ('industry', 'metalwork', 'metallitood'),
    ('industry', 'metalwork', 'metallitoo'),
    ('industry', 'metalwork', 'metallitöö'),
    ('industry', 'logistics', 'logistics'),
    ('industry', 'logistics', 'Logistika ja ladu'),
    ('industry', 'logistics', 'Logistics and warehousing'),
    ('industry', 'logistics', 'Логистика и склад'),
    ('industry', 'logistics', 'ladu'),
    ('industry', 'logistics', 'logistika'),
    ('industry', 'logistics', 'warehouse'),
    ('industry', 'logistics', 'склад'),
    ('industry', 'logistics', 'логистика'),
    ('industry', 'transport', 'transport'),
    ('industry', 'transport', 'Transport'),
    ('industry', 'transport', 'Транспорт'),
    ('industry', 'transport', 'vedu'),
    ('industry', 'transport', 'trucking'),
    -- professions
    ('profession', 'electrician', 'electrician'),
    ('profession', 'electrician', 'Elektrik'),
    ('profession', 'electrician', 'Electrician'),
    ('profession', 'electrician', 'Электрик'),
    ('profession', 'electrician', 'elektripaigaldaja'),
    ('profession', 'electrician', 'sparky'),
    ('profession', 'electrician', 'электромонтер'),
    ('profession', 'electrician', 'электромонтажник'),
    ('profession', 'sheet-metal-worker', 'sheet-metal-worker'),
    ('profession', 'sheet-metal-worker', 'Plekksepp'),
    ('profession', 'sheet-metal-worker', 'Sheet metal worker'),
    ('profession', 'sheet-metal-worker', 'Жестянщик'),
    ('profession', 'sheet-metal-worker', 'plekitood'),
    ('profession', 'sheet-metal-worker', 'plekitoo'),
    ('profession', 'sheet-metal-worker', 'plekidetail'),
    ('profession', 'sheet-metal-worker', 'ventilatsiooniplekk'),
    ('profession', 'sheet-metal-worker', 'metallitooline'),
    ('profession', 'sheet-metal-worker', 'metallitööline'),
    ('profession', 'sheet-metal-worker', 'tinsmith'),
    ('profession', 'sheet-metal-worker', 'sheetmetal'),
    ('profession', 'sheet-metal-worker', 'кузнец'),
    ('profession', 'warehouse-worker', 'warehouse-worker'),
    ('profession', 'warehouse-worker', 'Laotöötaja'),
    ('profession', 'warehouse-worker', 'Warehouse worker'),
    ('profession', 'warehouse-worker', 'Кладовщик'),
    ('profession', 'warehouse-worker', 'laotööline'),
    ('profession', 'warehouse-worker', 'laotoo'),
    ('profession', 'warehouse-worker', 'laotöö'),
    ('profession', 'warehouse-worker', 'komplekteerija'),
    ('profession', 'warehouse-worker', 'picker'),
    ('profession', 'warehouse-worker', 'комплектовщик'),
    ('profession', 'driver', 'driver'),
    ('profession', 'driver', 'Juht'),
    ('profession', 'driver', 'Driver'),
    ('profession', 'driver', 'Водитель'),
    ('profession', 'driver', 'autojuht'),
    ('profession', 'driver', 'veokijuht'),
    ('profession', 'driver', 'kuller'),
    ('profession', 'driver', 'courier'),
    ('profession', 'driver', 'шофер'),
    ('profession', 'driver', 'курьер'),
    ('profession', 'driver', 'дальнобойщик'),
    ('profession', 'installer', 'installer'),
    ('profession', 'installer', 'Paigaldaja'),
    ('profession', 'installer', 'Installer'),
    ('profession', 'installer', 'Монтажник'),
    ('profession', 'installer', 'monteerija'),
    ('profession', 'installer', 'koostaja'),
    ('profession', 'installer', 'fitter'),
    ('profession', 'installer', 'установщик'),
    ('profession', 'construction-worker', 'construction-worker'),
    ('profession', 'construction-worker', 'Ehitaja'),
    ('profession', 'construction-worker', 'Construction worker'),
    ('profession', 'construction-worker', 'Строитель'),
    ('profession', 'construction-worker', 'builder'),
    ('profession', 'construction-worker', 'прораб'),
    -- skills
    ('skill', 'electrical-installation', 'electrical-installation'),
    ('skill', 'electrical-installation', 'Elektripaigaldus'),
    ('skill', 'electrical-installation', 'Electrical installation'),
    ('skill', 'electrical-installation', 'Электромонтаж'),
    ('skill', 'electrical-installation', 'elektrialane paigaldus'),
    ('skill', 'troubleshooting', 'troubleshooting'),
    ('skill', 'troubleshooting', 'Rikkeotsing'),
    ('skill', 'troubleshooting', 'Troubleshooting'),
    ('skill', 'troubleshooting', 'Поиск неисправностей'),
    ('skill', 'troubleshooting', 'rikeotsing'),
    ('skill', 'plc', 'plc'),
    ('skill', 'plc', 'PLC'),
    ('skill', 'plc', 'ПЛК'),
    ('skill', 'cad', 'cad'),
    ('skill', 'cad', 'CAD'),
    ('skill', 'cad', 'autocad'),
    ('skill', 'cad', 'auto-cad'),
    ('skill', 'cad', 'joonestamine'),
    ('skill', 'cad', 'joonestaja'),
    ('skill', 'cad', 'joonised'),
    ('skill', 'cad', 'drafting'),
    ('skill', 'cad', 'чертежник'),
    ('skill', 'cad', 'автокад'),
    ('skill', 'ventilation', 'ventilation'),
    ('skill', 'ventilation', 'Ventilatsioon'),
    ('skill', 'ventilation', 'Ventilation'),
    ('skill', 'ventilation', 'Вентиляция'),
    ('skill', 'ventilation', 'ventilatsiooni'),
    ('skill', 'ventilation', 'hvac'),
    ('skill', 'ventilation', 'kliima'),
    ('skill', 'ventilation', 'kliimaseade'),
    ('skill', 'ventilation', 'kliimaseadmed'),
    ('skill', 'ventilation', 'климат'),
    ('skill', 'assembly', 'assembly'),
    ('skill', 'assembly', 'Montaaž'),
    ('skill', 'assembly', 'Assembly'),
    ('skill', 'assembly', 'Сборка'),
    ('skill', 'assembly', 'paigaldus'),
    ('skill', 'assembly', 'montaa'),
    ('skill', 'assembly', 'install'),
    ('skill', 'assembly', 'assembler'),
    ('skill', 'assembly', 'монтаж'),
    ('skill', 'assembly', 'сборщик'),
    -- certificates
    ('certificate', 'a-competency', 'a-competency'),
    ('certificate', 'a-competency', 'A-pädevus'),
    ('certificate', 'a-competency', 'a-pädevus'),
    ('certificate', 'a-competency', 'a-padev'),
    ('certificate', 'a-competency', 'apadev'),
    ('certificate', 'a-competency', 'apädevus'),
    ('certificate', 'b-competency', 'b-competency'),
    ('certificate', 'b-competency', 'B-pädevus'),
    ('certificate', 'b-competency', 'b-pädevus'),
    ('certificate', 'b-competency', 'b-padev'),
    ('certificate', 'b-competency', 'bpadev'),
    ('certificate', 'b-competency', 'bpädevus'),
    ('certificate', 'b-competency', 'elektrialane pädevus'),
    ('certificate', 'b-competency', 'padevustunnistus'),
    ('certificate', 'vocational-certificate', 'vocational-certificate'),
    ('certificate', 'vocational-certificate', 'Kutsetunnistus'),
    ('certificate', 'vocational-certificate', 'kutse'),
    ('certificate', 'vocational-certificate', 'kutsetase'),
    ('certificate', 'vocational-certificate', 'kutse tase 4'),
    ('certificate', 'vocational-certificate', 'tase 4'),
    ('certificate', 'vocational-certificate', 'kutse4'),
    ('certificate', 'vocational-certificate', 'tase4'),
    ('certificate', 'occupational-safety', 'occupational-safety'),
    ('certificate', 'occupational-safety', 'Tööohutus'),
    ('certificate', 'occupational-safety', 'toohutus'),
    ('certificate', 'occupational-safety', 'ohutus'),
    ('certificate', 'occupational-safety', 'ohutuskoolitus'),
    ('certificate', 'category-b-license', 'category-b-license'),
    ('certificate', 'category-b-license', 'B-kategooria juhiluba'),
    ('certificate', 'category-b-license', 'b-kategooria juhiluba'),
    ('certificate', 'category-b-license', 'b kategooria juhiluba'),
    ('certificate', 'category-b-license', 'bkategooria juhiluba'),
    ('certificate', 'category-b-license', 'b-kategooria'),
    ('certificate', 'category-b-license', 'b kategooria'),
    ('certificate', 'category-b-license', 'juhiluba'),
    ('certificate', 'category-b-license', 'autojuhiluba'),
    ('certificate', 'category-b-license', 'b-kat'),
    ('certificate', 'category-b-license', 'b kat'),
    ('certificate', 'category-b-license', 'drivers license b'),
    ('certificate', 'category-b-license', 'driver license b'),
    ('certificate', 'category-b-license', 'category b license'),
    ('certificate', 'category-b-license', 'category b'),
    ('certificate', 'category-b-license', 'b licence'),
    ('certificate', 'category-b-license', 'class b license'),
    -- languages
    ('language', 'et', 'et'),
    ('language', 'et', 'Eesti'),
    ('language', 'et', 'eesti keel'),
    ('language', 'et', 'Estonian'),
    ('language', 'et', 'Эстонский'),
    ('language', 'et', 'эстон'),
    ('language', 'en', 'en'),
    ('language', 'en', 'Inglise'),
    ('language', 'en', 'inglise keel'),
    ('language', 'en', 'English'),
    ('language', 'en', 'Английский'),
    ('language', 'en', 'англий'),
    ('language', 'ru', 'ru'),
    ('language', 'ru', 'Vene'),
    ('language', 'ru', 'vene keel'),
    ('language', 'ru', 'Russian'),
    ('language', 'ru', 'Русский'),
    ('language', 'ru', 'русск'),
    ('language', 'fi', 'fi'),
    ('language', 'fi', 'Soome'),
    ('language', 'fi', 'soome keel'),
    ('language', 'fi', 'Finnish'),
    ('language', 'fi', 'Финский'),
    ('language', 'de', 'de'),
    ('language', 'de', 'Saksa'),
    ('language', 'de', 'saksa keel'),
    ('language', 'de', 'German'),
    ('language', 'de', 'Немецкий'),
    ('language', 'fr', 'fr'),
    ('language', 'fr', 'Prantsuse'),
    ('language', 'fr', 'prantsuse keel'),
    ('language', 'fr', 'French'),
    ('language', 'fr', 'Французский'),
    ('language', 'es', 'es'),
    ('language', 'es', 'Hispaania'),
    ('language', 'es', 'hispaania keel'),
    ('language', 'es', 'Spanish'),
    ('language', 'es', 'Испанский'),
    ('language', 'sv', 'sv'),
    ('language', 'sv', 'Rootsi'),
    ('language', 'sv', 'rootsi keel'),
    ('language', 'sv', 'Swedish'),
    ('language', 'sv', 'Шведский'),
    ('language', 'lv', 'lv'),
    ('language', 'lv', 'Läti'),
    ('language', 'lv', 'läti keel'),
    ('language', 'lv', 'Latvian'),
    ('language', 'lv', 'Латышский'),
    ('language', 'lt', 'lt'),
    ('language', 'lt', 'Leedu'),
    ('language', 'lt', 'leedu keel'),
    ('language', 'lt', 'Lithuanian'),
    ('language', 'lt', 'Литовский')
) as k(kind, term_id, alias)
on conflict (kind, alias_norm) do nothing;

-- ---------------------------------------------------------------------------
-- Controlled backfill: fill ID columns only. Never update/delete free-text.
-- Unmapped values stay as free text until a human picks a catalog term.
-- ---------------------------------------------------------------------------

update public.employer_profiles ep
set industry_id = public.taxonomy_map_one('industry', ep.industry)
where ep.industry_id is null
  and public.taxonomy_map_one('industry', ep.industry) is not null;

update public.job_posts jp
set skill_ids = public.taxonomy_map_array('skill', jp.required_skills)
where coalesce(array_length(jp.skill_ids, 1), 0) = 0
  and coalesce(array_length(public.taxonomy_map_array('skill', jp.required_skills), 1), 0) > 0;

update public.job_posts jp
set certificate_ids = public.taxonomy_map_csv('certificate', jp.certificate_requirements)
where coalesce(array_length(jp.certificate_ids, 1), 0) = 0
  and coalesce(array_length(public.taxonomy_map_csv('certificate', jp.certificate_requirements), 1), 0) > 0;

update public.job_posts jp
set language_ids = public.taxonomy_map_array('language', jp.languages)
where coalesce(array_length(jp.language_ids, 1), 0) = 0
  and coalesce(array_length(public.taxonomy_map_array('language', jp.languages), 1), 0) > 0;

update public.job_posts jp
set profession_id = public.taxonomy_map_one('profession', jp.title)
where jp.profession_id is null
  and public.taxonomy_map_one('profession', jp.title) is not null;

update public.job_posts jp
set industry_id = coalesce(
  public.taxonomy_map_one(
    'industry',
    (select ep.industry from public.employer_profiles ep where ep.id = jp.employer_profile_id)
  ),
  (select ep.industry_id from public.employer_profiles ep where ep.id = jp.employer_profile_id),
  (select p.industry_id from public.taxonomy_professions p where p.id = jp.profession_id)
)
where jp.industry_id is null
  and coalesce(
    public.taxonomy_map_one(
      'industry',
      (select ep.industry from public.employer_profiles ep where ep.id = jp.employer_profile_id)
    ),
    (select ep.industry_id from public.employer_profiles ep where ep.id = jp.employer_profile_id),
    (select p.industry_id from public.taxonomy_professions p where p.id = jp.profession_id)
  ) is not null;

update public.seeker_profiles sp
set skill_ids = public.taxonomy_map_array('skill', sp.skills)
where coalesce(array_length(sp.skill_ids, 1), 0) = 0
  and coalesce(array_length(public.taxonomy_map_array('skill', sp.skills), 1), 0) > 0;

update public.seeker_profiles sp
set language_ids = public.taxonomy_map_array('language', sp.languages)
where coalesce(array_length(sp.language_ids, 1), 0) = 0
  and coalesce(array_length(public.taxonomy_map_array('language', sp.languages), 1), 0) > 0;

update public.seeker_profiles sp
set profession_id = public.taxonomy_map_one('profession', sp.profile_title)
where sp.profession_id is null
  and public.taxonomy_map_one('profession', sp.profile_title) is not null;

update public.seeker_certificates sc
set certificate_id = public.taxonomy_map_one('certificate', sc.certificate_name)
where sc.certificate_id is null
  and public.taxonomy_map_one('certificate', sc.certificate_name) is not null;

-- ---------------------------------------------------------------------------
-- Search: match canonical IDs, keep free-text fallback for unmapped rows / old URLs
-- ---------------------------------------------------------------------------

create or replace function public.published_job_ids_matching(
  p_query text default null,
  p_locations text[] default null,
  p_titles text[] default null,
  p_domains text[] default null,
  p_job_types text[] default null,
  p_work_types text[] default null,
  p_salary_buckets text[] default null,
  p_experience text[] default null,
  p_skills text[] default null,
  p_certs text[] default null,
  p_languages text[] default null,
  p_has_salary boolean default false,
  p_omit_facet text default null
)
returns table (id uuid)
language sql
stable
security invoker
as $$
  with q as (
    select
      nullif(trim(p_query), '') as needle,
      public.job_search_tsquery(p_query) as tsq,
      public.job_search_norm(p_query) as needle_norm
  ),
  tax as (
    select
      public.taxonomy_resolve_ids('profession', p_titles) as title_ids,
      public.taxonomy_resolve_ids('industry', p_domains) as domain_ids,
      public.taxonomy_resolve_ids('skill', p_skills) as skill_ids,
      public.taxonomy_resolve_ids('certificate', p_certs) as cert_ids,
      public.taxonomy_resolve_ids('language', p_languages) as language_ids
  )
  select jp.id
  from public.job_posts jp
  left join public.employer_profiles ep on ep.id = jp.employer_profile_id
  cross join q
  cross join tax
  where jp.status::text = 'published'
    and (jp.expires_at is null or jp.expires_at >= now())
    and (
      jp.application_deadline is null
      or jp.application_deadline >= ((timezone('Europe/Tallinn', now()))::date)
    )
    and (
      q.needle is null
      or (q.tsq <> ''::tsquery and jp.search_tsv @@ q.tsq)
      or jp.search_text like '%' || q.needle_norm || '%'
      or jp.employer_profile_id in (
        select ep2.id
        from public.employer_profiles ep2
        where (q.tsq <> ''::tsquery and ep2.search_tsv @@ q.tsq)
           or ep2.search_text like '%' || q.needle_norm || '%'
      )
    )
    and (
      not coalesce(p_has_salary, false)
      or jp.salary_min is not null
      or jp.salary_max is not null
    )
    and (
      p_omit_facet = 'location'
      or coalesce(array_length(p_locations, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_locations) loc
        where exists (
          select 1
          from regexp_split_to_table(coalesce(jp.location, ''), '[,/|]+') part
          where public.job_search_compact(part) = public.job_search_compact(loc)
        )
        or public.job_search_norm(jp.location) like '%' || public.job_search_norm(loc) || '%'
      )
    )
    and (
      p_omit_facet = 'title'
      or coalesce(array_length(p_titles, 1), 0) = 0
      or public.job_search_norm(jp.title) = any (
        select public.job_search_norm(t) from unnest(p_titles) t
      )
      or (
        coalesce(array_length(tax.title_ids, 1), 0) > 0
        and (
          jp.profession_id = any (tax.title_ids)
          or public.taxonomy_map_one('profession', jp.title) = any (tax.title_ids)
        )
      )
    )
    and (
      p_omit_facet = 'domain'
      or coalesce(array_length(p_domains, 1), 0) = 0
      or public.job_search_norm(ep.industry) = any (
        select public.job_search_norm(d) from unnest(p_domains) d
      )
      or (
        coalesce(array_length(tax.domain_ids, 1), 0) > 0
        and (
          jp.industry_id = any (tax.domain_ids)
          or ep.industry_id = any (tax.domain_ids)
          or public.taxonomy_map_one('industry', ep.industry) = any (tax.domain_ids)
        )
      )
    )
    and (
      p_omit_facet = 'jobType'
      or coalesce(array_length(p_job_types, 1), 0) = 0
      or public.job_search_job_type_key(jp.job_type) = any (
        select public.job_search_job_type_key(t) from unnest(p_job_types) t
      )
    )
    and (
      p_omit_facet = 'workType'
      or coalesce(array_length(p_work_types, 1), 0) = 0
      or public.job_search_work_type_key(jp.work_type) = any (
        select public.job_search_work_type_key(t) from unnest(p_work_types) t
      )
    )
    and (
      p_omit_facet = 'salary'
      or coalesce(array_length(p_salary_buckets, 1), 0) = 0
      or exists (
        select 1 from unnest(p_salary_buckets) b
        where public.job_salary_overlaps_bucket(jp.salary_min, jp.salary_max, b)
      )
    )
    and (
      p_omit_facet = 'experience'
      or coalesce(array_length(p_experience, 1), 0) = 0
      or jp.experience_level_required = any (p_experience)
    )
    and (
      p_omit_facet = 'skill'
      or coalesce(array_length(p_skills, 1), 0) = 0
      or public.job_search_norm_arr(jp.required_skills) && public.job_search_norm_arr(p_skills)
      or (
        coalesce(array_length(tax.skill_ids, 1), 0) > 0
        and (
          jp.skill_ids && tax.skill_ids
          or exists (
            select 1 from unnest(coalesce(jp.required_skills, '{}'::text[])) s
            where public.taxonomy_map_one('skill', s) = any (tax.skill_ids)
          )
        )
      )
    )
    and (
      p_omit_facet = 'cert'
      or coalesce(array_length(p_certs, 1), 0) = 0
      or exists (
        select 1 from unnest(p_certs) c
        where exists (
          select 1
          from regexp_split_to_table(coalesce(jp.certificate_requirements, ''), '[,;\n]+') part
          where public.job_search_norm(part) = public.job_search_norm(c)
        )
      )
      or (
        coalesce(array_length(tax.cert_ids, 1), 0) > 0
        and (
          jp.certificate_ids && tax.cert_ids
          or exists (
            select 1
            from regexp_split_to_table(coalesce(jp.certificate_requirements, ''), '[,;\n]+') part
            where public.taxonomy_map_one('certificate', part) = any (tax.cert_ids)
          )
        )
      )
    )
    and (
      p_omit_facet = 'language'
      or coalesce(array_length(p_languages, 1), 0) = 0
      or public.job_search_norm_arr(jp.languages) && public.job_search_norm_arr(p_languages)
      or (
        coalesce(array_length(tax.language_ids, 1), 0) > 0
        and (
          jp.language_ids && tax.language_ids
          or exists (
            select 1 from unnest(coalesce(jp.languages, '{}'::text[])) l
            where public.taxonomy_map_one('language', l) = any (tax.language_ids)
          )
        )
      )
      or exists (
        select 1 from unnest(p_languages) lang
        where exists (
          select 1 from unnest(coalesce(jp.keywords, '{}'::text[])) k
          where public.job_search_norm(k) = public.job_search_norm(lang)
             or public.job_search_norm(k) like '%' || public.job_search_norm(lang) || '%'
        )
        or public.job_search_norm(jp.title) like '%' || public.job_search_norm(lang) || '%'
        or public.job_search_norm(jp.short_summary) like '%' || public.job_search_norm(lang) || '%'
      )
    );
$$;

-- Facet values prefer canonical IDs when an alias/ID exists, else leftover free text.
create or replace function public.published_job_search_facets(
  p_query text default null,
  p_locations text[] default null,
  p_titles text[] default null,
  p_domains text[] default null,
  p_job_types text[] default null,
  p_work_types text[] default null,
  p_salary_buckets text[] default null,
  p_experience text[] default null,
  p_skills text[] default null,
  p_certs text[] default null,
  p_languages text[] default null,
  p_has_salary boolean default false
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_out jsonb := '{}'::jsonb;
begin
  v_out := v_out || jsonb_build_object('title', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select trim(jp.title) as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'title'
        ) m
      )
      and char_length(trim(jp.title)) between 2 and 48
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('location', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select trim(part) as val, count(*)::int as cnt
      from public.job_posts jp
      cross join lateral regexp_split_to_table(coalesce(jp.location, ''), '[,/|]+') part
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'location'
        ) m
      )
      and char_length(trim(part)) between 2 and 48
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('domain', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, jp.industry_id as val
        from public.job_posts jp
        where jp.industry_id is not null
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'domain'
            ) m
          )
        union
        select jp.id, ep.industry_id
        from public.job_posts jp
        join public.employer_profiles ep on ep.id = jp.employer_profile_id
        where ep.industry_id is not null
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'domain'
            ) m
          )
        union
        select jp.id, coalesce(public.taxonomy_map_one('industry', ep.industry), trim(ep.industry))
        from public.job_posts jp
        join public.employer_profiles ep on ep.id = jp.employer_profile_id
        where coalesce(jp.industry_id, ep.industry_id) is null
          and char_length(trim(ep.industry)) between 2 and 48
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'domain'
            ) m
          )
      ) y
      where y.val is not null and y.val <> ''
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('jobType', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select replace(lower(coalesce(jp.job_type, '')), '-', '_') as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'jobType'
        ) m
      )
      and coalesce(jp.job_type, '') <> ''
      group by 1
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('workType', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select replace(replace(lower(coalesce(jp.work_type, '')), '-', '_'), 'onsite', 'on_site') as val,
             count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'workType'
        ) m
      )
      and coalesce(jp.work_type, '') <> ''
      group by 1
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('salary', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.val)
    from (
      select b.val, count(*)::int as cnt
      from public.job_posts jp
      cross join (values ('0-1499'), ('1500-1999'), ('2000-2499'), ('2500-2999'), ('3000-3999'), ('4000+')) as b(val)
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'salary'
        ) m
      )
      and public.job_salary_overlaps_bucket(jp.salary_min, jp.salary_max, b.val)
      group by 1
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('experience', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select jp.experience_level_required as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'experience'
        ) m
      )
      and coalesce(jp.experience_level_required, '') <> ''
      group by 1
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('skill', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, sid as val
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.skill_ids, '{}'::text[])) sid
        where jp.id in (
          select m.id from public.published_job_ids_matching(
            p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
            p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'skill'
          ) m
        )
        union
        select jp.id, coalesce(public.taxonomy_map_one('skill', s), trim(s))
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.required_skills, '{}'::text[])) s
        where char_length(trim(s)) between 2 and 48
          and (
            coalesce(array_length(jp.skill_ids, 1), 0) = 0
            or public.taxonomy_map_one('skill', s) is null
          )
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'skill'
            ) m
          )
      ) y
      where y.val is not null and y.val <> ''
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('cert', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, cid as val
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.certificate_ids, '{}'::text[])) cid
        where jp.id in (
          select m.id from public.published_job_ids_matching(
            p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
            p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'cert'
          ) m
        )
        union
        select jp.id, coalesce(public.taxonomy_map_one('certificate', part), trim(part))
        from public.job_posts jp
        cross join lateral regexp_split_to_table(coalesce(jp.certificate_requirements, ''), '[,;\n]+') part
        where char_length(trim(part)) between 2 and 48
          and (
            coalesce(array_length(jp.certificate_ids, 1), 0) = 0
            or public.taxonomy_map_one('certificate', part) is null
          )
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'cert'
            ) m
          )
      ) y
      where y.val is not null and y.val <> ''
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  v_out := v_out || jsonb_build_object('language', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, lid as val
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.language_ids, '{}'::text[])) lid
        where jp.id in (
          select m.id from public.published_job_ids_matching(
            p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
            p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'language'
          ) m
        )
        union
        select jp.id, coalesce(public.taxonomy_map_one('language', l), trim(l))
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.languages, '{}'::text[])) l
        where char_length(trim(l)) between 2 and 48
          and (
            coalesce(array_length(jp.language_ids, 1), 0) = 0
            or public.taxonomy_map_one('language', l) is null
          )
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'language'
            ) m
          )
      ) y
      where y.val is not null and y.val <> ''
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  return v_out;
end;
$$;

create or replace function public.published_job_facet_values(
  p_facet text,
  p_facet_query text default null,
  p_query text default null,
  p_locations text[] default null,
  p_titles text[] default null,
  p_domains text[] default null,
  p_job_types text[] default null,
  p_work_types text[] default null,
  p_salary_buckets text[] default null,
  p_experience text[] default null,
  p_skills text[] default null,
  p_certs text[] default null,
  p_languages text[] default null,
  p_has_salary boolean default false,
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_facet text := nullif(trim(p_facet), '');
  v_q text := nullif(trim(p_facet_query), '');
  v_qn text := public.job_search_norm(p_facet_query);
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 40);
  v_out jsonb := '[]'::jsonb;
begin
  if v_facet is null then
    return v_out;
  end if;

  if v_facet = 'title' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(jp.title) as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'title'
        ) m
      )
      and char_length(trim(jp.title)) between 2 and 48
      and (v_q is null or public.job_search_norm(jp.title) like '%' || v_qn || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'location' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(part) as val, count(*)::int as cnt
      from public.job_posts jp
      cross join lateral regexp_split_to_table(coalesce(jp.location, ''), '[,/|]+') part
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'location'
        ) m
      )
      and char_length(trim(part)) between 2 and 48
      and (v_q is null or public.job_search_norm(part) like '%' || v_qn || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'domain' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, jp.industry_id as val
        from public.job_posts jp
        where jp.industry_id is not null
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'domain'
            ) m
          )
        union
        select jp.id, ep.industry_id
        from public.job_posts jp
        join public.employer_profiles ep on ep.id = jp.employer_profile_id
        where ep.industry_id is not null
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'domain'
            ) m
          )
        union
        select jp.id, coalesce(public.taxonomy_map_one('industry', ep.industry), trim(ep.industry))
        from public.job_posts jp
        join public.employer_profiles ep on ep.id = jp.employer_profile_id
        where coalesce(jp.industry_id, ep.industry_id) is null
          and char_length(trim(ep.industry)) between 2 and 48
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'domain'
            ) m
          )
      ) y
      left join public.taxonomy_industries ti on ti.id = y.val
      where y.val is not null and y.val <> ''
        and (
          v_q is null
          or public.job_search_norm(y.val) like '%' || v_qn || '%'
          or public.job_search_norm(ti.label_et) like '%' || v_qn || '%'
          or public.job_search_norm(ti.label_en) like '%' || v_qn || '%'
          or public.job_search_norm(ti.label_ru) like '%' || v_qn || '%'
        )
      group by 1
      having count(distinct y.job_id) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'jobType' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select replace(lower(coalesce(jp.job_type, '')), '-', '_') as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'jobType'
        ) m
      )
      and coalesce(jp.job_type, '') <> ''
      and (
        v_q is null
        or public.job_search_norm(replace(lower(coalesce(jp.job_type, '')), '-', '_')) like '%' || v_qn || '%'
      )
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'workType' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select replace(replace(lower(coalesce(jp.work_type, '')), '-', '_'), 'onsite', 'on_site') as val,
             count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'workType'
        ) m
      )
      and coalesce(jp.work_type, '') <> ''
      and (
        v_q is null
        or public.job_search_norm(replace(replace(lower(coalesce(jp.work_type, '')), '-', '_'), 'onsite', 'on_site'))
          like '%' || v_qn || '%'
      )
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'salary' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.val), '[]'::jsonb)
    into v_out
    from (
      select b.val, count(*)::int as cnt
      from public.job_posts jp
      cross join (values ('0-1499'), ('1500-1999'), ('2000-2499'), ('2500-2999'), ('3000-3999'), ('4000+')) as b(val)
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'salary'
        ) m
      )
      and public.job_salary_overlaps_bucket(jp.salary_min, jp.salary_max, b.val)
      and (v_q is null or b.val like '%' || v_q || '%')
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'experience' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select jp.experience_level_required as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'experience'
        ) m
      )
      and coalesce(jp.experience_level_required, '') <> ''
      and (v_q is null or public.job_search_norm(jp.experience_level_required) like '%' || v_qn || '%')
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'skill' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, sid as val
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.skill_ids, '{}'::text[])) sid
        where jp.id in (
          select m.id from public.published_job_ids_matching(
            p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
            p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'skill'
          ) m
        )
        union
        select jp.id, coalesce(public.taxonomy_map_one('skill', s), trim(s))
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.required_skills, '{}'::text[])) s
        where char_length(trim(s)) between 2 and 48
          and (
            coalesce(array_length(jp.skill_ids, 1), 0) = 0
            or public.taxonomy_map_one('skill', s) is null
          )
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'skill'
            ) m
          )
      ) y
      left join public.taxonomy_skills ts on ts.id = y.val
      where y.val is not null and y.val <> ''
        and (
          v_q is null
          or public.job_search_norm(y.val) like '%' || v_qn || '%'
          or public.job_search_norm(ts.label_et) like '%' || v_qn || '%'
          or public.job_search_norm(ts.label_en) like '%' || v_qn || '%'
          or public.job_search_norm(ts.label_ru) like '%' || v_qn || '%'
        )
      group by 1
      having count(distinct y.job_id) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'cert' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, cid as val
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.certificate_ids, '{}'::text[])) cid
        where jp.id in (
          select m.id from public.published_job_ids_matching(
            p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
            p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'cert'
          ) m
        )
        union
        select jp.id, coalesce(public.taxonomy_map_one('certificate', part), trim(part))
        from public.job_posts jp
        cross join lateral regexp_split_to_table(coalesce(jp.certificate_requirements, ''), '[,;\n]+') part
        where char_length(trim(part)) between 2 and 48
          and (
            coalesce(array_length(jp.certificate_ids, 1), 0) = 0
            or public.taxonomy_map_one('certificate', part) is null
          )
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'cert'
            ) m
          )
      ) y
      left join public.taxonomy_certificates tc on tc.id = y.val
      where y.val is not null and y.val <> ''
        and (
          v_q is null
          or public.job_search_norm(y.val) like '%' || v_qn || '%'
          or public.job_search_norm(tc.label_et) like '%' || v_qn || '%'
          or public.job_search_norm(tc.label_en) like '%' || v_qn || '%'
          or public.job_search_norm(tc.label_ru) like '%' || v_qn || '%'
        )
      group by 1
      having count(distinct y.job_id) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'language' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select y.val, count(distinct y.job_id)::int as cnt
      from (
        select jp.id as job_id, lid as val
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.language_ids, '{}'::text[])) lid
        where jp.id in (
          select m.id from public.published_job_ids_matching(
            p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
            p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'language'
          ) m
        )
        union
        select jp.id, coalesce(public.taxonomy_map_one('language', l), trim(l))
        from public.job_posts jp
        cross join lateral unnest(coalesce(jp.languages, '{}'::text[])) l
        where char_length(trim(l)) between 2 and 48
          and (
            coalesce(array_length(jp.language_ids, 1), 0) = 0
            or public.taxonomy_map_one('language', l) is null
          )
          and jp.id in (
            select m.id from public.published_job_ids_matching(
              p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
              p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'language'
            ) m
          )
      ) y
      left join public.taxonomy_languages tl on tl.id = y.val
      where y.val is not null and y.val <> ''
        and (
          v_q is null
          or public.job_search_norm(y.val) like '%' || v_qn || '%'
          or public.job_search_norm(tl.label_et) like '%' || v_qn || '%'
          or public.job_search_norm(tl.label_en) like '%' || v_qn || '%'
          or public.job_search_norm(tl.label_ru) like '%' || v_qn || '%'
        )
      group by 1
      having count(distinct y.job_id) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  end if;

  return coalesce(v_out, '[]'::jsonb);
end;
$$;

create or replace function public.search_published_jobs(
  p_query text default null,
  p_locations text[] default null,
  p_titles text[] default null,
  p_domains text[] default null,
  p_job_types text[] default null,
  p_work_types text[] default null,
  p_salary_buckets text[] default null,
  p_experience text[] default null,
  p_skills text[] default null,
  p_certs text[] default null,
  p_languages text[] default null,
  p_has_salary boolean default false,
  p_sort text default 'newest',
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_size integer := least(greatest(coalesce(p_page_size, 20), 1), 200);
  v_sort text := case
    when p_sort in ('newest', 'salary', 'deadline') then p_sort
    else 'newest'
  end;
  v_total integer := 0;
  v_pages integer := 1;
  v_jobs jsonb := '[]'::jsonb;
begin
  select count(*)::integer into v_total
  from public.published_job_ids_matching(
    p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
    p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, null
  );

  v_pages := greatest(ceil(v_total::numeric / v_size::numeric), 1)::integer;
  if v_page > v_pages then
    v_page := v_pages;
  end if;

  with ranked as (
    select
      jp.id,
      jp.title,
      jp.location,
      jp.job_type,
      jp.work_type,
      jp.short_summary,
      jp.required_skills,
      jp.keywords,
      jp.certificate_requirements,
      jp.salary_min,
      jp.salary_max,
      jp.salary_currency,
      jp.salary_tax,
      jp.salary_period,
      jp.employer_profile_id,
      jp.status,
      jp.created_at,
      jp.published_at,
      jp.application_deadline,
      jp.expires_at,
      jp.experience_level_required,
      jp.weekly_hours,
      jp.daily_hours,
      jp.shift_start,
      jp.shift_end,
      jp.includes_night_work,
      jp.is_hazardous_work,
      jp.languages,
      jp.industry_id,
      jp.profession_id,
      jp.skill_ids,
      jp.certificate_ids,
      jp.language_ids,
      ep.company_name,
      ep.logo_url,
      ep.company_verified,
      ep.verification_status,
      ep.industry,
      ep.industry_id as employer_industry_id,
      ep.public_slug,
      case v_sort
        when 'salary' then coalesce(jp.salary_max, jp.salary_min)
        else null
      end as sort_salary,
      case v_sort
        when 'deadline' then jp.application_deadline
        else null
      end as sort_deadline,
      coalesce(jp.published_at, jp.created_at) as sort_published
    from public.job_posts jp
    left join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where jp.id in (
      select m.id
      from public.published_job_ids_matching(
        p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
        p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, null
      ) m
    )
  ),
  ordered as (
    select *
    from ranked
    order by
      case when v_sort = 'salary' then sort_salary end desc nulls last,
      case when v_sort = 'deadline' then sort_deadline end asc nulls last,
      sort_published desc nulls last,
      created_at desc
    offset (v_page - 1) * v_size
    limit v_size
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'title', o.title,
        'location', o.location,
        'job_type', o.job_type,
        'work_type', o.work_type,
        'short_summary', o.short_summary,
        'required_skills', o.required_skills,
        'keywords', o.keywords,
        'certificate_requirements', o.certificate_requirements,
        'salary_min', o.salary_min,
        'salary_max', o.salary_max,
        'salary_currency', o.salary_currency,
        'salary_tax', o.salary_tax,
        'salary_period', o.salary_period,
        'employer_profile_id', o.employer_profile_id,
        'status', o.status,
        'created_at', o.created_at,
        'published_at', o.published_at,
        'application_deadline', o.application_deadline,
        'expires_at', o.expires_at,
        'experience_level_required', o.experience_level_required,
        'weekly_hours', o.weekly_hours,
        'daily_hours', o.daily_hours,
        'shift_start', o.shift_start,
        'shift_end', o.shift_end,
        'includes_night_work', o.includes_night_work,
        'is_hazardous_work', o.is_hazardous_work,
        'languages', o.languages,
        'industry_id', coalesce(o.industry_id, o.employer_industry_id),
        'profession_id', o.profession_id,
        'skill_ids', o.skill_ids,
        'certificate_ids', o.certificate_ids,
        'language_ids', o.language_ids,
        'company_name', o.company_name,
        'logo_url', o.logo_url,
        'company_verified', o.company_verified,
        'verification_status', o.verification_status,
        'industry', o.industry,
        'public_slug', o.public_slug
      )
      order by
        case when v_sort = 'salary' then o.sort_salary end desc nulls last,
        case when v_sort = 'deadline' then o.sort_deadline end asc nulls last,
        o.sort_published desc nulls last,
        o.created_at desc
    ),
    '[]'::jsonb
  )
  into v_jobs
  from ordered o;

  return jsonb_build_object(
    'jobs', coalesce(v_jobs, '[]'::jsonb),
    'total_count', v_total,
    'current_page', v_page,
    'total_pages', v_pages,
    'page_size', v_size
  );
end;
$$;

create or replace function public.get_job_match_inputs(p_job_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'job_id', jp.id,
        'title', jp.title,
        'location', jp.location,
        'work_type', jp.work_type,
        'job_type', jp.job_type,
        'short_summary', jp.short_summary,
        'required_skills', jp.required_skills,
        'keywords', jp.keywords,
        'certificate_requirements', jp.certificate_requirements,
        'experience_level_required', jp.experience_level_required,
        'weekly_hours', jp.weekly_hours,
        'daily_hours', jp.daily_hours,
        'shift_start', jp.shift_start,
        'shift_end', jp.shift_end,
        'includes_night_work', jp.includes_night_work,
        'is_hazardous_work', jp.is_hazardous_work,
        'requirement_lines', jp.requirement_lines,
        'job_requirements', jp.job_requirements,
        'industry_id', jp.industry_id,
        'profession_id', jp.profession_id,
        'skill_ids', jp.skill_ids,
        'certificate_ids', jp.certificate_ids,
        'language_ids', jp.language_ids,
        'requirements', case
          when coalesce(jsonb_array_length(jp.job_requirements), 0) > 0 then null
          when coalesce(array_length(jp.requirement_lines, 1), 0) > 0 then null
          else jp.requirements
        end
      )
      order by jp.id
    ),
    '[]'::jsonb
  )
  from public.job_posts jp
  where jp.status = 'published'::public.job_post_status
    and jp.id in (
      select x
      from unnest(coalesce(p_job_ids, '{}'::uuid[])) as x
      limit 200
    );
$$;

revoke all on function public.published_job_ids_matching(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text) from public;
revoke all on function public.search_published_jobs(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text, integer, integer) from public;
revoke all on function public.published_job_search_facets(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean) from public;
revoke all on function public.published_job_facet_values(text, text, text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, integer) from public;
revoke all on function public.get_job_match_inputs(uuid[]) from public;

grant execute on function public.published_job_ids_matching(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text) to anon, authenticated;
grant execute on function public.search_published_jobs(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text, integer, integer) to anon, authenticated;
grant execute on function public.published_job_search_facets(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean) to anon, authenticated;
grant execute on function public.published_job_facet_values(text, text, text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, integer) to anon, authenticated;
grant execute on function public.get_job_match_inputs(uuid[]) to authenticated;

notify pgrst, 'reload schema';

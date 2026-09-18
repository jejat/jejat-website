-- Jejat beta product study: schema, security and RPC functions
-- Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.categories (
  key      text primary key,
  name_en  text not null,
  name_ar  text not null,
  emoji    text,
  sort     int  not null default 0
);

create table if not exists public.products (
  id          serial primary key,
  sku         text unique,
  category    text not null references public.categories(key),
  name_en     text not null,
  name_ar     text not null,
  desc_en     text,
  desc_ar     text,
  image_url   text,
  source_url  text,          -- private supplier link, never sent to visitors
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.visitors (
  id             uuid primary key,          -- generated on the device, acts as the visitor's secret token
  first_name     text,
  last_name      text,
  email          text,
  phone          text,
  residence      text,                      -- aleppo | damascus | syria_other | abroad
  age_band       text,                      -- 18_24 | 25_34 | 35_44 | 45_plus
  lang           text,
  referral_code  text unique,
  referred_by    text,
  country        text,                      -- from cf-ipcountry on first contact
  is_test        boolean not null default false,
  registered_at  timestamptz,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);

create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  visitor_id    uuid not null references public.visitors(id) on delete cascade,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  country       text,
  device        text,
  user_agent    text,
  referrer      text,
  lang          text,
  screen        text
);
create index if not exists sessions_visitor_idx on public.sessions(visitor_id, started_at desc);

create table if not exists public.impressions (
  visitor_id  uuid not null references public.visitors(id) on delete cascade,
  product_id  int  not null references public.products(id) on delete cascade,
  first_at    timestamptz not null default now(),
  primary key (visitor_id, product_id)
);
create index if not exists impressions_product_idx on public.impressions(product_id);

create table if not exists public.favorites (
  visitor_id  uuid not null references public.visitors(id) on delete cascade,
  product_id  int  not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (visitor_id, product_id)
);
create index if not exists favorites_product_idx on public.favorites(product_id);

create table if not exists public.top_picks (
  visitor_id  uuid not null references public.visitors(id) on delete cascade,
  product_id  int  not null references public.products(id) on delete cascade,
  rank        int  not null,
  saved_at    timestamptz not null default now(),
  primary key (visitor_id, product_id)
);

create table if not exists public.events (
  id          bigserial primary key,
  visitor_id  uuid references public.visitors(id) on delete cascade,
  session_id  uuid references public.sessions(id) on delete set null,
  type        text not null,     -- landing | register | click | favorite_add | favorite_remove | category | top_picks | share | lang | tab
  product_id  int references public.products(id) on delete cascade,
  category    text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists events_visitor_idx on public.events(visitor_id, created_at desc);
create index if not exists events_product_idx on public.events(product_id) where product_id is not null;
create index if not exists events_type_idx on public.events(type, created_at desc);

-- ---------- row level security ----------
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.visitors    enable row level security;
alter table public.sessions    enable row level security;
alter table public.impressions enable row level security;
alter table public.favorites   enable row level security;
alter table public.top_picks   enable row level security;
alter table public.events      enable row level security;

-- catalog is public (visitors browse with the publishable key)
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (active);

-- everything else: only logged-in admins may read; writes happen through the RPC functions below
drop policy if exists visitors_admin_read on public.visitors;
create policy visitors_admin_read on public.visitors for select to authenticated using (true);
drop policy if exists visitors_admin_update on public.visitors;
create policy visitors_admin_update on public.visitors for update to authenticated using (true) with check (true);
drop policy if exists sessions_admin_read on public.sessions;
create policy sessions_admin_read on public.sessions for select to authenticated using (true);
drop policy if exists impressions_admin_read on public.impressions;
create policy impressions_admin_read on public.impressions for select to authenticated using (true);
drop policy if exists favorites_admin_read on public.favorites;
create policy favorites_admin_read on public.favorites for select to authenticated using (true);
drop policy if exists top_picks_admin_read on public.top_picks;
create policy top_picks_admin_read on public.top_picks for select to authenticated using (true);
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events for select to authenticated using (true);
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all to authenticated using (true) with check (true);

-- the supplier link column must never reach the public key:
-- drop the table-wide grant for anon and grant only the public columns
revoke select on public.products from anon;
grant select (id, sku, category, name_en, name_ar, desc_en, desc_ar, image_url, active, sort, created_at) on public.products to anon;

-- ---------- helpers ----------
create or replace function public.req_country() returns text
language sql stable as $$
  select nullif(coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'cf-ipcountry', '')
$$;

create or replace function public.gen_referral_code() returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.visitors where referral_code = code);
  end loop;
  return code;
end $$;

create or replace function public.visitor_profile(p_visitor uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', v.id, 'first_name', v.first_name, 'last_name', v.last_name,
    'residence', v.residence, 'age_band', v.age_band, 'lang', v.lang,
    'referral_code', v.referral_code, 'registered', v.registered_at is not null,
    'is_test', v.is_test)
  from public.visitors v where v.id = p_visitor
$$;

-- ---------- visitor RPC (called with the publishable key) ----------

-- First contact from a device. Creates the visitor row (unregistered) and a session.
create or replace function public.start_visit(
  p_visitor uuid, p_referred_by text default null, p_lang text default 'ar',
  p_device text default null, p_ua text default null, p_referrer text default null,
  p_screen text default null, p_is_test boolean default false)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_country text := public.req_country();
  v_session uuid;
  v_new boolean := false;
begin
  if p_visitor is null then raise exception 'visitor id required'; end if;

  insert into public.visitors (id, referred_by, lang, country, is_test, referral_code)
  values (p_visitor, nullif(upper(p_referred_by), ''), p_lang, v_country, coalesce(p_is_test, false), public.gen_referral_code())
  on conflict (id) do update
    set last_seen_at = now(),
        lang = coalesce(excluded.lang, public.visitors.lang),
        country = coalesce(public.visitors.country, excluded.country),
        is_test = public.visitors.is_test or excluded.is_test
  returning (xmax = 0) into v_new;

  insert into public.sessions (visitor_id, country, device, user_agent, referrer, lang, screen)
  values (p_visitor, v_country, p_device, left(p_ua, 400), left(p_referrer, 400), p_lang, p_screen)
  returning id into v_session;

  insert into public.events (visitor_id, session_id, type, meta)
  values (p_visitor, v_session, 'landing', jsonb_build_object('new', v_new, 'referred_by', nullif(upper(p_referred_by), '')));

  return jsonb_build_object(
    'session_id', v_session,
    'profile', public.visitor_profile(p_visitor),
    'favorites', coalesce((select jsonb_agg(product_id order by created_at) from public.favorites where visitor_id = p_visitor), '[]'::jsonb),
    'top_picks', coalesce((select jsonb_agg(product_id order by rank) from public.top_picks where visitor_id = p_visitor), '[]'::jsonb),
    'seen', coalesce((select jsonb_agg(product_id) from public.impressions where visitor_id = p_visitor), '[]'::jsonb)
  );
end $$;

create or replace function public.register_visitor(
  p_visitor uuid, p_session uuid, p_first text, p_last text,
  p_email text default null, p_phone text default null,
  p_residence text default null, p_age_band text default null, p_lang text default 'ar')
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_first), '') = '' or coalesce(trim(p_last), '') = '' then
    raise exception 'first and last name are required';
  end if;
  update public.visitors set
    first_name = left(trim(p_first), 80),
    last_name  = left(trim(p_last), 80),
    email      = nullif(left(trim(p_email), 160), ''),
    phone      = nullif(left(trim(p_phone), 40), ''),
    residence  = nullif(p_residence, ''),
    age_band   = nullif(p_age_band, ''),
    lang       = coalesce(p_lang, lang),
    registered_at = coalesce(registered_at, now()),
    last_seen_at = now()
  where id = p_visitor;
  if not found then raise exception 'unknown visitor'; end if;
  insert into public.events (visitor_id, session_id, type) values (p_visitor, p_session, 'register');
  return public.visitor_profile(p_visitor);
end $$;

create or replace function public.heartbeat(p_visitor uuid, p_session uuid)
returns void
language sql security definer set search_path = public as $$
  update public.sessions set last_seen_at = now() where id = p_session and visitor_id = p_visitor;
  update public.visitors set last_seen_at = now() where id = p_visitor;
$$;

create or replace function public.log_impressions(p_visitor uuid, p_products int[])
returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.impressions (visitor_id, product_id)
  select p_visitor, unnest(p_products)
  on conflict do nothing;
  select count(*) into n from public.impressions where visitor_id = p_visitor;
  return n;
end $$;

create or replace function public.log_event(
  p_visitor uuid, p_session uuid, p_type text,
  p_product int default null, p_category text default null, p_meta jsonb default null)
returns void
language sql security definer set search_path = public as $$
  insert into public.events (visitor_id, session_id, type, product_id, category, meta)
  values (p_visitor, p_session, left(p_type, 40), p_product, p_category, p_meta);
$$;

create or replace function public.toggle_favorite(p_visitor uuid, p_session uuid, p_product int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare now_fav boolean;
begin
  if exists (select 1 from public.favorites where visitor_id = p_visitor and product_id = p_product) then
    delete from public.favorites where visitor_id = p_visitor and product_id = p_product;
    delete from public.top_picks where visitor_id = p_visitor and product_id = p_product;
    now_fav := false;
  else
    insert into public.favorites (visitor_id, product_id) values (p_visitor, p_product) on conflict do nothing;
    now_fav := true;
  end if;
  insert into public.events (visitor_id, session_id, type, product_id, category)
  select p_visitor, p_session, case when now_fav then 'favorite_add' else 'favorite_remove' end, p_product, category
  from public.products where id = p_product;
  return now_fav;
end $$;

create or replace function public.save_top_picks(p_visitor uuid, p_session uuid, p_products int[])
returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if array_length(p_products, 1) > 25 then raise exception 'max 25 picks'; end if;
  delete from public.top_picks where visitor_id = p_visitor;
  insert into public.top_picks (visitor_id, product_id, rank)
  select p_visitor, pid, ord
  from unnest(p_products) with ordinality as t(pid, ord)
  where exists (select 1 from public.favorites f where f.visitor_id = p_visitor and f.product_id = pid);
  get diagnostics n = row_count;
  insert into public.events (visitor_id, session_id, type, meta)
  values (p_visitor, p_session, 'top_picks', jsonb_build_object('count', n));
  return n;
end $$;

-- ---------- admin RPC (require a logged-in admin) ----------
create or replace function public.assert_admin() returns void
language plpgsql stable as $$
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'admin only' using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_overview(p_exclude_test boolean default true)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  perform public.assert_admin();
  with vis as (select * from public.visitors where not (p_exclude_test and is_test))
  select jsonb_build_object(
    'visitors_total', (select count(*) from vis),
    'visitors_registered', (select count(*) from vis where registered_at is not null),
    'visitors_today', (select count(*) from vis where created_at >= date_trunc('day', now())),
    'active_now', (select count(distinct s.visitor_id) from public.sessions s join vis on vis.id = s.visitor_id where s.last_seen_at > now() - interval '3 minutes'),
    'sessions_total', (select count(*) from public.sessions s join vis on vis.id = s.visitor_id),
    'favorites_total', (select count(*) from public.favorites f join vis on vis.id = f.visitor_id),
    'top_picks_visitors', (select count(distinct visitor_id) from public.top_picks t join vis on vis.id = t.visitor_id),
    'products_active', (select count(*) from public.products where active),
    'avg_seen', (select round(avg(c)) from (select count(*) c from public.impressions i join vis on vis.id = i.visitor_id group by i.visitor_id) x),
    'avg_favorites', (select round(avg(c), 1) from (select count(*) c from public.favorites f join vis on vis.id = f.visitor_id group by f.visitor_id) x),
    'avg_minutes', (select round(avg(extract(epoch from (s.last_seen_at - s.started_at)))/60, 1) from public.sessions s join vis on vis.id = s.visitor_id),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('country', country, 'n', n) order by n desc), '[]'::jsonb)
                  from (select coalesce(country, '??') country, count(*) n from vis group by 1) c),
    'residence', (select coalesce(jsonb_agg(jsonb_build_object('key', residence, 'n', n) order by n desc), '[]'::jsonb)
                  from (select coalesce(residence, 'unknown') residence, count(*) n from vis where registered_at is not null group by 1) c),
    'age', (select coalesce(jsonb_agg(jsonb_build_object('key', age_band, 'n', n) order by n desc), '[]'::jsonb)
            from (select coalesce(age_band, 'unknown') age_band, count(*) n from vis where registered_at is not null group by 1) c),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'visitors', v, 'sessions', s, 'favorites', f) order by d), '[]'::jsonb)
              from (
                select d,
                  (select count(*) from vis where created_at::date = d) v,
                  (select count(*) from public.sessions s join vis on vis.id = s.visitor_id where s.started_at::date = d) s,
                  (select count(*) from public.favorites f join vis on vis.id = f.visitor_id where f.created_at::date = d) f
                from generate_series((now() - interval '13 days')::date, now()::date, interval '1 day') g(d)
              ) x)
  ) into r;
  return r;
end $$;

create or replace function public.admin_product_stats(
  p_exclude_test boolean default true, p_residence text default null, p_age_band text default null)
returns table (
  id int, sku text, category text, name_en text, name_ar text, image_url text, source_url text, active boolean,
  reach bigint, favorites bigint, clicks bigint, top_picks bigint, fav_rate numeric, click_rate numeric, score numeric)
language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
  with vis as (
    select v.id from public.visitors v
    where not (p_exclude_test and v.is_test)
      and (p_residence is null or v.residence = p_residence)
      and (p_age_band is null or v.age_band = p_age_band)
  ),
  imp as (select i.product_id, count(*) n from public.impressions i join vis on vis.id = i.visitor_id group by 1),
  fav as (select f.product_id, count(*) n from public.favorites f join vis on vis.id = f.visitor_id group by 1),
  clk as (select e.product_id, count(*) n from public.events e join vis on vis.id = e.visitor_id where e.type = 'click' group by 1),
  tp  as (select t.product_id, count(*) n from public.top_picks t join vis on vis.id = t.visitor_id group by 1)
  select p.id, p.sku, p.category, p.name_en, p.name_ar, p.image_url, p.source_url, p.active,
    coalesce(imp.n, 0), coalesce(fav.n, 0), coalesce(clk.n, 0), coalesce(tp.n, 0),
    case when coalesce(imp.n, 0) > 0 then round(100.0 * coalesce(fav.n, 0) / imp.n, 1) else 0 end,
    case when coalesce(imp.n, 0) > 0 then round(100.0 * coalesce(clk.n, 0) / imp.n, 1) else 0 end,
    -- trending score: favorite rate weighted by reach, plus a bonus per top-25 pick
    case when coalesce(imp.n, 0) > 0
         then round(100.0 * (coalesce(fav.n, 0) + 2 * coalesce(tp.n, 0)) / (imp.n + 5), 1) else 0 end
  from public.products p
  left join imp on imp.product_id = p.id
  left join fav on fav.product_id = p.id
  left join clk on clk.product_id = p.id
  left join tp  on tp.product_id = p.id
  order by 15 desc, 10 desc, p.id;
end $$;

create or replace function public.admin_visitors(p_exclude_test boolean default false)
returns table (
  id uuid, first_name text, last_name text, email text, phone text, residence text, age_band text,
  lang text, country text, referral_code text, referred_by text, referred_by_name text, is_test boolean,
  registered_at timestamptz, created_at timestamptz, last_seen_at timestamptz,
  sessions bigint, minutes numeric, seen bigint, clicks bigint, favorites bigint, top_picks bigint, invited bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
  select v.id, v.first_name, v.last_name, v.email, v.phone, v.residence, v.age_band, v.lang, v.country,
    v.referral_code, v.referred_by,
    (select r.first_name || ' ' || r.last_name from public.visitors r where r.referral_code = v.referred_by),
    v.is_test, v.registered_at, v.created_at, v.last_seen_at,
    (select count(*) from public.sessions s where s.visitor_id = v.id),
    (select round(coalesce(sum(extract(epoch from (s.last_seen_at - s.started_at))), 0) / 60, 1) from public.sessions s where s.visitor_id = v.id),
    (select count(*) from public.impressions i where i.visitor_id = v.id),
    (select count(*) from public.events e where e.visitor_id = v.id and e.type = 'click'),
    (select count(*) from public.favorites f where f.visitor_id = v.id),
    (select count(*) from public.top_picks t where t.visitor_id = v.id),
    (select count(*) from public.visitors r where r.referred_by = v.referral_code)
  from public.visitors v
  where not (p_exclude_test and v.is_test)
  order by v.last_seen_at desc;
end $$;

create or replace function public.admin_visitor_detail(p_visitor uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  perform public.assert_admin();
  select jsonb_build_object(
    'visitor', to_jsonb(v),
    'sessions', (select coalesce(jsonb_agg(to_jsonb(s) order by s.started_at desc), '[]'::jsonb) from public.sessions s where s.visitor_id = v.id),
    'favorites', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name_en', p.name_en, 'name_ar', p.name_ar, 'image_url', p.image_url, 'category', p.category, 'at', f.created_at) order by f.created_at desc), '[]'::jsonb)
                  from public.favorites f join public.products p on p.id = f.product_id where f.visitor_id = v.id),
    'top_picks', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name_en', p.name_en, 'name_ar', p.name_ar, 'image_url', p.image_url, 'category', p.category, 'rank', t.rank) order by t.rank), '[]'::jsonb)
                  from public.top_picks t join public.products p on p.id = t.product_id where t.visitor_id = v.id),
    'clicked', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name_en', p.name_en, 'name_ar', p.name_ar, 'image_url', p.image_url, 'category', p.category, 'n', c.n) order by c.n desc), '[]'::jsonb)
                from (select e.product_id, count(*) n from public.events e where e.visitor_id = v.id and e.type = 'click' group by 1) c
                join public.products p on p.id = c.product_id),
    'seen_count', (select count(*) from public.impressions i where i.visitor_id = v.id),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('type', e.type, 'product_id', e.product_id, 'category', e.category, 'meta', e.meta, 'at', e.created_at) order by e.created_at desc), '[]'::jsonb)
               from (select * from public.events e where e.visitor_id = v.id order by e.created_at desc limit 300) e)
  ) into r
  from public.visitors v where v.id = p_visitor;
  return r;
end $$;

create or replace function public.admin_category_stats(p_exclude_test boolean default true)
returns table (key text, name_en text, name_ar text, emoji text, products bigint, reach bigint, favorites bigint, clicks bigint, top_picks bigint, fav_rate numeric)
language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
  with vis as (select v.id from public.visitors v where not (p_exclude_test and v.is_test))
  select c.key, c.name_en, c.name_ar, c.emoji,
    (select count(*) from public.products p where p.category = c.key and p.active),
    (select count(*) from public.impressions i join public.products p on p.id = i.product_id join vis on vis.id = i.visitor_id where p.category = c.key),
    (select count(*) from public.favorites f join public.products p on p.id = f.product_id join vis on vis.id = f.visitor_id where p.category = c.key),
    (select count(*) from public.events e join vis on vis.id = e.visitor_id where e.type = 'click' and e.category = c.key),
    (select count(*) from public.top_picks t join public.products p on p.id = t.product_id join vis on vis.id = t.visitor_id where p.category = c.key),
    (select case when count(i.*) > 0 then round(100.0 * (select count(*) from public.favorites f join public.products p on p.id = f.product_id join vis on vis.id = f.visitor_id where p.category = c.key) / count(i.*), 1) else 0 end
       from public.impressions i join public.products p on p.id = i.product_id join vis on vis.id = i.visitor_id where p.category = c.key)
  from public.categories c
  order by c.sort;
end $$;

create or replace function public.admin_live_feed(p_limit int default 60, p_exclude_test boolean default true)
returns table (at timestamptz, type text, visitor_id uuid, visitor_name text, country text, product_id int, product_name text, category text, meta jsonb)
language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
  select e.created_at, e.type, e.visitor_id,
    coalesce(nullif(trim(coalesce(v.first_name, '') || ' ' || coalesce(v.last_name, '')), ''), 'Anonymous'),
    v.country, e.product_id, p.name_en, coalesce(e.category, p.category), e.meta
  from public.events e
  join public.visitors v on v.id = e.visitor_id
  left join public.products p on p.id = e.product_id
  where not (p_exclude_test and v.is_test)
  order by e.created_at desc
  limit least(p_limit, 500);
end $$;

-- admin functions are not callable with the publishable key
revoke execute on function public.admin_overview(boolean) from public, anon;
revoke execute on function public.admin_product_stats(boolean, text, text) from public, anon;
revoke execute on function public.admin_visitors(boolean) from public, anon;
revoke execute on function public.admin_visitor_detail(uuid) from public, anon;
revoke execute on function public.admin_category_stats(boolean) from public, anon;
revoke execute on function public.admin_live_feed(int, boolean) from public, anon;
revoke execute on function public.visitor_profile(uuid) from public, anon;
grant execute on function public.admin_overview(boolean) to authenticated;
grant execute on function public.admin_product_stats(boolean, text, text) to authenticated;
grant execute on function public.admin_visitors(boolean) to authenticated;
grant execute on function public.admin_visitor_detail(uuid) to authenticated;
grant execute on function public.admin_category_stats(boolean) to authenticated;
grant execute on function public.admin_live_feed(int, boolean) to authenticated;

drop function if exists public.debug_headers();
notify pgrst, 'reload schema';

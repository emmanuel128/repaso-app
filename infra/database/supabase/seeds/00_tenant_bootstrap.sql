-- =========================
-- Default tenant bootstrap
-- =========================
insert into tenants (id, name, slug)
values ('11111111-1111-1111-1111-111111111111', 'Default Tenant', 'default')
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug;

insert into tenant_settings (tenant_id, logo_url, features)
values ('11111111-1111-1111-1111-111111111111', null, '{"onboarding": true}')
on conflict (tenant_id) do update
set
  logo_url = excluded.logo_url,
  features = excluded.features;

insert into areas (tenant_id, name, slug, description, order_index)
values (
  '11111111-1111-1111-1111-111111111111',
  'General',
  'general',
  'General topics',
  0
)
on conflict (tenant_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  order_index = excluded.order_index;

insert into topics (tenant_id, area_id, name, slug, description, order_index)
select
  '11111111-1111-1111-1111-111111111111',
  a.id,
  'Introductions',
  'introductions',
  'Welcome topic',
  0
from areas a
where a.slug = 'general'
  and a.tenant_id = '11111111-1111-1111-1111-111111111111'
on conflict (tenant_id, slug) do update
set
  area_id = excluded.area_id,
  name = excluded.name,
  description = excluded.description,
  order_index = excluded.order_index;

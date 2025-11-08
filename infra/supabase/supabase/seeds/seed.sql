-- =========================
-- Seeds mínimos (tenant por defecto)
-- =========================
insert into tenants (id, name, slug)
values ('11111111-1111-1111-1111-111111111111','Default Tenant','default')
on conflict (id) do nothing;

insert into tenant_settings (tenant_id, logo_url, features)
values ('11111111-1111-1111-1111-111111111111', null, '{"onboarding": true}')
on conflict (tenant_id) do nothing;

-- Ejemplo de área y tópico iniciales
insert into areas (tenant_id, name, slug, description)
values ('11111111-1111-1111-1111-111111111111','General','general','General topics')
on conflict do nothing;

insert into topics (tenant_id, area_id, name, slug, description)
select '11111111-1111-1111-1111-111111111111', a.id, 'Introductions','introductions','Welcome topic'
from areas a where a.slug = 'general' and a.tenant_id = '11111111-1111-1111-1111-111111111111'
on conflict do nothing;
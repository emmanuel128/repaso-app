-- ======================================
-- Psychology Board Exam MVP seed content
-- ======================================
insert into areas (id, tenant_id, name, slug, description, order_index)
values
  ('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Fundamentos de la Psicología', 'fundamentos-psicologia', 'Bases teóricas, ética y fundamentos para la Reválida.', 1),
  ('20000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Evaluación y Diagnóstico', 'evaluacion-diagnostico', 'Evaluación clínica, formulación y diagnóstico diferencial.', 2),
  ('20000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Intervención y Tratamiento', 'intervencion-tratamiento', 'Modelos de intervención, alianza terapéutica y manejo clínico.', 3)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  order_index = excluded.order_index;

insert into topics (id, tenant_id, area_id, name, slug, description, order_index)
values
  ('30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000001', 'Ética Profesional', 'etica-profesional', 'Principios éticos, confidencialidad y consentimiento informado.', 1),
  ('30000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000002', 'Psicopatología', 'psicopatologia', 'Clasificación diagnóstica, formulación clínica y diagnósticos diferenciales.', 1),
  ('30000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000003', 'Intervenciones Basadas en Evidencia', 'intervenciones-basadas-en-evidencia', 'Selección de intervenciones según evidencia y necesidades del paciente.', 1)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  area_id = excluded.area_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  order_index = excluded.order_index;

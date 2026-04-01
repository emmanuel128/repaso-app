-- =========================================================
-- Additional question seed for the hosted topic slug set
-- =========================================================
insert into questions (id, tenant_id, topic_id, type, difficulty, prompt, explanation, points, status)
select
  seed.id,
  t.tenant_id,
  t.id,
  seed.type::question_type,
  seed.difficulty::difficulty,
  seed.prompt,
  seed.explanation,
  seed.points,
  'published'::content_status
from (
  values
    (
      '71000000-0000-0000-0000-000000000001'::uuid,
      'principios-eticos',
      'single_choice',
      'easy',
      'El principio ético de beneficencia exige que el psicólogo:',
      'Beneficencia implica actuar para promover el bienestar del paciente y minimizar daño previsible en evaluación e intervención.',
      1::numeric
    ),
    (
      '71000000-0000-0000-0000-000000000002'::uuid,
      'principios-eticos',
      'single_choice',
      'medium',
      'Cuando existe conflicto entre autonomía del paciente y prevención de daño, el primer paso clínico más sólido es:',
      'Antes de limitar autonomía, el psicólogo debe evaluar riesgo, capacidad de decisión y documentar el razonamiento ético y clínico.',
      1::numeric
    ),
    (
      '71000000-0000-0000-0000-000000000003'::uuid,
      'confidencialidad',
      'single_choice',
      'easy',
      'La confidencialidad puede limitarse legítimamente cuando:',
      'La excepción clásica es riesgo inminente o una obligación legal clara; fuera de eso, la información debe protegerse.',
      1::numeric
    ),
    (
      '71000000-0000-0000-0000-000000000004'::uuid,
      'confidencialidad',
      'single_choice',
      'medium',
      'Un familiar pide detalles de la terapia de un adulto competente sin autorización escrita. La respuesta inicial más adecuada es:',
      'Sin autorización válida o excepción legal, la información clínica no debe divulgarse a terceros.',
      1::numeric
    ),
    (
      '71000000-0000-0000-0000-000000000005'::uuid,
      'consentimiento-informado',
      'single_choice',
      'easy',
      'El consentimiento informado válido requiere, entre otros elementos:',
      'El paciente debe comprender naturaleza del servicio, riesgos, beneficios, alternativas y límites de confidencialidad.',
      1::numeric
    ),
    (
      '71000000-0000-0000-0000-000000000006'::uuid,
      'consentimiento-informado',
      'single_choice',
      'medium',
      'Si un paciente no demuestra capacidad suficiente para comprender el tratamiento, el psicólogo debe:',
      'La capacidad para consentir debe evaluarse; si no existe, corresponde seguir el marco legal y ético aplicable antes de proceder.',
      1::numeric
    )
) as seed(id, topic_slug, type, difficulty, prompt, explanation, points)
join topics t on t.slug = seed.topic_slug
where t.tenant_id = '11111111-1111-1111-1111-111111111111'
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  topic_id = excluded.topic_id,
  type = excluded.type,
  difficulty = excluded.difficulty,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  points = excluded.points,
  status = excluded.status;

insert into question_options (id, question_id, label, value, is_correct, order_index)
select
  seed.id,
  seed.question_id,
  seed.label,
  seed.value,
  seed.is_correct,
  seed.order_index
from (
  values
    ('81000000-0000-0000-0000-000000000001'::uuid, '71000000-0000-0000-0000-000000000001'::uuid, 'A', 'Garantizar siempre el cumplimiento literal de deseos del paciente.', false, 1),
    ('81000000-0000-0000-0000-000000000002'::uuid, '71000000-0000-0000-0000-000000000001'::uuid, 'B', 'Promover bienestar y reducir daño previsible.', true, 2),
    ('81000000-0000-0000-0000-000000000003'::uuid, '71000000-0000-0000-0000-000000000001'::uuid, 'C', 'Evitar toda intervención con carga emocional.', false, 3),
    ('81000000-0000-0000-0000-000000000004'::uuid, '71000000-0000-0000-0000-000000000001'::uuid, 'D', 'Delegar la toma de decisiones éticas al supervisor.', false, 4),

    ('81000000-0000-0000-0000-000000000005'::uuid, '71000000-0000-0000-0000-000000000002'::uuid, 'A', 'Evaluar riesgo, capacidad y documentar el análisis clínico.', true, 1),
    ('81000000-0000-0000-0000-000000000006'::uuid, '71000000-0000-0000-0000-000000000002'::uuid, 'B', 'Aceptar automáticamente la preferencia del familiar más cercano.', false, 2),
    ('81000000-0000-0000-0000-000000000007'::uuid, '71000000-0000-0000-0000-000000000002'::uuid, 'C', 'Suspender todo tratamiento de forma inmediata sin evaluación.', false, 3),
    ('81000000-0000-0000-0000-000000000008'::uuid, '71000000-0000-0000-0000-000000000002'::uuid, 'D', 'Divulgar el caso para obtener opinión informal.', false, 4),

    ('81000000-0000-0000-0000-000000000009'::uuid, '71000000-0000-0000-0000-000000000003'::uuid, 'A', 'Un amigo del paciente quiere más contexto sobre la terapia.', false, 1),
    ('81000000-0000-0000-0000-000000000010'::uuid, '71000000-0000-0000-0000-000000000003'::uuid, 'B', 'Existe riesgo inminente para el paciente u otras personas.', true, 2),
    ('81000000-0000-0000-0000-000000000011'::uuid, '71000000-0000-0000-0000-000000000003'::uuid, 'C', 'El caso es útil para discusión casual entre colegas.', false, 3),
    ('81000000-0000-0000-0000-000000000012'::uuid, '71000000-0000-0000-0000-000000000003'::uuid, 'D', 'La familia tiene curiosidad por el diagnóstico.', false, 4),

    ('81000000-0000-0000-0000-000000000013'::uuid, '71000000-0000-0000-0000-000000000004'::uuid, 'A', 'Compartir un resumen verbal para evitar conflicto.', false, 1),
    ('81000000-0000-0000-0000-000000000014'::uuid, '71000000-0000-0000-0000-000000000004'::uuid, 'B', 'Negar la divulgación hasta contar con autorización válida o base legal.', true, 2),
    ('81000000-0000-0000-0000-000000000015'::uuid, '71000000-0000-0000-0000-000000000004'::uuid, 'C', 'Entregar solo la impresión diagnóstica sin notas.', false, 3),
    ('81000000-0000-0000-0000-000000000016'::uuid, '71000000-0000-0000-0000-000000000004'::uuid, 'D', 'Discutir el caso si el familiar promete discreción.', false, 4),

    ('81000000-0000-0000-0000-000000000017'::uuid, '71000000-0000-0000-0000-000000000005'::uuid, 'A', 'Solo la firma del profesional.', false, 1),
    ('81000000-0000-0000-0000-000000000018'::uuid, '71000000-0000-0000-0000-000000000005'::uuid, 'B', 'Comprensión de riesgos, beneficios, alternativas y límites.', true, 2),
    ('81000000-0000-0000-0000-000000000019'::uuid, '71000000-0000-0000-0000-000000000005'::uuid, 'C', 'Promesa de confidencialidad absoluta sin excepciones.', false, 3),
    ('81000000-0000-0000-0000-000000000020'::uuid, '71000000-0000-0000-0000-000000000005'::uuid, 'D', 'Pago anticipado del tratamiento completo.', false, 4),

    ('81000000-0000-0000-0000-000000000021'::uuid, '71000000-0000-0000-0000-000000000006'::uuid, 'A', 'Continuar si el paciente asiente de manera informal.', false, 1),
    ('81000000-0000-0000-0000-000000000022'::uuid, '71000000-0000-0000-0000-000000000006'::uuid, 'B', 'Evaluar capacidad y seguir el marco legal/ético aplicable.', true, 2),
    ('81000000-0000-0000-0000-000000000023'::uuid, '71000000-0000-0000-0000-000000000006'::uuid, 'C', 'Pedir a cualquier familiar que firme sin más evaluación.', false, 3),
    ('81000000-0000-0000-0000-000000000024'::uuid, '71000000-0000-0000-0000-000000000006'::uuid, 'D', 'Cancelar definitivamente toda posibilidad de tratamiento.', false, 4)
) as seed(id, question_id, label, value, is_correct, order_index)
join questions q on q.id = seed.question_id
on conflict (id) do update
set
  question_id = excluded.question_id,
  label = excluded.label,
  value = excluded.value,
  is_correct = excluded.is_correct,
  order_index = excluded.order_index;

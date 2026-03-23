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

-- ======================================
-- Psychology Board Exam MVP seed content
-- ======================================
insert into areas (id, tenant_id, name, slug, description, order_index)
values
  ('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Fundamentos de la Psicología', 'fundamentos-psicologia', 'Bases teóricas, ética y fundamentos para la Reválida.', 1),
  ('20000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Evaluación y Diagnóstico', 'evaluacion-diagnostico', 'Evaluación clínica, formulación y diagnóstico diferencial.', 2),
  ('20000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Intervención y Tratamiento', 'intervencion-tratamiento', 'Modelos de intervención, alianza terapéutica y manejo clínico.', 3)
on conflict (id) do nothing;

insert into topics (id, tenant_id, area_id, name, slug, description, order_index)
values
  ('30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000001', 'Ética Profesional', 'etica-profesional', 'Principios éticos, confidencialidad y consentimiento informado.', 1),
  ('30000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000002', 'Psicopatología', 'psicopatologia', 'Clasificación diagnóstica, formulación clínica y diagnósticos diferenciales.', 1),
  ('30000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000003', 'Intervenciones Basadas en Evidencia', 'intervenciones-basadas-en-evidencia', 'Selección de intervenciones según evidencia y necesidades del paciente.', 1)
on conflict (id) do nothing;

insert into topic_notes (id, tenant_id, topic_id, title, content_md, status)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000001',
    'Confidencialidad y excepciones',
    'La confidencialidad es la regla general, pero puede limitarse cuando existe **riesgo inminente**, mandato legal o autorización informada del paciente. Para la Reválida, distingue entre compartir información útil para tratamiento y divulgar información innecesaria.',
    'published'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000002',
    'Diferencial rápido entre ansiedad y depresión',
    'Evalúa duración, intensidad, deterioro funcional y si los síntomas centrales son **preocupación/activación fisiológica** o **ánimo deprimido/anhedonia**. El diagnóstico correcto depende del patrón predominante y su curso.',
    'published'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000003',
    'Seleccionar intervención',
    'La intervención debe ajustarse al nivel de riesgo, evidencia disponible, preferencias del paciente y metas medibles. En preguntas situacionales, descarta primero intervenciones que aumenten riesgo o no corresponden a la formulación clínica.',
    'published'
  )
on conflict (id) do nothing;

insert into mnemonics (id, tenant_id, topic_id, title, content_md, status)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000001',
    'Mnemotecnia para consentimiento: C.L.A.R.O.',
    '**C**apacidad, **L**ímites, **A**lternativas, **R**iesgos/beneficios, **O**pción voluntaria. Úsala para recordar los componentes básicos del consentimiento informado.',
    'published'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000002',
    'Mnemotecnia para evaluar riesgo: P.A.S.O.',
    '**P**lan, **A**cceso a medios, **S**everidad actual, **O**rganización de apoyo. Resume factores inmediatos en evaluación de riesgo.',
    'published'
  )
on conflict (id) do nothing;

insert into cases (id, tenant_id, topic_id, title, body_md, status)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000001',
    'Caso de confidencialidad con riesgo',
    'Una paciente adulta informa ideación suicida con plan específico y acceso a medios. La prioridad clínica es evaluar el riesgo inmediato, activar apoyos y documentar el razonamiento para limitar confidencialidad según el deber de protección.',
    'published'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000003',
    'Caso de selección de tratamiento',
    'Un paciente con pánico evita múltiples contextos y reporta interferencia laboral significativa. La pregunta de examen suele apuntar a elegir una intervención con mejor evidencia para reducir evitación y reinterpretación catastrófica.',
    'published'
  )
on conflict (id) do nothing;

insert into questions (id, tenant_id, topic_id, type, difficulty, prompt, explanation, points, status)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000001',
    'single_choice',
    'medium',
    'Una excepción válida a la confidencialidad profesional ocurre cuando:',
    'Cuando existe riesgo serio e inminente para el paciente u otra persona, el psicólogo puede limitar la confidencialidad para proteger la seguridad, siempre documentando su razonamiento.',
    1,
    'published'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000001',
    'single_choice',
    'easy',
    '¿Cuál elemento es indispensable en el consentimiento informado?',
    'El consentimiento informado requiere explicar la naturaleza del servicio, riesgos y beneficios, límites de confidencialidad y que la participación sea voluntaria.',
    1,
    'published'
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000002',
    'single_choice',
    'medium',
    'Un paciente presenta preocupación excesiva la mayoría de los días por más de seis meses, tensión muscular e insomnio. El diagnóstico más probable es:',
    'La combinación de preocupación persistente, síntomas físicos de tensión y duración prolongada apunta a trastorno de ansiedad generalizada.',
    1,
    'published'
  ),
  (
    '70000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000002',
    'single_choice',
    'medium',
    'En evaluación de riesgo suicida, ¿qué dato aumenta más la urgencia clínica?',
    'La presencia de un plan específico con acceso a medios incrementa el riesgo y requiere una respuesta clínica más inmediata.',
    1,
    'published'
  ),
  (
    '70000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000003',
    'single_choice',
    'medium',
    'Para trastorno de pánico con evitación, una intervención con fuerte apoyo empírico es:',
    'La terapia cognitivo-conductual con exposición es una intervención central y bien respaldada para trastorno de pánico y evitación asociada.',
    1,
    'published'
  ),
  (
    '70000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000003',
    'single_choice',
    'easy',
    'La alianza terapéutica se fortalece principalmente cuando el psicólogo:',
    'La alianza terapéutica mejora con empatía, colaboración y metas compartidas claramente acordadas con el paciente.',
    1,
    'published'
  )
on conflict (id) do nothing;

insert into question_options (id, question_id, label, value, is_correct, order_index)
values
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'A', 'El paciente solicita copia de su expediente completo.', false, 1),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'B', 'Existe riesgo serio e inminente de daño.', true, 2),
  ('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'C', 'La familia desea más detalles del tratamiento.', false, 3),
  ('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001', 'D', 'El caso es clínicamente interesante para docencia.', false, 4),

  ('80000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000002', 'A', 'La aprobación verbal de un familiar.', false, 1),
  ('80000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000002', 'B', 'La explicación de riesgos, beneficios y voluntariedad.', true, 2),
  ('80000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000002', 'C', 'La promesa de resultados favorables.', false, 3),
  ('80000000-0000-0000-0000-000000000008', '70000000-0000-0000-0000-000000000002', 'D', 'La firma del psicólogo únicamente.', false, 4),

  ('80000000-0000-0000-0000-000000000009', '70000000-0000-0000-0000-000000000003', 'A', 'Trastorno de ansiedad generalizada', true, 1),
  ('80000000-0000-0000-0000-000000000010', '70000000-0000-0000-0000-000000000003', 'B', 'Trastorno de pánico', false, 2),
  ('80000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', 'C', 'Trastorno depresivo persistente', false, 3),
  ('80000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000003', 'D', 'Trastorno obsesivo-compulsivo', false, 4),

  ('80000000-0000-0000-0000-000000000013', '70000000-0000-0000-0000-000000000004', 'A', 'Historia familiar de depresión sin ideación actual', false, 1),
  ('80000000-0000-0000-0000-000000000014', '70000000-0000-0000-0000-000000000004', 'B', 'Plan suicida específico y acceso a medios', true, 2),
  ('80000000-0000-0000-0000-000000000015', '70000000-0000-0000-0000-000000000004', 'C', 'Síntomas leves de ansiedad situacional', false, 3),
  ('80000000-0000-0000-0000-000000000016', '70000000-0000-0000-0000-000000000004', 'D', 'Insomnio ocasional sin desesperanza', false, 4),

  ('80000000-0000-0000-0000-000000000017', '70000000-0000-0000-0000-000000000005', 'A', 'Psicoanálisis clásico de alta frecuencia', false, 1),
  ('80000000-0000-0000-0000-000000000018', '70000000-0000-0000-0000-000000000005', 'B', 'Terapia cognitivo-conductual con exposición', true, 2),
  ('80000000-0000-0000-0000-000000000019', '70000000-0000-0000-0000-000000000005', 'C', 'Consejería no directiva sin plan estructurado', false, 3),
  ('80000000-0000-0000-0000-000000000020', '70000000-0000-0000-0000-000000000005', 'D', 'Interpretación de sueños como técnica principal', false, 4),

  ('80000000-0000-0000-0000-000000000021', '70000000-0000-0000-0000-000000000006', 'A', 'Mantiene distancia emocional rígida en toda sesión', false, 1),
  ('80000000-0000-0000-0000-000000000022', '70000000-0000-0000-0000-000000000006', 'B', 'Impone metas sin consultar al paciente', false, 2),
  ('80000000-0000-0000-0000-000000000023', '70000000-0000-0000-0000-000000000006', 'C', 'Demuestra empatía y acuerda objetivos compartidos', true, 3),
  ('80000000-0000-0000-0000-000000000024', '70000000-0000-0000-0000-000000000006', 'D', 'Reduce el contacto para evitar dependencia', false, 4)
on conflict (id) do nothing;

-- =========================================================
-- Additional question seed for the hosted topic slug set
-- =========================================================
insert into questions (id, tenant_id, topic_id, type, difficulty, prompt, explanation, points, status)
select seed.id, t.tenant_id, t.id, seed.type::question_type, seed.difficulty::difficulty, seed.prompt, seed.explanation, seed.points, 'published'::content_status
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
where not exists (
  select 1
  from questions q
  where q.id = seed.id
);

insert into question_options (id, question_id, label, value, is_correct, order_index)
select seed.id, seed.question_id, seed.label, seed.value, seed.is_correct, seed.order_index
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
where not exists (
  select 1
  from question_options qo
  where qo.id = seed.id
);

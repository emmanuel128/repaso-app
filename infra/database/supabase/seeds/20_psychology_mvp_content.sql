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
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  topic_id = excluded.topic_id,
  title = excluded.title,
  content_md = excluded.content_md,
  status = excluded.status;

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
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  topic_id = excluded.topic_id,
  title = excluded.title,
  content_md = excluded.content_md,
  status = excluded.status;

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
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  topic_id = excluded.topic_id,
  title = excluded.title,
  body_md = excluded.body_md,
  status = excluded.status;

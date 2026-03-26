insert into topic_notes (id, tenant_id, topic_id, title, content_md, status)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000001',
    'Confidencialidad y excepciones',
    'La **confidencialidad** es la norma. Se limita solo cuando hay **riesgo inminente**, mandato legal o autorización válida del paciente.

Para preguntas de reválida, distingue entre:
- divulgar lo **mínimo necesario** para proteger o coordinar tratamiento
- compartir información **innecesaria** o fuera del propósito clínico',
    'published'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000002',
    'Ansiedad vs. depresión: diferencial rápido',
    'Compara cuatro ejes:
- **síntoma central**
- **duración**
- **intensidad**
- **deterioro funcional**

La **ansiedad** suele organizarse alrededor de preocupación, hipervigilancia y activación fisiológica. La **depresión** suele organizarse alrededor de ánimo deprimido, anhedonia y enlentecimiento.

El diagnóstico se define por el **patrón predominante y su curso**, no por un síntoma aislado.',
    'published'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000003',
    'Seleccionar intervención',
    'La intervención debe ajustarse a:
- **nivel de riesgo**
- **evidencia disponible**
- **preferencias del paciente**
- **metas observables**

En preguntas situacionales, descarta primero opciones que:
- aumentan el riesgo
- no encajan con la formulación clínica
- no corresponden al nivel de cuidado',
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
    'C.L.A.R.O. para consentimiento informado',
    '- **C**: Capacidad para consentir
- **L**: Límites de la confidencialidad
- **A**: Alternativas disponibles
- **R**: Riesgos y beneficios
- **O**: Opción voluntaria

Repásala para verificar que el consentimiento sea **comprendido, informado y libre de coerción**.',
    'published'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '30000000-0000-0000-0000-000000000002',
    'P.A.S.O. para evaluar riesgo',
    '- **P**: Plan concreto
- **A**: Acceso a medios
- **S**: Severidad actual de la ideación o conducta
- **O**: Organización de apoyo

Si el **P.A.S.O.** está presente o aumenta, sube la urgencia de intervención y supervisión.',
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

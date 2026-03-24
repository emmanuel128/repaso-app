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
on conflict (id) do update
set
  question_id = excluded.question_id,
  label = excluded.label,
  value = excluded.value,
  is_correct = excluded.is_correct,
  order_index = excluded.order_index;

export interface StudySectionData {
  id: number;
  title: string;
  subtitle: string;
  weight: string;
  cards: Array<{
    title: string;
    content: string;
  }>;
  buttons: Array<{
    type: 'question' | 'case' | 'explain' | 'mnemonic';
    label: string;
    bgColor: string;
    textColor: string;
    section: string;
    topics: string;
  }>;
}

export const studySections: StudySectionData[] = [
  {
    id: 1,
    title: "El Fundamento Ético y Legal",
    subtitle: "Peso: 15%",
    weight: "15%",
    cards: [
      {
        title: "Límites de la Confidencialidad",
        content: `La confidencialidad es un pilar, pero no es absoluta. Se rompe para proteger.

**P**eligro: Daño inminente al cliente u otros.
**A**buso: Sospecha de maltrato (Ley 246).
**R**evelación: Con consentimiento escrito.
**A**utoridad: Por orden de un tribunal.`
      },
      {
        title: "Leyes Clave de PR",
        content: `El marco legal que rige nuestra práctica en la isla.

**Ley 408 (Salud Mental):** Garantiza derechos del paciente, como el tratamiento en el ambiente menos restrictivo.

**Ley 246 (Protección Menores):** Te convierte en reportante mandatorio.

**Ley 96 (Reglamenta Psicología):** Define la práctica y los requisitos.`
      },
      {
        title: "Relaciones Múltiples",
        content: `Ocurren cuando tienes un rol profesional y otro rol (personal, social) con la misma persona.

**Riesgos Clave:**
• Pérdida de objetividad
• Potencial de explotación
• Daño al proceso terapéutico`
      },
      {
        title: "Manejo de Expedientes",
        content: `Según la Ley 408, los expedientes se deben conservar por un tiempo específico:

**Adultos:** 5 años después de la última visita.
**Menores:** Hasta que cumplan 22 años.
**Casos en litigio:** Se conservan hasta que termine el caso.`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Asuntos Éticos, Legales y Profesionales',
        topics: 'Límites de la confidencialidad, Leyes 408, 246 y 96, Relaciones Múltiples, Competencia profesional, Toma de decisiones éticas.'
      },
      {
        type: 'case',
        label: '✨ Generar Caso Clínico',
        bgColor: 'bg-brand-accent-1',
        textColor: 'text-white',
        section: 'Asuntos Éticos, Legales y Profesionales',
        topics: 'Dilemas de confidencialidad, relaciones duales, o aplicación de leyes de PR en un contexto clínico.'
      },
      {
        type: 'explain',
        label: '✨ Explícamelo Fácil',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Asuntos Éticos, Legales y Profesionales',
        topics: 'la diferencia entre confidencialidad y privilegio, el concepto de "deber de proteger", y qué es una relación dual.'
      }
    ]
  },
  {
    id: 2,
    title: "La Lupa Clínica: Evaluación y Diagnóstico",
    subtitle: "Peso: 14%",
    weight: "14%",
    cards: [
      {
        title: "Psicometría: Validez vs. Confiabilidad",
        content: `**Confiabilidad:** Consistencia (Resultados estables)
**Validez:** Exactitud (Mide lo que debe medir)

**Analogía:** Un reloj 5 min. adelantado es confiable pero no válido.`
      },
      {
        title: "Instrumentos y Clasificación",
        content: `Herramientas para entender y organizar los síntomas.

**Instrumentos:** Wechsler (CI), MMPI (objetivo), TAT (proyectivo), Woodcock-Muñoz (aprendizaje).
**Clasificación:** Uso del DSM-5-TR.
**Diagnóstico Diferencial:** Descartar otros trastornos.`
      },
      {
        title: "Trastornos de Personalidad",
        content: `Patrones inflexibles divididos en 3 Clusters:

**Cluster A (Raros/Excéntricos):** Paranoide, Esquizoide, Esquizotípico.
**Cluster B (Dramáticos/Erráticos):** Antisocial, Límite, Histriónico, Narcisista.
**Cluster C (Ansiosos/Temerosos):** Evitativo, Dependiente, Obsesivo-Compulsivo.`
      },
      {
        title: "Conceptos Clave",
        content: `**Trastorno Facticio:** Falsificación de síntomas para asumir el rol de enfermo (atención).

**Simulación (Malingering):** Falsificación intencional de síntomas para obtener un beneficio externo (ej. económico).

**Diagnostic Overshadowing:** Justificar todos los síntomas de un paciente por un solo diagnóstico, ignorando otros problemas.`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Evaluación y Diagnóstico',
        topics: 'Psicometría (validez, confiabilidad), uso del DSM-5-TR, diagnóstico diferencial, adaptación cultural de pruebas.'
      },
      {
        type: 'case',
        label: '✨ Generar Caso Clínico',
        bgColor: 'bg-brand-accent-1',
        textColor: 'text-white',
        section: 'Evaluación y Diagnóstico',
        topics: 'Presentación de síntomas complejos que requieren un diagnóstico diferencial cuidadoso en un contexto cultural puertorriqueño.'
      },
      {
        type: 'explain',
        label: '✨ Explícamelo Fácil',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Evaluación y Diagnóstico',
        topics: 'la diferencia entre una prueba objetiva (como el MMPI) y una proyectiva (como el TAT), y qué es un diagnóstico diferencial.'
      }
    ]
  },
  {
    id: 3,
    title: "El Arte de la Intervención",
    subtitle: "Peso: 14%",
    weight: "14%",
    cards: [
      {
        title: "Enfoques Terapéuticos",
        content: `**TCC:** Pensamiento-emoción-conducta.
**Psicodinámico:** Inconsciente y pasado.
**Humanista:** Auto-actualización.
**Sistémico:** Dinámicas del sistema.`
      },
      {
        title: "Técnica ↔ Trastorno",
        content: `Asociaciones clave de tratamientos basados en evidencia:

→ **EPR** para el **TOC**
→ **DBT** para el **TLP**
→ **Activación Conductual** para **Depresión**`
      },
      {
        title: "Terapia Humanista y Existencial",
        content: `Enfoques en el potencial y significado.

**Carl Rogers:** Terapia Centrada en el Cliente, aceptación incondicional.
**Fritz Perls:** Terapia Gestalt, el "aquí y ahora", silla vacía.
**Rollo May:** Terapia Existencial, búsqueda de sentido, afrontar la ansiedad existencial.`
      },
      {
        title: "Niveles de Prevención",
        content: `**1. Primaria:** **Prevenir** antes de que ocurra.
**2. Secundaria:** **Detectar** temprano en riesgo.
**3. Terciaria:** **Reducir** impacto del problema.`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Tratamiento, Intervención y Prevención',
        topics: 'Modelos teóricos (TCC, Humanista), técnicas basadas en evidencia (EPR, DBT), niveles de prevención.'
      },
      {
        type: 'case',
        label: '✨ Generar Caso Clínico',
        bgColor: 'bg-brand-accent-1',
        textColor: 'text-white',
        section: 'Tratamiento, Intervención y Prevención',
        topics: 'Un paciente presenta un desafío terapéutico que requiere la selección del enfoque de tratamiento más adecuado.'
      },
      {
        type: 'mnemonic',
        label: '✨ Crear Mnemotecnia',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Tratamiento, Intervención y Prevención',
        topics: 'los tres niveles de prevención (Primaria, Secundaria, Terciaria).'
      }
    ]
  },
  {
    id: 4,
    title: "Bases Cognitivas-Afectivas",
    subtitle: "Peso: 13%",
    weight: "13%",
    cards: [
      {
        title: "Procesos Cognitivos",
        content: `**Memoria:** Sensorial, corto plazo, largo plazo (explícita, implícita).
**Lenguaje:** Áreas de Broca (producción) y Wernicke (comprensión).
**Función Ejecutiva:** Planificación, control de impulsos (lóbulo frontal).`
      },
      {
        title: "Aprendizaje",
        content: `**Condicionamiento Clásico:** Asociación de estímulos (Pavlov).
**Condicionamiento Operante:** Refuerzo y castigo (Skinner).
**Aprendizaje Observacional:** Modelaje (Bandura).`
      },
      {
        title: "Motivación y Modelos",
        content: `**Disonancia Cognitiva:** Tensión por creencias contradictorias (Festinger).
**Modelo ABC (Ellis):** Acontecimiento → Creencia (Belief) → Consecuencia.
**Indefensión Aprendida (Seligman):** Pasividad aprendida ante eventos aversivos.`
      },
      {
        title: "Teorías de la Emoción",
        content: `¿Cómo experimentamos las emociones?

**James-Lange:** Estímulo → Reacción Fisiológica → Emoción. ("Corro, luego siento miedo").
**Cannon-Bard:** Estímulo → Reacción Fisiológica Y Emoción (simultáneamente).`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Bases Cognitivas-Afectivas',
        topics: 'Procesos cognitivos (memoria, lenguaje), teorías de aprendizaje (clásico, operante), motivación (disonancia cognitiva).'
      },
      {
        type: 'explain',
        label: '✨ Explícamelo Fácil',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Bases Cognitivas-Afectivas',
        topics: 'la diferencia entre condicionamiento clásico y operante usando un ejemplo de la vida diaria.'
      }
    ]
  },
  {
    id: 5,
    title: "Bases Biológicas",
    subtitle: "Peso: 12%",
    weight: "12%",
    cards: [
      {
        title: "Neuroanatomía Funcional",
        content: `**Lóbulo Frontal:** Funciones ejecutivas, juicio (Caso Phineas Gage).
**Sistema Límbico:** Emociones y memoria (amígdala, hipocampo).
**S.N. Autónomo:** Simpático (lucha/huida) vs. Parasimpático (calma).`
      },
      {
        title: "Psicofarmacología Clave",
        content: `**Antidepresivos (ISRS):** Aumentan serotonina.
**Ansiolíticos (Benzos):** Potencian GABA.
**Antipsicóticos:** Afectan la dopamina.`
      },
      {
        title: "Neurotransmisores y Trastornos",
        content: `**↓ Acetilcolina:** Alzheimer.
**↑ Dopamina:** Esquizofrenia.
**↓ Dopamina:** Parkinson.
**↓ Serotonina/Norepinefrina:** Depresión.`
      },
      {
        title: "Métodos de Evaluación",
        content: `Técnicas para observar el cerebro.

**EEG:** Mide ondas eléctricas (epilepsia, sueño).
**CT Scan / MRI:** Muestran la estructura cerebral (daño, atrofia).
**SPECT / PET:** Miden el flujo sanguíneo y la actividad funcional.`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Bases Biológicas',
        topics: 'Neuroanatomía (lóbulos, sistema límbico), psicofarmacología (ISRS, benzos), respuesta al estrés (eje HPA).'
      },
      {
        type: 'mnemonic',
        label: '✨ Crear Mnemotecnia',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Bases Biológicas',
        topics: 'los cuatro lóbulos del cerebro (Frontal, Parietal, Temporal, Occipital).'
      }
    ]
  },
  {
    id: 6,
    title: "Bases Sociales y Multiculturales",
    subtitle: "Peso: 12%",
    weight: "12%",
    cards: [
      {
        title: "Cognición Social",
        content: `**Error Fundamental de Atribución:** Sobreestimar factores disposicionales en otros.
**Efecto Halo:** Una característica positiva/negativa influye la percepción general.
**Profecía Autocumplida:** Las expectativas influyen en la conducta.`
      },
      {
        title: "Influencia Social",
        content: `**Conformidad:** Influencia del grupo (Asch).
**Obediencia:** Sometimiento a la autoridad (Milgram).
**Poder Social (French & Raven):** Referente, experto, legítimo, coercitivo, recompensa.`
      },
      {
        title: "Prejuicio y Discrimen",
        content: `**Estereotipo:** Creencia (cognitivo).
**Prejuicio:** Actitud (afectivo).
**Discriminación:** Comportamiento (conductual).`
      },
      {
        title: "Competencia Multicultural",
        content: `**Aculturación:** Proceso de adaptación a una nueva cultura.
**Etnocentrismo:** Juzgar otras culturas desde la propia.
**Adaptación Cultural:** Considerar "familismo" y "respeto" en PR.`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Bases Sociales y Multiculturales',
        topics: 'Cognición social (error de atribución), dinámica de grupo (conformidad, obediencia), competencia multicultural.'
      },
      {
        type: 'explain',
        label: '✨ Explícamelo Fácil',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Bases Sociales y Multiculturales',
        topics: 'el Error Fundamental de Atribución con un ejemplo claro.'
      }
    ]
  },
  {
    id: 7,
    title: "Crecimiento y Desarrollo",
    subtitle: "Peso: 12%",
    weight: "12%",
    cards: [
      {
        title: "Desarrollo Cognitivo (Piaget)",
        content: `**Sensoriomotor:** Permanencia del objeto.
**Preoperacional:** Egocentrismo.
**Operaciones Concretas:** Conservación.
**Operaciones Formales:** Pensamiento abstracto.`
      },
      {
        title: "Desarrollo Psicosocial (Erikson)",
        content: `**Infancia:** Confianza vs. Desconfianza.
**Adolescencia:** Identidad vs. Confusión de Roles.
**Adultez Joven:** Intimidad vs. Aislamiento.`
      },
      {
        title: "Apego y Crianza",
        content: `**Apego (Bowlby):** Seguro, Inseguro-Evitativo, Inseguro-Ambivalente.
**Estilos de Crianza:** Autoritativo (ideal), Autoritario, Permisivo, Negligente.`
      },
      {
        title: "Identidad (Marcia)",
        content: `Crisis vs. Compromiso en la adolescencia.

**Logro:** Crisis superada, compromiso hecho.
**Moratoria:** En crisis, sin compromiso.
**Exclusión (Foreclosure):** Compromiso sin crisis (impuesto).
**Difusión:** Sin crisis ni compromiso.`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Crecimiento y Desarrollo',
        topics: 'Teorías de Piaget (conservación), Erikson (identidad vs confusión), y Bowlby (apego seguro).'
      },
      {
        type: 'mnemonic',
        label: '✨ Crear Mnemotecnia',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Crecimiento y Desarrollo',
        topics: 'las 4 etapas del desarrollo cognitivo de Piaget.'
      }
    ]
  },
  {
    id: 8,
    title: "Métodos de Investigación",
    subtitle: "Peso: 8%",
    weight: "8%",
    cards: [
      {
        title: "Diseños de Investigación",
        content: `**Experimental:** Asignación aleatoria, infiere causalidad.
**Cuasi-experimental:** Grupos no equivalentes.
**Correlacional:** Mide la relación, no la causa.`
      },
      {
        title: "Variables y Validez",
        content: `**Variable Independiente (VI):** La que se manipula.
**Variable Dependiente (VD):** La que se mide.
**Validez Interna:** Confianza en la relación VI-VD.
**Validez Externa:** Generalización de resultados.`
      },
      {
        title: "Estadísticas Paramétricas vs. No Paramétricas",
        content: `**Paramétricas (ej. t-test, ANOVA):** Usan datos de intervalo/razón, asumen distribución normal.
**No Paramétricas (ej. Chi-Cuadrado):** Usan datos nominales/ordinales, no asumen distribución.`
      },
      {
        title: "Conceptos Estadísticos Clave",
        content: `**Valor p < .05:** Resultado estadísticamente significativo.
**Error Tipo I (α):** Falso positivo.
**Error Tipo II (β):** Falso negativo.`
      }
    ],
    buttons: [
      {
        type: 'question',
        label: '✨ Generar Pregunta',
        bgColor: 'bg-brand-main',
        textColor: 'text-white',
        section: 'Métodos de Investigación',
        topics: 'Diseños de investigación (experimental, correlacional), validez (interna, externa), conceptos estadísticos (valor p, error tipo I/II).'
      },
      {
        type: 'explain',
        label: '✨ Explícamelo Fácil',
        bgColor: 'bg-brand-accent-2',
        textColor: 'text-brand-dark',
        section: 'Métodos de Investigación',
        topics: 'la diferencia entre validez interna y validez externa.'
      }
    ]
  }
];

// Continue with the rest of the sections...
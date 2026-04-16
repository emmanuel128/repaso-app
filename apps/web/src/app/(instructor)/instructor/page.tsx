import Link from "next/link";

const INSTRUCTOR_FEATURES = [
  {
    href: "/instructor/cohort-monitoring",
    title: "Cohort Monitoring",
    description:
      "Visualiza el rendimiento promedio de tus estudiantes para ajustar clases presenciales.",
  },
  {
    href: "/instructor/individual-diagnosis",
    title: "Individual Diagnosis",
    description:
      "Prepara tutorias revisando las areas donde cada estudiante necesita mas apoyo.",
  },
  {
    href: "/instructor/student-management",
    title: "Student Management",
    description:
      "Da seguimiento a actividad y participacion, con espacio para futura logica de engagement.",
  },
  {
    href: "/instructor/question-analysis",
    title: "Question Analysis",
    description:
      "Identifica preguntas frecuentemente falladas por tu cohorte antes de reforzar contenido.",
  },
] as const;

export default function InstructorDashboardPage() {
  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
          Instructor
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Dashboard del instructor
          </h1>
          <p className="max-w-3xl text-base text-neutral-600">
            Este espacio ya tiene la estructura base del rol instructor. Las
            vistas siguientes son placeholders y todavia no cargan datos reales.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {INSTRUCTOR_FEATURES.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-neutral-950">
                {feature.title}
              </h2>
              <p className="text-sm leading-6 text-neutral-600">
                {feature.description}
              </p>
              <span className="text-sm font-medium text-neutral-800">
                Abrir vista placeholder
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

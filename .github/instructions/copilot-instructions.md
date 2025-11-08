# 🤖 Copilot / AI Agent Instructions

Estas instrucciones permiten que un agente de IA sea productivo rápidamente en este monorepo de examen educativo.

## 🏗 Arquitectura General
- Monorepo con tres dominios principales: `web/` (Next.js), `mobile/` (Expo/React Native) y `supabase/` (SQL migraciones, funciones edge, seeds).
- Backend "serverless" apoyado en Supabase (Auth, Postgres, Storage, Edge Functions); evita construir un backend Express a menos que sea imprescindible.
- Diseño whitelabel: núcleo de lógica debe ser parametrizable por "examen" (ej: psicología, maestros). Mantén configuraciones separables.

## 📁 Patrones de Organización
- Features se agrupan por dominio (web/mobile). Reutiliza lógica transversal moviéndola a paquetes compartidos (crear `packages/` si crece la duplicación).
- Usa nombres de ramas `feature/<descripcion-corta>`, `fix/<issue>`, `chore/<tarea>`.
- Variables sensibles en `.env` (nunca hardcode). Provee claves públicas (anon) y privadas (service role) separadas.

## 🧪 Flujo de Desarrollo
1. Instalar dependencias del monorepo:
   ```bash
   npm install
   ```
   Esto instala dependencias compartidas y de cada app.
2. Ejecutar entorno local:
    - Web: `cd apps/web && npm run dev`
    - Mobile: `cd apps/mobile && npx expo start`
    - Supabase local (si se edita schema): `cd infra/database && npm start`
    - Para entorno local completo de Supabase:
       ```bash
       cd infra/database
       npm start      # Iniciar Supabase local
       npm run migrate    # Aplicar migraciones locales
       npm run stop       # Detener la instancia
       ```
3. Migraciones: editar en `infra/database/supabase/migrations/` y aplicar con `npm run migrate`.
4. Commit temprano y frecuente. PR dispara CI (lint, build, test, deploy).

## 🧾 Convenciones de Commits
Usa el formato: `<tipo>(área): descripción breve`
Ejemplo: `feat(auth): agregar recuperación de contraseña`

Tipos: feat | fix | chore | docs | test | refactor

## 🔌 Integraciones Clave
- Autenticación y roles: via Supabase Auth + tablas de perfiles; cuando añadas nuevos roles usa ENUM/tabla lookup en migración.
- Contenido (preguntas, tópicos, casos): tablas normalizadas; evita duplicación creando relaciones (ej: `preguntas_tematicas`).
- Pagos (futuro): planificar estructura `subscriptions` y `transactions` antes de integrar Stripe.

## 🎨 Frontend (web/mobile) Conventions
- TypeScript estricto para modelos (define interfaces en `/web/src/types/` o similar).
- Estilos web: Tailwind + shadcn/ui. Prefiere componentes composables, evita CSS inline salvo para overrides rápidos.
- React Query / SWR (si se introduce data fetching) debe centralizar caché; si no presente, sugiere adoptarlo antes de reimplementar lógica ad-hoc.
- Manejo de estado global mínimo; preferir hooks por feature.

## 🗃 Datos y Migraciones
- Cada nueva feature que requiere datos: agregar migración SQL en `infra/supabase/supabase/migrations/` con nombre timestamp + descripción.
- Seeds: crear scripts para datos base (roles, exámenes) en `infra/supabase/supabase/seeds/seed.sql` reutilizables en entornos.
## 🗃 Estructura recomendada para Supabase

```
infra/supabase/
   .env
   .gitignore
   package.json
   supabase/
      config.toml
      migrations/
         <timestamp>_init.sql
      seeds/
         seed.sql
```

Incluye `.env` para `$DB_URL` local si usas scripts personalizados.
- Cuando sea necesario, crear cambios destructivos.

## 🌍 Convención de Idioma
- Todas las **entidades (tablas, columnas, modelos, interfaces y relaciones)** deben definirse **en inglés** para mantener consistencia con convenciones internacionales y facilitar integración con herramientas externas.
- Los textos visibles para el usuario final (ej. preguntas, instrucciones, labels) pueden mantenerse en español.

## 🛡 Calidad y CI
- PR debe pasar: Lint, Build, Tests. Si falla migración, revisar orden y dependencias de constraints.
- Agente puede sugerir nueva acción en GitHub Actions workflow (`.github/workflows/`) pero mantén pasos idempotentes.

## 🧩 Ejemplos de Tareas para IA
```text
"Crear migración para tabla 'topics' con campos id, exam_id, nombre, slug, weight"
"Agregar componente React 'ProgressChart' reutilizando Tailwind y datos de progreso"
"Generar hook useUserRole() que lea sesión Supabase y exponga booleans isAdmin/isInstructor/isStudent"
```

## ⚠️ Pitfalls a Evitar
- Duplicar lógica de acceso a Supabase en múltiples componentes (extrae util compartido).
- Mezclar claves service role en cliente web/mobile: solo en funciones seguras (Edge/Server).
- Hardcode de textos que deberían ser configurables por examen.

## ✅ Principios
- Parametrización > hardcode.
- Reutilización > duplicación.
- Migraciones explícitas > cambios manuales.
- Seguridad de claves y roles siempre revisada.

## 📣 Solicitudes del Usuario
Todo texto para la Revalida debe estar en español; mantén terminología psicológica consistente.

¿Algo ambiguo o faltante? Pide aclaración antes de asumir.

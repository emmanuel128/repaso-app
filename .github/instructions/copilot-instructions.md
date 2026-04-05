# 🤖 Copilot / AI Agent Instructions

Estas instrucciones permiten que un agente de IA sea productivo rápidamente en este monorepo de examen educativo.

## 🏗 Arquitectura General
- Monorepo con tres dominios principales: `apps/web` (Next.js), `apps/mobile` (placeholder para Expo/React Native) e `infra/database/supabase` (migraciones SQL, funciones edge y seeds).
- Backend "serverless" apoyado en Supabase (Auth, Postgres, Storage, Edge Functions); evita construir un backend Express a menos que sea imprescindible.
- Diseño whitelabel: el núcleo de lógica debe ser parametrizable por tenant/examen. Mantén configuraciones separables.
- La lógica compartida sigue una arquitectura por capas: `packages/domain`, `packages/application`, `packages/infrastructure` y `packages/hooks`.
- Los paquetes compartidos exponen APIs públicas por namespaces (`Access`, `Student`, `Shared`, etc.); evita imports a rutas internas de `packages/*/src/...`.
- La app web actual usa route groups internos para `(student)`, `(owner)`, `(admin)` e `(instructor)` y un `dashboard` con role switcher.

## 📁 Patrones de Organización
- Features se agrupan por dominio. Reutiliza lógica transversal en `packages/*`.
- Usa nombres de ramas `feature/<descripcion-corta>`, `fix/<issue>`, `chore/<tarea>`.
- Variables sensibles en `.env` (nunca hardcode). Provee claves públicas (anon) y privadas (service role) separadas.

### Estructura de Carpetas
```bash
repaso-app/
│
├── infra/
│   └── database/
│       ├── package.json
│       └── supabase/
│           ├── migrations/
│           │   └── 20251026_init.sql
│           ├── seeds/
│           │   └── seed.sql
│           └── functions/
│               ├── auth-webhook/
│               └── hello/
│
├── apps/                          # 🌐📱 Frontends
│   ├── web/                       # Next.js 16 app router
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── src/
│   │       ├── app/               # route groups y páginas
│   │       ├── components/
│   │       ├── lib/               # supabase + dependency boundary web
│   │       └── proxy.ts
│   │
│   └── mobile/                    # Aún sin scaffold real
│       ├── .gitkeep
│       └── agent.md
│
├── packages/
│   ├── domain/
│   │   └── src/
│   │       ├── access/
│   │       ├── shared/
│   │       └── student/
│   ├── application/
│   │   └── src/
│   │       ├── access/
│   │       └── student/
│   ├── infrastructure/
│   │   └── src/
│   │       ├── access/
│   │       ├── shared/
│   │       └── student/
│   └── hooks/
│       └── src/
│           ├── access/
│           └── student/
│
├── .github/
│   └── instructions/
│       └── copilot-instructions.md
│
├── docs/
│   ├── data-model.md
│   └── project-context.md
│
├── package.json
└── README.md
```

## 🧪 Flujo de Desarrollo
1. Instalar dependencias del monorepo:
   ```bash
   npm install
   ```
   Esto instala dependencias compartidas y de cada app.
2. Ejecutar entorno local:
    - Web: `npm run dev:web`
    - Mobile: `npm run dev:mobile` solo cuando exista el scaffold móvil
    - Supabase local:
      ```bash
      npm run db:start
      npm run db:migrate
      npm run db:stop
      ```
3. Migraciones: editar en `infra/database/supabase/migrations/` y aplicar con `npm run db:migrate`.
4. Documentación de contexto:
    - `docs/project-context.md` para el panorama general
    - `docs/data-model.md` para el modelo de datos
5. Commit temprano y frecuente.

# 🎨 Paleta de Colores – Repaso Psicología PR

Referencia única de colores: ver [apps/web/src/app/globals.css](../../apps/web/src/app/globals.css) para las variables CSS oficiales. Evita hardcodear hex y usa las variables.

## Colores Principales
- **Primario:** `var(--primary)`
- **Secundario:** `var(--secondary)`
- **Acento:** `var(--accent)`

## Neutros
- **Fondo Claro:** `var(--background-light)`
- **Texto Primario / Fondo Oscuro:** `var(--text-primary)` / `var(--background-dark)`
- **Texto Secundario:** `var(--text-secondary)`

## Estados
- **Éxito:** `var(--success)`
- **Advertencia:** `var(--warning)`
- **Error:** `var(--error)`

---

## Paleta en Bloques

| Nombre | CSS Var |
|--------|---------|
| Primario | `var(--primary)` |
| Secundario | `var(--secondary)` |
| Acento | `var(--accent)` |
| Fondo Claro | `var(--background-light)` |
| Fondo Oscuro | `var(--background-dark)` |
| Texto Secundario | `var(--text-secondary)` |
| Éxito | `var(--success)` |
| Advertencia | `var(--warning)` |
| Error | `var(--error)` |

## 🧾 Convenciones de Commits
Usa el formato: `<tipo>(área): descripción breve`
Ejemplo: `feat(auth): agregar recuperación de contraseña`

Tipos: feat | fix | chore | docs | test | refactor

## 🔌 Integraciones Clave
- Autenticación y roles: Supabase Auth + `profiles` + `user_tenants` + JWT claims inyectados por `custom_access_token_hook`.
- Contenido: el modelo actual incluye `areas`, `topics`, `topic_notes`, `mnemonics`, `cases`, `questions`, `question_options`, `tags`, `quizzes` y tablas de intentos/progreso.
- Pagos: el esquema actual ya incluye `memberships` y `payment_events`.

## 🎨 Frontend (web/mobile) Conventions
- TypeScript estricto.
- Estilos web: Tailwind CSS v4. Usa las variables CSS definidas en `apps/web/src/app/globals.css` (`--primary`, `--secondary`, `--accent`, etc.) en lugar de hardcodear colores.
- La app web usa App Router; mantén la estructura en `apps/web/src/app`.
- Respeta la estructura actual de route groups en `apps/web/src/app`.
- React Query / SWR no forman parte del stack actual; no los introduzcas por defecto sin una necesidad clara.
- Manejo de estado global mínimo; preferir hooks por feature.
- No coloques queries Supabase directamente en páginas o componentes. Usa `application` + `infrastructure` + `hooks`.
- Las páginas y componentes web deben consumir lógica compartida vía namespaces de `@repaso/hooks` y tipos de `@repaso/domain`.
- No importes `@repaso/application` ni `@repaso/infrastructure` directamente desde páginas o componentes web. Usa `apps/web/src/lib/repaso-dependencies.ts` como boundary de composición para web y `apps/web/src/components/RepasoProviders.tsx` para inyectar dependencias a los hooks.
- Para autorización de layouts y áreas en web, centraliza los predicados en `apps/web/src/lib/role-authorization.ts` y evita checks inline de roles.
- Evita checks de acceso por página si el shell autenticado compartido puede resolverlos una sola vez.

## 🧱 Capas Compartidas
- `packages/domain`: tipos base, modelos por slice y predicados/reglas puras. La política de acceso vive en `domain/Access`; los primitivos viven en `domain/Shared`.
- `packages/application`: casos de uso y contratos de repositorios/servicios. La orquestación neutral de acceso vive en `application/Access`.
- `packages/infrastructure`: cliente Supabase, auth adapters y repositorios concretos. Los adaptadores neutrales de acceso viven en `infrastructure/Access`.
- `packages/hooks`: hooks React y providers. La composición compartida de acceso vive en `hooks/Access`; hooks por feature viven en slices como `hooks/Student`.

Namespaces públicos actuales:
- `@repaso/domain`: `Access`, `Admin`, `Instructor`, `Owner`, `Shared`, `Student`
- `@repaso/application`: `Access`, `Admin`, `Instructor`, `Owner`, `Student`
- `@repaso/infrastructure`: `Access`, `Admin`, `Instructor`, `Owner`, `Shared`, `Student`
- `@repaso/hooks`: `Access`, `Admin`, `Instructor`, `Owner`, `Student`

Regla de dependencias:
- `domain` no depende de otras capas compartidas.
- `application` depende de `domain`.
- `infrastructure` depende de `domain` y satisface contratos usados por `application`.
- `hooks` depende de `application` y `domain`.
- `apps/*` deben preferir hooks como boundary de consumo; en web, la UI no debe importar `application` ni `infrastructure` directamente.
- En web, la composición/wiring hacia `infrastructure` debe quedar encapsulada en `apps/web/src/lib` y entregarse a la UI a través de `apps/web/src/components/RepasoProviders.tsx`.
- No coloques lógica de negocio role-aware en `shared`; `shared` debe quedar limitado a utilidades y tipos primitivos/base.
- Si agregas un slice nuevo por rol o feature, refléjalo consistentemente en `domain`, `application`, `infrastructure` y `hooks`.

## 🔐 Access Model Actual
- `CurrentAccess` es el modelo compartido de acceso autenticado.
- Incluye `isStudent`, `isInstructor`, `isAdmin`, `isOwner` y `hasActiveMembership`.
- La resolución del acceso actual fluye así:
  - `@repaso/infrastructure.Access.createSupabaseAccessRepository`
  - `@repaso/application.Access.resolveCurrentAccess`
  - `@repaso/hooks.Access.CurrentAccessProvider` / `@repaso/hooks.Access.useCurrentAccess`
- En web, los predicados de guardia de áreas viven en `apps/web/src/lib/role-authorization.ts` para mantener los layouts consistentes y listos para futuros cambios de jerarquía.
- `apps/web/src/components/RepasoProviders.tsx` es el punto de inyección de dependencias compartidas para acceso y hooks del slice `Student`.

## 🗃 Datos y Migraciones
- Cada nueva feature que requiere datos: agregar migración SQL en `infra/database/supabase/migrations/` con nombre timestamp + descripción.
- Seeds: usar `infra/database/supabase/seeds/seed.sql` o nuevos archivos coherentes con el flujo de Supabase CLI.

## 🗃 Estructura recomendada para Supabase

```
infra/database/
   package.json
   supabase/
      migrations/
         <timestamp>_init.sql
      seeds/
         seed.sql
      functions/
```

Incluye cambios destructivos solo cuando sean realmente necesarios y explícitos en migraciones nuevas.

## 🌍 Convención de Idioma
- Todas las **entidades (tablas, columnas, modelos, interfaces y relaciones)** deben definirse **en inglés** para mantener consistencia con convenciones internacionales y facilitar integración con herramientas externas.
- Los textos visibles para el usuario final (ej. preguntas, instrucciones, labels) pueden mantenerse en español.

## 🛡 Calidad y CI
- Valida al menos los comandos relevantes al área cambiada: web (`lint`, `typecheck`, `build`) o base de datos (`db:migrate`, `db:reset` cuando aplique).
- Si se agregan workflows en `.github/workflows/`, mantén los pasos idempotentes.

## 🧩 Ejemplos de Tareas para IA
```text
"Crear migración para tabla 'topics' con campos id, exam_id, nombre, slug, weight"
"Agregar caso de uso en packages/application para cargar el dashboard del estudiante"
"Generar hook/proveedor de acceso compartido que consuma @repaso/application.Access y exponga CurrentAccess"
"Mover una query Supabase desde una página de Next.js a packages/infrastructure y conectarla desde hooks"
"Centralizar autorización de layouts web en apps/web/src/lib/role-authorization.ts"
```

## ⚠️ Pitfalls a Evitar
- Duplicar lógica de acceso a Supabase en múltiples componentes o páginas.
- Mezclar claves service role en cliente web/mobile: solo en funciones seguras (Edge/Server).
- Hardcode de textos que deberían ser configurables por examen.
- Tratar `apps/mobile` como si ya estuviera implementado.
- Contradecir el esquema SQL o la documentación de `docs/data-model.md`.
- Saltarse la separación por capas y volver a introducir un paquete “sdk” monolítico.
- Saltarse el boundary de `apps/web/src/lib/repaso-dependencies.ts` e importar infraestructura directo desde UI web.
- Saltarse `apps/web/src/components/RepasoProviders.tsx` y volver a pasar repositorios/dependencias manualmente por páginas o componentes.
- Colocar lógica de negocio dentro de hooks cuando debería vivir en `application`.

## ✅ Principios
- Parametrización > hardcode.
- Reutilización > duplicación.
- Migraciones explícitas > cambios manuales.
- Seguridad de claves y roles siempre revisada.

## 📣 Solicitudes del Usuario
Todo texto para la Revalida debe estar en español; mantén terminología psicológica consistente.

¿Algo ambiguo o faltante? Pide aclaración antes de asumir.

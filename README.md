# 🧠 Repaso App

<!-- [![Build Status](https://github.com/emmanuel128/repaso-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/emmanuel128/repaso-app/actions) -->

Plataforma educativa para repasar y prepararse para exámenes profesionales. Inicialmente enfocada en la **Revalida de Psicología (PR)**, construida como arquitectura **whitelabel** para otros exámenes (Maestros, Abogados, College Board, etc.).

---

## 🚀 Tech Stack

| Área | Tecnología |
|------|-------------|
| Web | Next.js + TailwindCSS + shadcn/ui |
| Mobile | Expo (React Native) (futuro) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Lenguaje | TypeScript |
| Monorepo | npm Workspaces |

---

## 🧩 Estructura del Proyecto (Monorepo)

Scaffolding inicial listo para iniciar desarrollo.

```bash
repaso-app/
│
├── infra/
│   ├── database/                  # 🗄️ Backend (DB, auth, storage, migrations, seeds)
│   │   ├── .env                   # Variables de entorno locales (no commitear)
│   │   ├── .gitignore
│   │   ├── package.json
│   │   └── supabase/
│   │       ├── config.toml
│   │       ├── migrations/
│   │       │   └── 20251026_init.sql
│   │       ├── seeds/
│   │       │   └── seed.sql
│   │       ├── functions/         # Edge Functions (serverless logic)
│
├── apps/                          # 🌐📱 Frontends
│   ├── web/                       # Next.js app (SSR + PWA)
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── lib/
│   │       ├── hooks/
│   │       └── utils/
│   │
│   ├── mobile/                    # Expo app (React Native)
│   │   ├── app.config.ts
│   │   ├── package.json
│   │   └── src/
│   │       ├── screens/
│   │       ├── components/        # comparte UI con web
│   │       ├── hooks/             # comparte lógica (useAuth, useProgress, etc.)
│   │       ├── lib/
│   │       ├── utils/
│   │       └── navigation/
│
├── packages/                      # 🧩 Código compartido entre web y móvil
│   ├── ui/                        # Componentes reutilizables (botones, inputs, modales)
│   ├── lib/                       # Conexión Supabase, lógica de negocio
│   ├── hooks/                     # useAuth, useProgress, etc.
│   ├── types/                     # Tipos TypeScript comunes
│   └── utils/                     # Funciones helper
│
├── .github/
│   └── workflows/
│       ├── supabase-migrations.yml
│       ├── web-deploy.yml
│       └── mobile-build.yml
│
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   └── deployment-guide.md
│
├── package.json                   # Usa npm workspaces o Turborepo
├── turbo.json                     # Configuración de Turborepo (si lo usas)
├── .env.example
├── tsconfig.json
└── README.md
````
```mermaid
graph TD
  A[Frontend Web (Next.js)] -->|API| B[Supabase]
  C[Mobile App (Expo)] -->|Auth + Data| B
  B --> D[Storage / Edge Functions]
  B --> E[PostgreSQL DB]
  A --> F[UI Shared Components]
  C --> F
```
## ⚙️ Configuración e Instalación

1️⃣ Clonar el repositorio
```bash
git clone https://github.com/emmanuel128/repaso-app.git
cd repaso-app
```

2️⃣ Instalar dependencias
```bash
npm install
```

3️⃣ Configurar variables de entorno
Copiar `.env.example` a `.env` y completar valores reales de Supabase.

4️⃣ Variables públicas cliente
- Web (Next.js): prefijo `NEXT_PUBLIC_`
- Mobile (Expo): prefijo `EXPO_PUBLIC_`

5️⃣ Ejecutar la app web
```bash
npm run dev:web
```

6️⃣ Ejecutar la app móvil
```bash
npm run dev:mobile
# o dentro de apps/mobile -> npx expo start
```

7️⃣ Instancia local de Supabase (opcional)
```bash
npm run supabase:start
npm run supabase:push
npm run supabase:stop
```

---

## 🧱 Funcionalidades Clave (Visión)

- 🧠 **Preguntas de práctica** tipo examen con resultados instantáneos  
- 📈 **Seguimiento de progreso por tema y por intento**  
- 🎓 **Casos clínicos, notas y mnemotecnias**  
- 👥 **Roles de usuario** (estudiante, instructor, admin)  
- 💳 **Membresías y pagos** (Stripe/PayPal-ready)  
- 🌐 **Modo whitelabel:** configurable por examen y marca  

---

## 🧰 Scripts Root

| Comando | Acción |
|---------|--------|
| `npm run dev:web` | Dev server Next.js |
| `npm run dev:mobile` | Inicia Expo |
| `npm run supabase:start` | Supabase local |
| `npm run supabase:push` | Aplica migraciones |
| `npm run lint` | Linter monorepo (config por definir) |
| `npm run typecheck` | TypeScript project references |

---

## 🧑‍💻 Contribuir

1. Crear rama: `git checkout -b feature/nueva-funcionalidad`
2. Commit: `feat(area): descripción breve`
3. Push: `git push origin feature/nueva-funcionalidad`
4. PR

Convenciones:
- Commits: `tipo(scope): mensaje` (feat | fix | chore | docs | test | refactor)
- Branches: `feature/`, `fix/`, `chore/`

---

## 🔐 Seguridad & Buenas Prácticas

- No exponer `SERVICE_ROLE_KEY` en cliente (web/mobile).
- Implementar RLS en tablas sensibles (pendiente).
- Reutilizar lógica en paquetes compartidos para evitar duplicación.
- Todo contenido para la Revalida en español y terminología consistente.

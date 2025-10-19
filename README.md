# 🧠 Repaso App

<!-- [![Build Status](https://github.com/emmanuel128/repaso-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/emmanuel128/repaso-app/actions) -->

Plataforma educativa para repasar y prepararse para exámenes profesionales.  
Diseñada inicialmente para la **Revalida de Psicología en Puerto Rico**, pero construida con una arquitectura **whitelabel**, adaptable a otros exámenes como **Maestros, Abogados o College Board**.

---

## 🚀 Tech Stack

| Área | Tecnología |
|------|-------------|
| Frontend Web | [Next.js](https://nextjs.org/) + [TailwindCSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Mobile | [Expo](https://expo.dev/) (React Native) |
| Backend | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions) |
| CI/CD | [GitHub Actions](https://github.com/features/actions) |
| Infraestructura | [Vercel](https://vercel.com/) (Web) + [EAS](https://expo.dev/eas) (Mobile) |
| Lenguaje | TypeScript |

---

## 🧩 Estructura del Proyecto

```bash
repaso-app/
│
├── supabase/                      # 🗄️ Backend (DB, auth, storage, functions)
│   ├── migrations/
│   │   ├── 20251017_init_schema.sql
│   │   ├── 20251018_add_user_attempts.sql
│   ├── seed.sql
│   ├── functions/                 # Edge Functions (serverless logic)
│   │   ├── onPaymentWebhook.ts
│   │   ├── calculateProgress.ts
│   ├── config.toml
│   └── README.md
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

### 2️⃣ Instalar dependencias
```bash
npm install
# o si usas pnpm
pnpm install
```

### 3️⃣ Configurar variables de entorno
Crea un archivo `.env` en la raíz (puedes copiar `.env.example`).

Ejemplo:
```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4️⃣ Ejecutar la app web
```bash
cd apps/web
npm run dev
```

### 5️⃣ Ejecutar la app móvil
```bash
cd apps/mobile
npx expo start
```

### 6️⃣ Entorno local con Supabase

Puedes correr una instancia local de Supabase para desarrollo y pruebas:

```bash
# Iniciar Supabase localmente
npx supabase start

# Aplicar migraciones locales
npx supabase db push

# Detener la instancia
npx supabase stop
```

---

## 🧱 Funcionalidades Clave

- 🧠 **Preguntas de práctica** tipo examen con resultados instantáneos  
- 📈 **Seguimiento de progreso por tema y por intento**  
- 🎓 **Casos clínicos, notas y mnemotecnias**  
- 👥 **Roles de usuario** (estudiante, instructor, admin)  
- 💳 **Membresías y pagos** (Stripe/PayPal-ready)  
- 🌐 **Modo whitelabel:** configurable por examen y marca  

---

## 🔄 CI/CD Automatizado (GitHub Actions)

- **Lint + Build + Test** en cada push o PR  
- **Despliegue automático a Vercel** (web)  
- **EAS Build & Submit** para apps móviles  
- **Migraciones automáticas de Supabase** en main branch  

---

## 🧰 Scripts útiles

| Comando | Descripción |
|----------|--------------|
| `npm run dev` | Inicia el entorno de desarrollo web |
| `npm run build` | Compila la aplicación web |
| `npx expo start` | Inicia la app móvil |
| `npx supabase start` | Inicia Supabase localmente |
| `npx supabase db push` | Aplica migraciones a la base de datos |

---

## 🗺️ Roadmap

- [x] Arquitectura inicial (React + Supabase + Expo)  
- [ ] Sistema de progreso y analítica por tema  
- [ ] Panel administrativo (crear temas, preguntas, usuarios)  
- [ ] Integración con Stripe para membresías  
- [ ] Versión whitelabel multi-examen  

---

## 🧑‍💻 Contribuir

1. Forkea el repositorio  
2. Crea una rama nueva (`git checkout -b feature/nueva-funcionalidad`)  
3. Haz commit de tus cambios (`git commit -m "Agrega nueva funcionalidad"`)  
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)  
5. Crea un Pull Request 🎉  

## 🧾 Convenciones
- **Commits:** usa formato `tipo(scope): descripción` (ej. `feat(auth): agregar login con OTP`)
- **Branches:** usa prefijo `feature/`, `fix/`, `chore/`
- **Naming:** archivos y carpetas en kebab-case, componentes en PascalCase

---



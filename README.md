# 🧠 Repaso App

[![Build Status](https://github.com/emmanuel128/repaso-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/emmanuel128/repaso-app/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Plataforma educativa para repasar y prepararse para exámenes profesionales.  
Diseñada inicialmente para la **Revalida de Psicología en Puerto Rico**, pero construida con una arquitectura **whitelabel**, adaptable a otros exámenes como **Maestros, Abogados o College Board**.

---

## 🚀 Tech Stack

| Área | Tecnología |
|------|-------------|
| Frontend Web | [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TailwindCSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Mobile | [Expo](https://expo.dev/) (React Native) |
| Backend | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions) |
| CI/CD | [GitHub Actions](https://github.com/features/actions) |
| Infraestructura | [Vercel](https://vercel.com/) (Web) + [EAS](https://expo.dev/eas) (Mobile) |
| Lenguaje | TypeScript |

---

## 🧩 Estructura del Proyecto

```bash
repaso-app/
├── web/                # App web (React + Vite)
├── mobile/             # App móvil (Expo)
├── supabase/           # Migraciones, funciones y seeds de base de datos
├── .github/
│   └── workflows/      # CI/CD (build, test, deploy)
├── .env.example        # Variables de entorno
├── package.json
└── README.md
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
cd web
npm run dev
```

### 5️⃣ Ejecutar la app móvil
```bash
cd mobile
npx expo start
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

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.  
Consulta el archivo [LICENSE](./LICENSE) para más detalles.

---

> Desarrollado con ❤️ por el equipo de **Repaso App**  
> [repaso.app](https://repaso.app) _(sitio en construcción)_


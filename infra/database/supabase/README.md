# 🗄️ Supabase Backend (infra/database/supabase)

Este directorio contiene toda la infraestructura de base de datos y backend serverless para el monorepo Repaso App.

## Estructura

```
supabase/
├── config.toml           # Configuración de Supabase CLI y servicios locales
├── migrations/           # Migraciones SQL versionadas (estructura de la base de datos)
│   └── <timestamp>_init.sql
├── seeds/                # Seeds SQL para poblar datos iniciales
│   ├── 00_tenant_bootstrap.sql
│   └── ...
├── functions/            # Edge Functions (TypeScript/JS, serverless)
├── .branches/            # Estado local de migraciones (gitignore)
└── .temp/                # Archivos temporales de Supabase CLI (gitignore)
```

## Comandos útiles

- **Iniciar Supabase local:**
  ```bash
  npx supabase start
  ```
- **Aplicar migraciones:**
  ```bash
  npx supabase migration up
  ```
- **Resetear base de datos y aplicar seeds:**
  ```bash
  npx supabase db reset
  ```
- **Parar servicios locales:**
  ```bash
  npx supabase stop
  ```

## Notas
- Todas las migraciones y seeds deben estar en sus carpetas respectivas.
- Las Edge Functions van en `functions/` y se despliegan con Supabase CLI.
- Consulta la documentación principal del repo para detalles de integración y flujos de trabajo.

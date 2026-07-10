# WACRM - Enhanced WhatsApp CRM

## ✅ Funcionalidades Implementadas

### Características Principales

| Funcionalidad | Estado | Descripción |
|--------------|--------|-------------|
| 📱 **Chat WhatsApp** | ✅ | Mensajes en tiempo real vía API oficial de WhatsApp Business |
| 👥 **Gestión Contactos** | ✅ | CRUD completo + etiquetas + segmentación + importación CSV |
| 📊 **Campañas Masivas** | ✅ | Broadcasts con segmentación y tracking de entrega/lectura |
| 🎯 **Kanban Ventas** | ✅ | Pipeline drag & drop con valores monetarios |
| ⚡ **Respuestas Rápidas** | ✅ | Plantillas con atajos personalizables |
| ⏰ **Recordatorios** | ✅ | Sistema standalone con múltiples canales de notificación |
| 🕒 **Mensajes Programados** | ✅ | Envío automático individual y recurrente |
| 🔗 **WhatsApp Business API** | ✅ | Webhook integrado con Meta Cloud API |
| 🔐 **Autenticación JWT** | ✅ | Seguridad completa con Supabase Auth |
| 📈 **Dashboard** | ✅ | Métricas en tiempo real y analytics |
| 🤖 **Automatizaciones No-Code** | ✅ | Visual builder con triggers y acciones condicionales |
| 🧠 **Asistente AI** | ✅ | BYOK (OpenAI/Anthropic) con base de conocimiento |
| 👥 **Multi-tenant** | ✅ | Cuentas compartidas con roles (owner/admin/agent/viewer) |
| 🔔 **Notificaciones** | ✅ | Sistema integrado en tiempo real |
| 🌐 **API REST Pública** | ✅ | API v1 documentada con claves revocables |
| 🔌 **Servidor MCP** | ✅ | Integración con Claude, Cursor y asistentes AI |

### Nuevas Funcionalidades (Kodelr-inspired)

#### 🕒 Scheduler de Mensajes
- **Programación individual**: Agenda mensajes específicos para contactos
- **Soporte multimedia**: Imágenes, videos, audio, documentos, stickers
- **Recurrencia**: Patrones diarios, semanales, mensuales
- **Zonas horarias**: Soporte multi-timezone
- **Estados**: pending, sending, sent, failed, cancelled
- **Cancelación**: Cancela mensajes pendientes en cualquier momento

#### ⏰ Sistema de Recordatorios
- **Título y descripción**: Recordatorios detallados
- **Vinculación**: Asociar a contactos o conversaciones específicas
- **Prioridades**: low, medium, high, urgent con códigos de color
- **Múltiples notificaciones**: Push, email, WhatsApp
- **Estados**: pending, completed, dismissed, expired
- **Filtros**: Por estado y prioridad
- **Completar/Descartar**: Acciones rápidas desde la UI

## 🏗️ Arquitectura Técnica

### Backend
- **Framework**: Next.js 16 (App Router, Server Actions)
- **Base de Datos**: Supabase (PostgreSQL + Auth + Storage)
- **ORM**: Consultas directas con RLS (Row Level Security)
- **Autenticación**: Supabase Auth con JWT
- **WebSockets**: Suscripciones en tiempo real de Supabase
- **Encriptación**: AES-256-GCM para tokens sensibles

### Frontend
- **UI Framework**: React 19 + TypeScript
- **Componentes**: Tremor, shadcn/ui, Tailwind CSS v4
- **Estado**: React Hooks + Context API
- **Internacionalización**: next-intl
- **Notificaciones**: Sonner toast

### Base de Datos (36 migraciones)
```
001_initial_schema.sql              # Tablas base
002_pipelines_enhancements.sql      # Mejoras pipeline
006_automations.sql                 # Automatizaciones
010_flows.sql                       # Flujos visuales
017_account_sharing.sql             # Multi-tenant
026_api_keys.sql                    # API pública
027_notifications.sql               # Notificaciones
029-033_ai_*.sql                    # Asistente AI + Knowledge
035_interactive_messages.sql        # Mensajes interactivos
036_scheduler_and_reminders.sql     # ⭐ NUEVO: Scheduler + Reminders
```

### Nuevas Tablas (Migration 036)

#### `scheduled_messages`
```sql
- id, account_id, contact_id
- message_text, media_url, media_type
- scheduled_at, timezone
- status (pending/sending/sent/failed/cancelled)
- is_recurring, recurrence_pattern (JSONB)
- wamid, error_message
- created_by, created_at, updated_at
```

#### `reminders`
```sql
- id, account_id, contact_id, conversation_id
- title, description
- reminder_at, timezone
- status (pending/completed/dismissed/expired)
- priority (low/medium/high/urgent)
- color, notify_via_push/email/whatsapp
- completed_at, completed_by
- created_by, created_at, updated_at
```

## 📁 Estructura del Proyecto

```
wacrm/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/          # Métricas principales
│   │   │   ├── inbox/              # Bandeja compartida
│   │   │   ├── contacts/           # Gestión contactos
│   │   │   ├── pipelines/          # Kanban ventas
│   │   │   ├── broadcasts/         # Campañas masivas
│   │   │   ├── automations/        # Automatizaciones
│   │   │   ├── flows/              # Editor visual
│   │   │   ├── agents/             # Agentes AI
│   │   │   ├── notifications/      # Centro notificaciones
│   │   │   ├── scheduler/          # ⭐ NUEVO: Mensajes programados
│   │   │   ├── reminders/          # ⭐ NUEVO: Recordatorios
│   │   │   └── settings/           # Configuración
│   │   ├── api/                    # API REST v1 + webhooks
│   │   └── (auth)/                 # Login, registro, join
│   ├── components/
│   │   ├── layout/                 # Sidebar, header
│   │   ├── inbox/                  # Chat components
│   │   ├── contacts/               # Contact management
│   │   └── ...                     # Feature components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utilidades, auth, roles
│   └── types/                      # TypeScript types
├── supabase/
│   └── migrations/                 # 36 migraciones SQL
├── mcp-server/                     # Servidor MCP
├── messages/                       # i18n (en.json)
└── docs/                           # Documentación API, MCP
```

## 🚀 Quick Start

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/wacrm.git
cd wacrm

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar con tus credenciales de Supabase y Meta

# Ejecutar en desarrollo
npm run dev
```

Abrir http://localhost:3000

## 📊 Comparativa con Kodelr CRM

| Feature | WACRM | Kodelr | Ventaja |
|---------|-------|--------|---------|
| Chat WhatsApp | ✅ | ✅ | = |
| Contactos | ✅ + tags + custom fields | ✅ + etiquetas | WACRM |
| Campañas | ✅ + tracking avanzado | ✅ | WACRM |
| Kanban | ✅ + valor monetario | ✅ | = |
| Respuestas rápidas | ✅ | ✅ | = |
| Recordatorios | ✅ + multi-canal | ✅ | WACRM |
| Mensajes programados | ✅ + recurrencia | ✅ | WACRM |
| Automatizaciones | ✅ Visual builder | ❌ | **WACRM** |
| Asistente AI | ✅ BYOK + KB | ❌ | **WACRM** |
| Multi-tenant | ✅ 4 roles + RLS | ❌ | **WACRM** |
| API REST | ✅ v1 documentada | ❌ | **WACRM** |
| Servidor MCP | ✅ | ❌ | **WACRM** |
| Notificaciones | ✅ Integradas | ❌ | **WACRM** |
| Presencia agentes | ✅ Tiempo real | ❌ | **WACRM** |
| Mensajes interactivos | ✅ Botones/listas | ❌ | **WACRM** |

**Veredicto**: WACRM es superior en arquitectura (serverless, AI-first, MCP) y características avanzadas. Con la implementación de Scheduler y Reminders, cubre todas las funcionalidades básicas de Kodelr mientras mantiene ventajas competitivas significativas.

## 📖 Documentación

- [Getting Started](https://wacrm.tech/docs/getting-started)
- [Supabase Setup](https://wacrm.tech/docs/supabase-setup)
- [WhatsApp Setup](https://wacrm.tech/docs/whatsapp-setup)
- [Environment Variables](https://wacrm.tech/docs/environment-variables)
- [Deploy on Hostinger](https://wacrm.tech/docs/deployment-hostinger)
- [Architecture](https://wacrm.tech/docs/architecture)
- [Public API](./docs/public-api.md)
- [MCP Server](./docs/mcp.md)

## 🛠️ Stack Tecnológico

- **App**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Data**: Supabase (Postgres + Auth + Storage + RLS)
- **WhatsApp**: Meta Cloud API (WhatsApp Business oficial)
- **UI**: Tremor, shadcn/ui, Radix UI
- **i18n**: next-intl
- **Testing**: Vitest

## 📄 Licencia

[MIT](./LICENSE) - Fork it, brand it, host it.

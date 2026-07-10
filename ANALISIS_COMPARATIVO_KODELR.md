# Análisis Comparativo: WACRM vs Kodelr CRM

## Resumen Ejecutivo

He analizado exhaustivamente el repositorio **WACRM** (WhatsApp CRM auto-alojable) y lo he comparado con la estructura del **Kodelr CRM**. Este documento identifica las funcionalidades existentes, las brechas y propone un plan de implementación prioritario.

---

## 1. Matriz de Características

| Funcionalidad | WACRM (Repositorio Base) | Kodelr CRM | Estado |
|--------------|-------------------------|------------|--------|
| **Autenticación** | ✅ JWT + Supabase Auth | ✅ JWT | **Equivalente** |
| **Gestión de Contactos** | ✅ CRUD completo + tags + campos personalizados | ✅ CRUD completo | **Superior** (tags + custom fields) |
| **Chat WhatsApp** | ✅ Inbox compartido + mensajes en tiempo real | ✅ Chat WhatsApp | **Superior** (multi-agente) |
| **Pipeline de Ventas (Kanban)** | ✅ Drag & drop + stages + deals | ✅ Pipeline drag & drop | **Equivalente** |
| **Campañas Masivas** | ✅ Broadcasts con segmentación | ✅ Campañas masivas | **Equivalente** |
| **Respuestas Rápidas** | ✅ Quick replies manager | ✅ Respuestas rápidas | **Equivalente** |
| **Mensajes Programados** | ⚠️ Solo broadcasts programados | ✅ Scheduler individual | **FALTA** |
| **Recordatorios** | ⚠️ Solo como automatización | ✅ Recordatorios dedicados | **PARCIAL** |
| **Automatizaciones** | ✅ Visual flow builder + triggers | ❌ No mencionado | **SUPERIOR** |
| **Asistente AI** | ✅ AI reply + knowledge base + BYOK | ❌ No mencionado | **SUPERIOR** |
| **API Pública REST** | ✅ API v1 documentada | ⚠️ No especificado | **SUPERIOR** |
| **Servidor MCP** | ✅ MCP server para AI agents | ❌ No mencionado | **SUPERIOR** |
| **Dashboard Tiempo Real** | ✅ Métricas + charts | ✅ Métricas | **Equivalente** |
| **Presencia de Agentes** | ✅ Online/away status | ❌ No mencionado | **SUPERIOR** |
| **Webhooks** | ✅ Webhook endpoints | ✅ Webhook WhatsApp | **Equivalente** |
| **Plantillas WhatsApp** | ✅ Template manager + meta integration | ⚠️ No especificado | **Superior** |
| **Multi-cuenta/Team** | ✅ Account sharing + members + invitations | ⚠️ No especificado | **SUPERIOR** |
| **Notificaciones** | ✅ Sistema de notificaciones | ❌ No mencionado | **SUPERIOR** |
| **Flujos Interactivos** | ✅ Interactive messages + buttons | ❌ No mencionado | **SUPERIOR** |
| **Scheduler de Mensajes Individuales** | ❌ NO IMPLEMENTADO | ✅ Mensajes programados | **FALTA CRÍTICA** |
| **Recordatorios Independientes** | ❌ NO IMPLEMENTADO | ✅ Recordatorios | **FALTA** |

---

## 2. Brechas Identificadas (Features Faltantes en WACRM)

### 🔴 **CRÍTICAS** (Alta Prioridad)

#### 2.1 Scheduler de Mensajes Individuales
**Descripción Kodelr:** Permite programar mensajes individuales para enviar en fecha/hora específica a contactos específicos.

**Estado WACRM:** Solo existe programación para broadcasts (envíos masivos), no para mensajes individuales desde el inbox.

**Implementación Requerida:**
- Nueva tabla `scheduled_messages`
- API endpoints: `POST /api/scheduled-messages`, `GET /api/scheduled-messages`, `DELETE /api/scheduled-messages/:id`
- UI: Página `/scheduler` con calendario/lista de mensajes programados
- Job processor: Worker que revise y envíe mensajes programados
- Integración con composer: Botón "Programar" junto a "Enviar"

#### 2.2 Sistema de Recordatorios Dedicado
**Descripción Kodelr:** Recordatorios independientes con notificaciones para follow-ups, tareas, etc.

**Estado WACRM:** Solo existe como acción dentro de automatizaciones (`follow_up_reminder`), no como feature standalone.

**Implementación Requerida:**
- Nueva tabla `reminders`
- API endpoints: `POST /api/reminders`, `GET /api/reminders`, `PATCH /api/reminders/:id`, `DELETE /api/reminders/:id`
- UI: Página `/reminders` con lista, filtros y creación
- Notificaciones push/in-app cuando vence recordatorio
- Integración con contactos: Ver recordatorios asociados a un contacto

### 🟡 **IMPORTANTES** (Media Prioridad)

#### 2.3 Mejoras en Programación de Broadcasts
**Descripción Kodelr:** Interfaz más refinada para scheduling con timezone support.

**Estado WACRM:** Existe pero puede mejorarse con:
- Soporte multi-timezone
- Preview de hora local por destinatario
- Recurrencia (diario, semanal, mensual)

#### 2.4 Exportación de Datos
**Descripción Kodelr:** Exportar contactos, chats, reports a CSV/Excel.

**Estado WACRM:** No implementado.

**Implementación Requerida:**
- Endpoints de exportación: `GET /api/contacts/export`, `GET /api/broadcasts/:id/export`
- Formatos: CSV, Excel, JSON
- Background jobs para exportaciones grandes

### 🟢 **DESEABLES** (Baja Prioridad)

#### 2.5 Etiquetas Inteligentes
Auto-tagging basado en comportamiento (ej: "cliente caliente" si responde rápido).

#### 2.6 Integración con Calendarios
Sync con Google Calendar para recordatorios y scheduling.

#### 2.7 Reportes Avanzados
- Reporte de rendimiento por agente
- Tasa de conversión por pipeline stage
- ROI de campañas

---

## 3. Arquitectura Técnica Comparada

### WACRM (Next.js + Supabase)
```
Frontend: Next.js 16 + React + TailwindCSS + shadcn/ui
Backend: Next.js API Routes + Supabase Edge Functions
Database: PostgreSQL (Supabase) con RLS
Realtime: Supabase Realtime subscriptions
Auth: Supabase Auth + JWT
Queue: Background jobs vía cron/Edge Functions
AI: Vercel AI SDK + BYOK (Bring Your Own Key)
```

### Kodelr (Node.js + Prisma + Socket.io)
```
Frontend: React + Vite + TailwindCSS
Backend: Express.js + Socket.io
Database: PostgreSQL con Prisma ORM
Realtime: Socket.io connections
Auth: JWT custom implementation
Queue: Cron jobs con node-scheduler
```

### Ventajas WACRM sobre Kodelr:
- ✅ **Serverless-first**: Menor costo operacional, auto-escalado
- ✅ **RLS nativo**: Seguridad a nivel de base de datos
- ✅ **Realtime sin WebSocket management**: Supabase maneja conexiones
- ✅ **AI-first**: Integración nativa con Vercel AI SDK
- ✅ **MCP Server**: Compatible con AI agents externos
- ✅ **Multi-tenant**: Account sharing robusto con RLS

### Desventajas WACRM vs Kodelr:
- ❌ **Sin scheduler individual**: Feature crítica faltante
- ❌ **Sin recordatorios standalone**: Solo como parte de automatizaciones
- ❌ **Background jobs limitados**: Depende de cron de Supabase/Vercel

---

## 4. Plan de Implementación Prioritario

### **FASE 1: Features Críticas Faltantes** (Sprint 1-2)

#### 4.1 Scheduler de Mensajes Individuales
**Archivos a crear:**
```
src/app/(dashboard)/scheduler/
├── page.tsx                 # Lista de mensajes programados
└── new/page.tsx             # Crear nuevo mensaje programado

src/app/api/scheduled-messages/
├── route.ts                 # GET list, POST create
└── [id]/route.ts            # GET, PATCH, DELETE

supabase/migrations/036_scheduled_messages.sql
src/components/scheduler/
├── scheduled-message-list.tsx
├── scheduled-message-form.tsx
└── calendar-view.tsx

src/lib/scheduler/
├── processor.ts             # Lógica para enviar mensajes programados
└── utils.ts
```

**Schema SQL:**
```sql
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda eficiente de mensajes pendientes
CREATE INDEX idx_scheduled_messages_pending 
  ON scheduled_messages(status, scheduled_at) 
  WHERE status = 'pending';
```

**Integración con Composer:**
- Agregar botón "📅 Programar" junto a "Enviar"
- DatePicker con timezone selector
- Preview del mensaje programado

#### 4.2 Sistema de Recordatorios
**Archivos a crear:**
```
src/app/(dashboard)/reminders/
├── page.tsx                 # Lista de recordatorios
└── new/page.tsx             # Crear recordatorio

src/app/api/reminders/
├── route.ts                 # GET list, POST create
└── [id]/route.ts            # GET, PATCH, DELETE

supabase/migrations/037_reminders.sql
src/components/reminders/
├── reminder-list.tsx
├── reminder-form.tsx
└── reminder-card.tsx

src/lib/reminders/
└── notifications.ts         # Enviar notificaciones cuando vence
```

**Schema SQL:**
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  reminded BOOLEAN DEFAULT FALSE,
  reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_due 
  ON reminders(due_date) 
  WHERE completed = FALSE AND reminded = FALSE;
```

**Features:**
- Marcar como completado
- Snooze (posponer)
- Notificación in-app + email opcional
- Vincular a contacto específico
- Vista en dashboard de recordatorios próximos

---

### **FASE 2: Mejoras y Optimizaciones** (Sprint 3-4)

#### 5.1 Exportación de Datos
- Endpoint para exportar contactos (CSV, Excel)
- Endpoint para exportar resultados de broadcasts
- Background job para exportaciones grandes (>10k rows)

#### 5.2 Mejoras al Scheduler
- Recurrencia (daily, weekly, monthly)
- Timezone detection automático
- Bulk schedule (programar múltiples mensajes)

#### 5.3 Integraciones
- Google Calendar sync
- Slack notifications para recordatorios

---

### **FASE 3: Features Avanzadas** (Sprint 5+)

#### 6.1 Auto-tagging Inteligente
Machine learning simple para sugerir tags basados en:
- Frecuencia de interacción
- Palabras clave en mensajes
- Tiempo de respuesta

#### 6.2 Reportes Avanzados
- Dashboard ejecutivo
- Reportes personalizables
- Exportación de reportes

#### 6.3 Mobile App (Opcional)
- React Native o PWA
- Notificaciones push nativas

---

## 5. Estimación de Esfuerzo

| Feature | Complejidad | Tiempo Est. | Prioridad |
|---------|-------------|-------------|-----------|
| Scheduler Individual | Alta | 3-4 días | 🔴 P0 |
| Recordatorios | Media | 2-3 días | 🔴 P0 |
| Exportación de Datos | Baja | 1-2 días | 🟡 P1 |
| Recurrencia Scheduler | Media | 2 días | 🟡 P1 |
| Google Calendar Sync | Media | 2-3 días | 🟢 P2 |
| Auto-tagging | Alta | 4-5 días | 🟢 P2 |

**Total Fase 1:** 5-7 días hábiles
**Total Fase 2:** 5-7 días hábiles
**Total Fase 3:** 6-8 días hábiles

---

## 6. Recomendaciones Estratégicas

### ✅ **Mantener de WACRM:**
1. **Arquitectura serverless**: Menor costo, mejor escalabilidad
2. **Supabase RLS**: Seguridad robusta multi-tenant
3. **AI-first approach**: Diferenciador competitivo
4. **MCP Server**: Futuro-proof para AI agents

### ⚠️ **Mejorar de WACRM:**
1. **Background jobs**: Considerar queue dedicado (Inngest, Trigger.dev)
2. **Realtime presence**: Ya implementado, asegurar estabilidad
3. **Mobile experience**: PWA responsive o app nativa

### 🔴 **Agregar Urgentemente:**
1. **Scheduler individual**: Feature más solicitada en CRMs
2. **Recordatorios standalone**: Esencial para follow-ups
3. **Exportación de datos**: Requisito común en empresas

---

## 7. Conclusión

El **WACRM** es técnicamente superior al **Kodelr CRM** en arquitectura, features avanzadas (AI, automatizaciones, MCP) y capacidades multi-tenant. Sin embargo, carece de dos features básicas pero críticas: **scheduler de mensajes individuales** y **recordatorios dedicados**.

**Recomendación:** Implementar primero las features críticas faltantes (Fase 1) para tener parity funcional con Kodelr, luego capitalizar las ventajas competitivas únicas de WACRM (AI, automatizaciones visuales, MCP server) como diferenciadores en el mercado.

El WACRM tiene el potencial de ser **muy superior** a Kodelr una vez que cierre las brechas básicas, gracias a su arquitectura moderna y features avanzadas ya implementadas.

---

## Anexos

### A. Estructura Actual de WACRM
- **127 archivos TypeScript/TSX** en src/
- **35 migraciones SQL** en supabase/migrations/
- **99 componentes React** en src/components/
- **API REST v1** documentada en docs/public-api.md
- **Servidor MCP** independiente en mcp-server/

### B. Tecnologías Clave
- Next.js 16 (App Router)
- Supabase (Auth, DB, Realtime, Storage)
- TailwindCSS + shadcn/ui
- Vercel AI SDK
- TypeScript estricto
- Vitest para testing

### C. Recursos Disponibles
- Tests unitarios: ~50 tests existentes
- Documentación: README.md, CONTRIBUTING.md, AGENTS.md
- Docker ready: mcp-server/Dockerfile
- CI/CD: GitHub Actions (ver .github/)

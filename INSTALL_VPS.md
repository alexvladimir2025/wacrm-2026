# WACRM - WhatsApp CRM Auto-hospedable
## Instalación en VPS Cloud

WACRM es un CRM completo para WhatsApp con automatizaciones visuales, asistente AI, API REST y servidor MCP.

### 📋 Requisitos Previos

- **Docker** y **Docker Compose** instalados
- **Node.js 20+** (para desarrollo local)
- Cuenta en **Supabase** (gratuita o self-hosted)
- **WhatsApp Business API** (vía Meta o proveedor como Twilio/360dialog)
- Mínimo 2GB RAM y 20GB disco en el VPS

---

## 🚀 Instalación Rápida (Producción)

### Paso 1: Clonar y Configurar

```bash
# Clonar repositorio
git clone <TU_REPOSITORIO> wacrm
cd wacrm

# Copiar variables de entorno
cp .env.example .env
```

### Paso 2: Configurar Variables de Entorno

Edita `.env` con tus credenciales:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# WhatsApp (elige tu proveedor)
WHATSAPP_MODE=cloud # o 'onpremise'
META_APP_ID=tu-app-id
META_APP_SECRET=tu-app-secret
META_VERIFY_TOKEN=tu-verify-token

# Autenticación
NEXTAUTH_SECRET=genera-uno-seguro-con-openssl-rand-base64-32
NEXTAUTH_URL=https://tudominio.com

# Redis (opcional para colas)
REDIS_URL=redis://localhost:6379

# AI (opcional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Paso 3: Despliegue con Docker

```bash
# Construir e iniciar contenedores
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

El sistema estará disponible en `http://localhost:3000` o `https://tudominio.com` si configuras nginx.

---

## 🔧 Configuración de Base de Datos

### Opción A: Supabase Cloud (Recomendado)

1. Crea proyecto en [supabase.com](https://supabase.com)
2. Ve al SQL Editor y ejecuta las migraciones en orden:
   ```bash
   # Las migraciones están en supabase/migrations/
   # Ejecuta cada archivo 001_*.sql hasta 036_*.sql
   ```
3. Copia las credenciales en `.env`

### Opción B: Supabase Self-Hosted

```bash
# Clonar Supabase
git clone https://github.com/supabase/supabase
cd supabase/docker

# Configurar y ejecutar
cp .env.example .env
docker-compose up -d
```

Luego apunta `NEXT_PUBLIC_SUPABASE_URL` a tu instancia local.

---

## 📱 Configuración de WhatsApp

### WhatsApp Cloud API (Meta)

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una app tipo "Business"
3. Añade producto "WhatsApp"
4. Configura webhook en:
   ```
   https://tudominio.com/api/v1/whatsapp/webhook
   ```
5. Token de verificación: el que definiste en `META_VERIFY_TOKEN`
6. Suscríbete a los campos: `messages`, `message_deliveries`, `message_reads`

### Webhook Handler

El endpoint `/api/v1/whatsapp/webhook` ya está implementado y maneja:
- ✅ Mensajes entrantes
- ✅ Estados de entrega (leído, enviado, fallido)
- ✅ Respuestas automáticas
- ✅ Actualización de contactos

---

## 🔐 Primer Acceso

1. Abre `https://tudominio.com/register`
2. Crea tu cuenta de administrador
3. Verifica tu email (si configuraste SMTP)
4. Accede al dashboard en `/dashboard`

---

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Detener todo
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs de un servicio específico
docker-compose logs -f web
docker-compose logs -f worker
docker-compose logs -f redis

# Reconstruir después de cambios
docker-compose up -d --build
```

### Base de Datos

```bash
# Backup de Supabase (si es self-hosted)
docker exec supabase-db pg_dump -U postgres > backup.sql

# Restaurar backup
docker exec -i supabase-db psql -U postgres < backup.sql
```

### Logs y Monitoreo

```bash
# Logs en tiempo real
docker-compose logs -f

# Estadísticas de recursos
docker stats
```

---

## 📊 Estructura de Archivos

```
wacrm/
├── backend/                 # API Node.js (si usas backend separado)
├── frontend/                # Next.js app
├── supabase/
│   ├── migrations/          # Scripts SQL
│   └── seed.sql             # Datos iniciales
├── docker-compose.yml       # Orquestación Docker
├── Dockerfile               # Imagen de producción
├── nginx.conf               # Configuración reverse proxy
├── .env.example             # Plantilla de variables
└── README.md                # Esta documentación
```

---

## 🔒 Seguridad

### Firewall (UFW)

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com

# Renovación automática (ya configurada)
sudo certbot renew --dry-run
```

### Hardening Adicional

1. Cambia `NEXTAUTH_SECRET` regularmente
2. Usa contraseñas fuertes en Supabase
3. Habilita 2FA en tu cuenta de administrador
4. Limita acceso a la BD por IP
5. Revisa logs periódicamente

---

## 🔄 Actualizaciones

```bash
# Actualizar código
git pull origin main

# Reconstruir contenedores
docker-compose up -d --build

# Ejecutar nuevas migraciones (si las hay)
# Conéctate a Supabase y ejecuta los nuevos scripts SQL
```

---

## 🆘 Solución de Problemas

### El contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs web

# Verificar variables de entorno
docker-compose config
```

### Error de conexión a Supabase

1. Verifica que las URLs en `.env` sean correctas
2. Asegúrate de que las migraciones se ejecutaron
3. Revisa que el firewall permita salida a internet

### WhatsApp no recibe mensajes

1. Verifica que el webhook esté accesible desde internet
2. Revisa que `META_VERIFY_TOKEN` coincida
3. Comprueba los logs del worker: `docker-compose logs worker`

### Errores de memoria

```bash
# Aumentar límite en docker-compose.yml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 📞 Soporte

- **Documentación completa**: `/docs`
- **API Reference**: `https://tudominio.com/api/v1/docs`
- **GitHub Issues**: Reporta bugs aquí
- **Discord**: Únete a nuestra comunidad

---

## 📄 Licencia

MIT License - Ver LICENSE para más detalles.

---

**¡Listo! Tu WACRM está funcionando.** 🎉

Accede a `https://tudominio.com` y comienza a gestionar tus clientes de WhatsApp.

# 🏛️ JANUS MONITOR CORE - PROJECT MASTER PLAN

**Estado:** Finalizando Módulo Clientes (Detalle)
**Versión:** 2.7 (Planificación de Soporte y Comunicaciones)

---

## ✅ HITOS COMPLETADOS

- [x] **Core:** Auth, Roles (Super Admin/Admin), Navegación Segura.
- [x] **Organizaciones:** Gestión de Gastos, Ingresos, Activos (Dominios), Equipo.
- [x] **Clientes (Fase 1):** Listado, Creación, Detalle Básico.
- [x] **Dominios Unificados:** Tabla `domains_master` integrada en Org y Clientes.

---

## 📅 HOJA DE RUTA ACTUALIZADA

### FASE 3: COMUNICACIONES Y CORREOS (Prioridad Inmediata)

_Objetivo: Centralizar la gestión de correos corporativos de clientes y organizaciones._

- [ ] **Base de Datos:** Crear tabla unificada `corporate_emails` (similar a `domains_master`).
  - Campos: `email`, `password` (encriptada), `provider` (Zoho, InMotion), `linked_gmail` (Redirección), `cost`, `client_id` (nullable).
- [ ] **Vista Global:** `/dashboard/emails` (Super Admin ve Tabs Arknica/Rueda; Admin ve su lista).
- [ ] **Integración Cliente:** Pestaña "Correos" dentro del Detalle de Cliente.
- [ ] **Refactorización Org:** Actualizar la pestaña actual de "Correos" en Organización para usar esta nueva tabla maestra.

### FASE 4: INFRAESTRUCTURA Y MIGRACIÓN

- [ ] **Stack Tecnológico:** Agregar campo `tech_stack` al Cliente (WordPress/InMotion vs Code/Vercel) para planear migraciones.
- [ ] **Visualización:** Indicadores visuales en el perfil del cliente sobre su estado tecnológico.

### FASE 5: MÓDULO DE TICKETS (SOPORTE INTELIGENTE)

_Lógica de Negocio Compleja:_

- [ ] **Base de Datos:** Tabla `tickets` y `social_credentials`.
- [ ] **Regla de Oro:** "2 Tickets Gratis al Año" (Vinculado a fecha renovación dominio).
- [ ] **Tipos de Ticket:**
  - **Web:** Requiere dominio activo. Mantenimiento, Cambios.
  - **Social Media:** Independiente del dominio. Post, Video, Banner.
- [ ] **Flujo:** Pendiente -> En Proceso -> Aprobado -> Finalizado (Req. Link evidencia).
- [ ] **Vista Global:** Bandeja de entrada de soporte unificada.

### FASE 6: GESTIÓN DE REDES SOCIALES (Rol Social Agent)

- [ ] **Credenciales:** Guardar accesos (User, Pass, Link Perfil) por cliente.
- [ ] **Vinculación:** Conectar con módulo de Tickets para asignación de tareas de diseño/posteo.

---

## 📝 REGLAS DE SEGURIDAD (Recordatorio Constante)

1.  **DELETE:** Solo Super Admin puede eliminar (Dominios, Correos, Clientes, Tickets).
2.  **VISIBILIDAD:** Admins solo ven datos de su Organización.
3.  **DUPLICIDAD:** Nombres de clientes únicos por organización.

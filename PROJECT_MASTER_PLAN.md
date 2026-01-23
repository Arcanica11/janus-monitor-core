# 🏛️ JANUS MONITOR CORE - PROJECT MASTER PLAN

**Estado:** Construcción de Módulos Core (Clientes)
**Versión:** 2.6 (Clientes con Trazabilidad)
**Líder Técnico:** Ivan Parra

---

## 🎯 Objetivo Inmediato

Construir la **Vista de Listado de Clientes** (`/dashboard/clients`), asegurando que la información sensible (quién creó al cliente) sea visible solo para roles autorizados y aplicando los permisos de edición/borrado.

---

## ✅ HITOS COMPLETADOS (Día 2)

### 1. Estabilización & Hard Reset

- [x] Limpieza total de Base de Datos (Script ejecutado).
- [x] Fix: Usuarios creados ahora heredan correctamente `organization_id`.
- [x] Fix: Login limpio (sin alertas falsas) y con Spinner de carga.
- [x] Fix: Navegación Segura (Admins redirigidos a su Org, Super Admin ve todo).

### 2. Módulo de Clientes (Fase 1: Creación)

- [x] **Base de Datos:** Schema actualizado con campos de contacto (`phone`, `address`) y auditoría (`created_by`).
- [x] **Backend:** Server Action `createClient` guarda huella de creador y genera Audit Log.
- [x] **Frontend:** Diálogo de creación optimizado con "Hint" de UX para datos opcionales.
- [x] **Seguridad:** RLS configurado para inserción multi-rol.

---

## 📅 HOJA DE RUTA SIGUIENTE (Fase 2: Gestión de Clientes)

### 1. 📋 Visualización (Listado)

- [ ] **Tabla de Clientes:** Implementar `ClientsTable.tsx`.
  - Columnas: Empresa, Contacto (Nombre/Email), Servicios Activos (Contador), Estado.
  - **Columna Especial "Creado Por":** Visible SOLO para Super Admin (muestra avatar/email del creador).
- [ ] **Filtros:** Búsqueda por nombre de empresa.

### 2. 🛡️ Acciones & Permisos (RBAC)

- [ ] **Editar:** Permitido para Admin y Super Admin.
- [ ] **Eliminar:** EXCLUSIVO para Super Admin (Botón oculto para los demás).
- [ ] **Detalle:** Al hacer clic en un cliente, ir a `/dashboard/clients/[id]` (Vista detallada futura).

### 3. 🔗 Integración

- [ ] Conectar Clientes con Dominios (Asignar dominios de `domains_master` a un cliente específico).

---

## 📝 Notas de Calidad

- **UX:** Mantener el estándar de Shadcn en la tabla (Sortable headers, Pagination).
- **Seguridad:** Verificar siempre `organization_id` en las consultas de listado (`select * from clients where organization_id = ...`).

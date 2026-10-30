# Dispersión de Pagos Masivos

Sistema completo de dispersión masiva de pagos a beneficiarios (proveedores, freelancers, empleados).
Compuesto por una API desarrollada en **NestJS**, un frontend en **React (Vite)** y persistencia en **Supabase (PostgreSQL)**.

---

## Estructura del Proyecto

```text
dispersion-pagos/
├── api/          # Backend NestJS (TypeScript, DTOs con class-validator, Supabase Client)
├── web/          # Frontend React + Vite (React Router, validación de formularios, UI responsiva)
├── supabase/     # Scripts SQL y esquema de base de datos
└── README.md     # Documentación del proyecto
```

---

## Requisitos Previos

- **Node.js** v20 o superior
- **npm** v10 o superior
- Proyecto activo en [Supabase](https://supabase.com)

---

## 1. Configuración de Base de Datos (Supabase)

1. Ingresa a tu proyecto en el panel de [Supabase](https://supabase.com).
2. Ve al **SQL Editor**.
3. Copia y ejecuta el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql):
   - Crea las tablas `beneficiaries`, `disbursement_batches` y `disbursement_items`.
   - Configura las claves primarias (`UUID`), restricciones de unicidad (`document_id` único, `(batch_id, beneficiary_id)` único) y tipos monetarios `numeric(12,2)`.

---

## 2. Configuración y Ejecución del Backend (`/api`)

### Variables de entorno

Copia el archivo de plantilla a `.env`:

```bash
cd api
cp .env.example .env
```

Edita `.env` con las credenciales de tu proyecto Supabase:

```env
PORT=3000
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_secreta
```

> **IMPORTANTE DE SEGURIDAD**: La `service_role key` de Supabase tiene privilegios administrativos y debe residir **únicamente en el backend** (`api/.env`). Nunca se incluye en el frontend ni en el control de versiones Git.

### Instalación y arranque

```bash
cd api
npm install
npm run start:dev
```

La API estará disponible en `http://localhost:3000`.

### Pruebas unitarias

Para ejecutar la suite de pruebas unitarias:

```bash
npm run test
```

---

## 3. Configuración y Ejecución del Frontend (`/web`)

### Variables de entorno (Opcional)

Por defecto, Vite incluye un proxy inverso que redirige las peticiones `/api/*` a `http://localhost:3000/*`. Si deseas especificar una URL base diferente:

```bash
cd web
cp .env.example .env
```

Contenido de `.env`:
```env
VITE_API_URL=/api
```

### Instalación y arranque

```bash
cd web
npm install
npm run dev
```

La aplicación web estará disponible en `http://localhost:5173`.

---

## Reglas de Negocio Implementadas

1. **Gestión de Beneficiarios**:
   - Campos obligatorios: Nombre, Documento (`document_id`), Banco, Número de cuenta. Correo es opcional.
   - Si se intenta registrar un documento ya existente, la API responde HTTP `409 Conflict` y la interfaz lo reporta con claridad.
2. **Lotes e Ítems**:
   - Montos calculados y almacenados con precisión exacta en centavos (`numeric(12,2)`), evitando redondeos flotantes.
   - El total del lote (`total_amount`) lo recalcula y persiste el servidor en cada adición o eliminación de ítems.
   - No se permite incluir dos veces al mismo beneficiario en un mismo lote (responde HTTP `409 Conflict`).
   - Montos menores o iguales a cero son rechazados con HTTP `400 Bad Request`.
3. **Bloqueo de Lotes Procesados**:
   - Una vez procesado un lote (estado distinto de `DRAFT`), no se pueden agregar ni eliminar pagos. Los botones correspondientes quedan ocultos en el frontend.
   - Procesar un lote ya procesado responde HTTP `400 Bad Request`.
4. **Simulación de Dispersión**:
   - Un ítem pasa a `PAID`, salvo que su monto sea mayor a 5,000, en cuyo caso pasa a `FAILED` con `failure_reason = "Monto excede el límite permitido"`.
   - El lote queda en:
     - `COMPLETED`: Todos los pagos aprobados (`PAID`).
     - `PARTIAL`: Mezcla de pagos aprobados y fallidos.
     - `FAILED`: Todos los pagos fallidos (`FAILED`).
   - Tras procesar, la vista actualiza el estado y los resultados inmediatamente sin recargar la página.

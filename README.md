# Piso Cero - Cafe & Resto-Bar

# SPEC.md - Sistema de Gestión para Resto-Bar/Confitería

## 1. Project Overview

**Nombre del Proyecto:** Piso Cero - Sistema de Gestión para Resto-Bar

**Tipo de Aplicación:** Sistema web completo con doble rol (Admin/Cliente)

**Funcionalidad Principal:** Plataforma integral para gestión de pedidos, inventario, contabilidad y atención al cliente mediante código QR por mesa.

**Usuarios Objetivo:**
- Administrador/Dueño del local
- Clientes del restobar

---

## 2. Architecture

### Stack Tecnológico
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Base de Datos:** SQLite (para simplicidad) / PostgreSQL (producción)
- **Tiempo Real:** Socket.io
- **Autenticación:** JWT con Google OAuth opcional
- **QR Generation:** qrcode library
- **Pagos:** Integración con MercadoPago (simulado)

### Estructura del Proyecto
```
/Piso0
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── socket/
│   └── package.json
└── README.md
```

## 4. Functionality Specification

### 4.1 MODO ADMINISTRADOR

#### Authentication
- Login con email/contraseña
- Panel de control separado del panel cliente

#### Gestión de Productos (ABM)
- **Alta:** Formulario para crear nuevo producto con nombre, descripción, precio, categoría, stock, imagen
- **Baja:** Eliminación lógica (soft delete) de productos
- **Modificación:** Editar cualquier campo del producto
- **Listado:** Tabla con filtros por categoría, búsqueda, ordenamiento
- **Stock:** Alertas visuales cuando stock < stockMinimo

#### Gestión de Mesas
- Crear mesas con número y capacidad
- Generar código QR único por mesa
- Visualizar estado de mesas (libre/ocupada)
- Eliminar mesas

#### Gestión de Pedidos (Comanda)
- Ver pedidos en tiempo real por mesa
- Cambiar estado del pedido (pendiente → preparando → listo → entregado)
- Notificaciones en tiempo real
- Historial de pedidos por fecha

#### Contabilidad
- **Ingresos:** Registrados automáticamente por pedidos pagados
- **Gastos:** Registro manual de gastos (insumos, servicios, etc.)
- **Reportes:** Resumen diario/semanal/mensual
- **Gráficos:** Visualización de ingresos vs gastos

#### Dashboard
- Pedidos activos
- Mesas ocupadas
- Stock bajo
- Ingresos del día

### 4.2 MODO CLIENTE

#### Autenticación
- Registro con email/contraseña
- Login con Google (OAuth)
- Login con email/contraseña

#### Flujo del Cliente
1. **Escanear QR:** El QR contiene el ID de la mesa
2. **Identificación:** Login/registro si no está autenticado
3. **Menú:** Ver productos por categorías
4. **Armar Pedido:** Seleccionar productos, cantidad, notas
5. **Enviar Pedido:** Se envía a la comanda
6. **Seguir Pedido:** Ver estado en tiempo real
7. **Pago:** Seleccionar método de pago
8. **Solicitar Mozo:** Botón para llamar al mozo

#### Métodos de Pago Soportados
- Efectivo
- Tarjeta de crédito/débito
- MercadoPago (QR)
- Transferencia


## 8. Acceptance Criteria

### Admin
- [ ] Puede iniciar sesión
- [ ] Puede crear productos con todos los campos
- [ ] Puede modificar productos existentes
- [ ] Puede eliminar productos
- [ ] Puede ver alertas de stock bajo
- [ ] Puede crear mesas y generar QR
- [ ] Puede ver pedidos en tiempo real
- [ ] Puede cambiar estado de pedidos
- [ ] Puede registrar gastos
- [ ] Puede ver resumen de ingresos/gastos

### Cliente
- [ ] Puede escanear QR y acceder a la mesa
- [ ] Puede registrarse e iniciar sesión
- [ ] Puede iniciar sesión con Google
- [ ] Puede ver el menú por categorías
- [ ] Puede agregar productos al pedido
- [ ] Puede enviar el pedido
- [ ] Puede ver el estado de su pedido
- [ ] Puede seleccionar método de pago
- [ ] Puede solicitar mozo

### General
- [ ] Los pedidos aparecen en tiempo real en la comanda
- [ ] El stock se descuenta al confirmar pedido
- [ ] Los ingresos se registran automáticamente
- [ ] La aplicación es responsive


# Documento de Contexto de Desarrollo: Proyecto Doty

## 1. Vision General del Producto

Doty es una plataforma de gestion de comunidades y eventos basada en geolocalizacion. Originalmente concebida para el ecosistema deportivo (encuentros casuales y torneos), la aplicacion esta evolucionando hacia un **Marketplace de Eventos Sociales y Deportivos**.

El objetivo principal es eliminar la friccion en la organizacion de eventos que actualmente ocurren de forma fragmentada en redes sociales (Instagram/WhatsApp), centralizando el descubrimiento, el pago y la gestion de acceso en una sola interfaz.

## 2. El Concepto de "Evento Universal"

Para el desarrollo, trataremos tanto los partidos deportivos como las fiestas/eventos sociales bajo una misma entidad logica: **El Evento**.

### Atributos Clave del Evento:

- **Tipo:** Deportivo / Social / Torneo
- **Modalidad de Acceso:** Gratuito / De Pago
- **Ubicacion:** Coordenadas GPS para visualizacion en mapa y direccion textual
- **Capacidad:** Cupos limitados con lista de reserva
- **Gestion de Admision:** Filtro de "Solicitud de Union" (el organizador aprueba quien entra) o "Acceso Directo"

## 3. Modulos Core (Estructura Logica)

### A. Modulo de Descubrimiento (Exploracion)

- **Vista de Mapa:** Integracion con API de mapas para mostrar pines de eventos cercanos. Los iconos deben diferenciar visualmente entre un partido de futbol y una fiesta.
- **Vista de Listado:** Filtros por categoria, fecha, precio y distancia.

### B. Modulo de Registro y Transaccional

- **Pasarela de Pagos:** Sustitucion de las transferencias manuales por un sistema integrado. El organizador define el costo.
- **Checkout:** Manejo de estados (Pendiente, Pagado, Cancelado).
- **Validacion de Entrada:** Generacion de un identificador unico (o QR) para que el organizador gestione el acceso en la puerta del evento/partido.

### C. Modulo de Organizacion (Dashboard del Host)

- **Gestion de Participantes:** Listado en tiempo real de usuarios inscritos.
- **Panel de Aprobacion:** Para eventos privados o con filtro, el organizador puede revisar el perfil del usuario antes de aceptarlo.
- **Comunicacion:** Chat grupal efimero por evento para coordinar detalles de ultimo minuto.

## 4. Casos de Uso Comparativos

| Caracteristica    | Caso Deportivo (Original)              | Caso Social (Nuevo)                         |
| ----------------- | -------------------------------------- | ------------------------------------------- |
| Evento            | Partido de Futbol 7                    | Fiesta Universitaria "Ingenieria"           |
| Organizador       | Capitan del equipo / Dueno de cancha   | Sociedad de alumnos / Promotor              |
| Pago              | Cooperacion para renta de cancha       | Cover de entrada / Preventa                 |
| Control de Acceso | Lista de jugadores en cancha           | Lista de invitados en puerta                |
| Proposito         | Completar los equipos                  | Venta de boletos y control de aforo         |

## 5. Requerimientos Tecnicos para la IA

Al trabajar en el codigo, la IA debe considerar:

- **Escalabilidad de Tipos:** El esquema de base de datos debe ser flexible (JSON fields o tablas relacionales polimorficas) para anadir nuevos tipos de eventos en el futuro sin redisenar la DB.
- **Seguridad:** Validacion de identidad para evitar perfiles falsos en eventos sociales.
- **UI/UX Adaptativa:** La interfaz debe cambiar sutilmente su estetica segun el tipo de evento (colores deportivos vs. colores nocturnos/sociales) manteniendo la misma estructura de navegacion.

## 6. Flujo de Usuario Simplificado

1. **Publicacion:** El organizador crea el evento -> Define si es deporte o fiesta -> Setea precio y ubicacion.
2. **Descubrimiento:** El usuario ve el pin en el mapa -> Revisa detalles y perfiles de otros asistentes.
3. **Conversion:** El usuario paga/se inscribe -> Recibe confirmacion y acceso al chat.
4. **Ejecucion:** El dia del evento, el organizador valida al usuario mediante la app.

## 7. Modelo de Datos (Entidad-Relacion)

### Enums

- **EventType:** `sports` | `social` | `tournament`
- **AccessMode:** `free` | `paid`
- **AdmissionType:** `direct` | `request`
- **EventStatus:** `draft` | `published` | `cancelled` | `completed`
- **RegistrationStatus:** `pending` | `approved` | `rejected` | `waitlisted` | `cancelled`
- **PaymentStatus:** `pending` | `paid` | `cancelled` | `refunded`

### Entidades

**User**
- `id` (PK, UUID), `phone` (UQ, string - campo principal de registro), `email` (string, nullable), `firstName`, `lastName`, `avatarUrl` (nullable), `isVerified` (boolean), `passwordHash`, `createdAt`, `updatedAt`
- Nota: El registro se maneja por numero de telefono. El email es opcional por ahora.

**Event** (Evento Universal)
- `id` (PK, UUID), `organizerId` (FK → User), `title`, `description`, `type` (EventType), `accessMode` (AccessMode), `admissionType` (AdmissionType), `price` (nullable), `currency` (nullable), `latitude`, `longitude`, `address`, `capacity`, `waitlistEnabled`, `startsAt`, `endsAt`, `status` (EventStatus), `metadata` (JSON, nullable), `createdAt`, `updatedAt`
- `metadata`: Campo flexible para atributos por tipo (ej: `{ sport: "futbol7", teamSize: 7 }` o `{ dressCode: "formal", minAge: 18 }`).

**EventRegistration** (Inscripcion / Solicitud de Union)
- `id` (PK, UUID), `eventId` (FK → Event), `userId` (FK → User), `status` (RegistrationStatus), `registeredAt`, `resolvedAt` (nullable)

**Payment** (Transaccion)
- `id` (PK, UUID), `registrationId` (FK → EventRegistration), `userId` (FK → User), `eventId` (FK → Event), `amount`, `currency`, `status` (PaymentStatus), `paymentMethod` (nullable), `transactionRef` (nullable), `paidAt` (nullable), `createdAt`
- `userId` y `eventId` desnormalizados para consultas directas sin joins.

**Ticket** (Validacion de Entrada / QR)
- `id` (PK, UUID), `registrationId` (FK → EventRegistration), `code` (UQ), `isUsed`, `usedAt` (nullable), `createdAt`

### Diagrama ER

```
┌──────────────────┐
│      USER        │
├──────────────────┤
│ id          (PK) │
│ phone       (UQ) │──── Campo principal de registro
│ email            │
│ firstName        │
│ lastName         │
│ avatarUrl        │
│ isVerified       │
│ passwordHash     │
│ createdAt        │
│ updatedAt        │
└──────┬───────────┘
       │
       │ 1:N (organizer)              1:N (user)
       ├───────────────────┐───────────────────────┐
       ▼                   ▼                       │
┌──────────────────┐  ┌────────────────────┐       │
│     EVENT        │  │ EVENT_REGISTRATION │       │
├──────────────────┤  ├────────────────────┤       │
│ id          (PK) │  │ id            (PK) │       │
│ organizerId (FK)─┤  │ eventId       (FK)─┤       │
│ title            │  │ userId        (FK)─┼───────┘
│ description      │  │ status             │
│ type        (EN) │  │ registeredAt       │
│ accessMode  (EN) │  │ resolvedAt         │
│ admissionType(EN)│  └────────┬───────────┘
│ price            │           │
│ currency         │           │ 1:1 (opcional)
│ latitude         │           ├───────────────────┐
│ longitude        │           ▼                   ▼
│ address          │  ┌──────────────────┐  ┌──────────────────┐
│ capacity         │  │    PAYMENT       │  │     TICKET       │
│ waitlistEnabled  │  ├──────────────────┤  ├──────────────────┤
│ startsAt         │  │ id          (PK) │  │ id          (PK) │
│ endsAt           │  │ registrationId(FK)│  │ registrationId(FK)│
│ status      (EN) │  │ userId      (FK) │  │ code        (UQ) │
│ metadata   (JSON)│  │ eventId     (FK) │  │ isUsed           │
│ createdAt        │  │ amount           │  │ usedAt           │
│ updatedAt        │  │ currency         │  │ createdAt        │
└──────────────────┘  │ status      (EN) │  └──────────────────┘
                      │ paymentMethod    │
                      │ transactionRef   │
                      │ paidAt           │
                      │ createdAt        │
                      └──────────────────┘
```

### Relaciones

| Relacion | Tipo | Descripcion |
|---|---|---|
| User → Event | 1:N | Un usuario organiza muchos eventos |
| User → EventRegistration | 1:N | Un usuario se inscribe a muchos eventos |
| Event → EventRegistration | 1:N | Un evento tiene muchos inscritos |
| EventRegistration → Payment | 1:1 | Cada inscripcion tiene un pago (si es evento de pago) |
| EventRegistration → Ticket | 1:1 | Cada inscripcion aprobada genera un ticket |

### Indices recomendados

- `Event(type)`, `Event(status)`, `Event(latitude, longitude)` (espacial)
- `EventRegistration(eventId, status)` (compuesto)
- `Ticket(code)`
- `User(phone)`

### Nota: Modulo de mensajeria (ChatMessage) pendiente para fase futura.

## 8. Skills y Buenas Practicas

Antes de escribir o modificar codigo, **siempre** consultar las skills definidas en la carpeta `.agents/` en la raiz del proyecto. Estas contienen reglas y convenciones que deben respetarse en todo momento. En particular, `.agents/skills/nestjs-best-practices/rules/` contiene reglas sobre arquitectura, base de datos, seguridad, testing, performance, inyeccion de dependencias, manejo de errores y microservicios que son de cumplimiento obligatorio.

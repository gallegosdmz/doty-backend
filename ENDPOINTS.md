# Doty API — Guia de Integracion para Cliente Mobile (React Native / Expo)

Base URL: `http://<host>:3000`

Autenticacion: Bearer JWT en header `Authorization: Bearer <token>`.
Los endpoints marcados como **AUTH** requieren este header. Los marcados como **PUBLIC** no.

Todas las respuestas de error siguen el formato:
```json
{ "statusCode": 400, "message": "Descripcion del error", "error": "BadRequest" }
```

Validacion global activa: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Si envias propiedades no declaradas en el DTO, el backend las rechaza con 400.

---

## Enums

Usarlos exactamente como strings en los requests:

```
EventType:          "sports" | "social" | "tournament"
AccessMode:         "free" | "paid"
AdmissionType:      "direct" | "request"
EventStatus:        "draft" | "published" | "cancelled" | "completed"
RegistrationStatus: "pending" | "approved" | "rejected" | "waitlisted" | "cancelled"
PaymentStatus:      "pending" | "paid" | "cancelled" | "refunded"
```

---

## Fase 1 — Autenticacion

### 1. POST /auth/register — PUBLIC

Registra un usuario nuevo. Retorna datos del usuario + JWT.

**Request body:**
```json
{
  "firstName": "string (max 100, required)",
  "lastName": "string (max 100, required)",
  "phone": "string (formato mexicano +52XXXXXXXXXX, required)",
  "password": "string (min 8, max 50, required)",
  "email": "string (email valido, optional)",
  "avatarUrl": "string (optional)"
}
```

**Response 201:**
```json
{
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan@test.com",
  "phone": "+5211234567890",
  "isVerified": false,
  "isPhoneVerified": false,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errores:** 400 si el telefono ya esta registrado.

**Logica:** El telefono es el identificador principal (no el email). Despues del registro el usuario NO esta verificado. Se debe llamar send-otp para verificar el telefono.

---

### 2. POST /auth/login — PUBLIC

Inicia sesion con telefono + password.

**Request body:**
```json
{
  "phone": "string (formato mexicano +52XXXXXXXXXX, required)",
  "password": "string (min 8, max 50, required)"
}
```

**Response 201:**
```json
{
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan@test.com",
  "phone": "+5211234567890",
  "isVerified": false,
  "isPhoneVerified": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errores:** 401 si el telefono no existe o la password es incorrecta. 401 si la cuenta esta eliminada (soft delete).

**Logica:** Guardar el `token` en almacenamiento seguro (SecureStore en Expo). Usarlo en el header Authorization de todas las peticiones autenticadas. Los campos `isVerified` e `isPhoneVerified` se usan para mostrar badges o bloquear funcionalidad en el frontend.

---

### 3. GET /auth/refresh — AUTH

Refresca el token JWT. Llamar al abrir la app si hay token guardado.

**Request:** Solo el header Authorization.

**Response 200:**
```json
{
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan@test.com",
  "phone": "+5211234567890",
  "isVerified": false,
  "isPhoneVerified": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errores:** 401 si el token es invalido o expiro.

**Logica:** Usar este endpoint para validar si la sesion sigue activa al abrir la app. Si retorna 401, redirigir a login. El token retornado reemplaza al anterior.

---

### 4. POST /auth/send-otp — PUBLIC

Envia un codigo OTP por SMS al telefono indicado via Twilio.

**Request body:**
```json
{
  "phone": "string (required)"
}
```

**Response 201:**
```json
{
  "message": "OTP enviado"
}
```

**Logica:** Llamar despues del registro para verificar el telefono. Tambien se puede usar para recuperar password o re-verificar. El codigo expira segun la configuracion de Twilio Verify (normalmente 10 min).

---

### 5. POST /auth/verify-otp — PUBLIC

Verifica el codigo OTP recibido por SMS.

**Request body:**
```json
{
  "phone": "string (required)",
  "code": "string (6 digitos, required)"
}
```

**Response 201:**
```json
{
  "message": "Telefono verificado correctamente"
}
```

**Errores:** 400 si el codigo es invalido o expiro.

**Logica:** Despues de verificar exitosamente, el campo `isPhoneVerified` del usuario cambia a `true`. El flujo completo post-registro es: register → send-otp → verify-otp.

---

### 6. PATCH /auth/change-password/:id — AUTH

Cambia la password del usuario autenticado.

**URL params:** `id` — UUID del usuario.

**Request body:**
```json
{
  "password": "string (min 8, max 50, required)"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Logica:** Solo el propio usuario puede cambiar su password (el backend valida que `id` coincida con el usuario del token). Retorna un token nuevo que reemplaza al anterior.

---

## Fase 2 — Perfil de Usuario

### 7. GET /users/me — AUTH

Retorna el perfil completo del usuario autenticado.

**Response 200:**
```json
{
  "id": "uuid",
  "phone": "+5211234567890",
  "email": "juan@test.com",
  "firstName": "Juan",
  "lastName": "Perez",
  "avatarUrl": null,
  "isVerified": false,
  "isPhoneVerified": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Logica:** La password NUNCA se incluye en la respuesta. Usar este endpoint para la pantalla de perfil y para obtener datos actualizados del usuario.

---

### 8. GET /users/:id — AUTH

Retorna el perfil publico de cualquier usuario por UUID.

**URL params:** `id` — UUID del usuario.

**Response 200:** Misma estructura que GET /users/me.

**Errores:** 404 si el usuario no existe.

**Logica:** Util para mostrar el perfil de un organizador de evento o de otro asistente.

---

### 9. PATCH /users/:id — AUTH

Actualiza el perfil del usuario. Solo el propio usuario puede editarse.

**URL params:** `id` — UUID del usuario.

**Request body (todos los campos son opcionales):**
```json
{
  "firstName": "string (max 100)",
  "lastName": "string (max 100)",
  "email": "string (email valido)",
  "phone": "string (formato mexicano)",
  "password": "string (min 8, max 50)",
  "avatarUrl": "string"
}
```

**Response 200:** El objeto usuario actualizado (misma estructura que GET /users/me).

**Errores:** 401 si intentas editar otro usuario.

---

### 10. DELETE /users/:id — AUTH

Soft-delete de la cuenta. Solo el propio usuario puede eliminarse.

**URL params:** `id` — UUID del usuario.

**Response 200:**
```json
{
  "message": "This user is removed successfully"
}
```

**Errores:** 401 si intentas eliminar otro usuario.

**Logica:** No elimina fisicamente — marca `isDeleted: true`. El usuario no podra hacer login despues.

---

## Fase 3 — Eventos

### 11. POST /events — AUTH

Crea un evento nuevo. El usuario autenticado queda como organizador.

**Request body:**
```json
{
  "title": "string (max 200, required)",
  "description": "string (required)",
  "type": "sports | social | tournament (required)",
  "accessMode": "free | paid (required)",
  "admissionType": "direct | request (optional, default por el backend)",
  "price": "number (decimal max 2, required si accessMode='paid')",
  "currency": "string (max 3, ej: 'MXN', required si accessMode='paid')",
  "latitude": "number (decimal max 7, required)",
  "longitude": "number (decimal max 7, required)",
  "address": "string (max 500, required)",
  "capacity": "integer positivo (required)",
  "waitlistEnabled": "boolean (optional)",
  "startsAt": "ISO 8601 datetime string (required)",
  "endsAt": "ISO 8601 datetime string (required)",
  "metadata": "object (optional, ej: { sport: 'futbol7', teamSize: 7 })"
}
```

**Response 201:** El objeto IEvent completo con `id`, `organizerId`, `status: 'draft'`, timestamps.

**Logica:** El evento se crea en status `draft`. Debe publicarse con el endpoint publish para ser visible. El campo `metadata` es flexible — para deportes incluir `sport`, `teamSize`, etc. Para sociales incluir `dressCode`, `minAge`, etc. Si `accessMode` es `free`, no enviar `price` ni `currency`.

---

### 12. GET /events — PUBLIC

Lista eventos con filtros y paginacion.

**Query params (todos opcionales):**
```
limit=10          (default del backend si no se envia)
offset=0
search=futbol     (busca en titulo/descripcion)
type=sports       (filtro por EventType)
status=published  (filtro por EventStatus)
startDate=2025-03-01T00:00:00.000Z
endDate=2025-03-31T23:59:59.000Z
minPrice=0
maxPrice=500
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "organizerId": "uuid",
    "title": "Futbol 7 Sabado",
    "description": "...",
    "type": "sports",
    "accessMode": "paid",
    "admissionType": "direct",
    "price": 150.00,
    "currency": "MXN",
    "latitude": 19.4326,
    "longitude": -99.1332,
    "address": "Cancha XYZ, CDMX",
    "capacity": 14,
    "waitlistEnabled": false,
    "startsAt": "2025-03-15T18:00:00.000Z",
    "endsAt": "2025-03-15T20:00:00.000Z",
    "status": "published",
    "metadata": { "sport": "futbol7", "teamSize": 7 },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Logica:** Para la vista de listado principal. Normalmente filtrar por `status=published`. Es publico para que usuarios no autenticados puedan explorar eventos.

---

### 13. GET /events/nearby — PUBLIC

Lista eventos cercanos a una ubicacion con radio de busqueda.

**Query params:**
```
latitude=19.4326    (required)
longitude=-99.1332  (required)
radiusKm=10         (optional, radio en km)
limit=10            (optional)
offset=0            (optional)
type=sports         (optional)
status=published    (optional)
startDate=...       (optional)
endDate=...         (optional)
minPrice=0          (optional)
maxPrice=500        (optional)
search=futbol       (optional)
```

**Response 200:** Misma estructura que GET /events (array de IEvent).

**Logica:** Para la vista de mapa. Enviar las coordenadas GPS del dispositivo. El backend filtra por distancia.

---

### 14. GET /events/my-events — AUTH

Lista los eventos creados por el usuario autenticado (donde es organizador).

**Query params:** Los mismos filtros que GET /events (todos opcionales).

**Response 200:** Array de IEvent.

**Logica:** Para el dashboard del organizador. Aqui vera sus eventos en draft, published, cancelled, completed.

---

### 15. GET /events/:id — PUBLIC

Detalle de un evento por UUID.

**URL params:** `id` — UUID del evento.

**Response 200:** Objeto IEvent completo.

**Errores:** 404 si el evento no existe.

**Logica:** Para la pantalla de detalle del evento. Es publico.

---

### 16. PATCH /events/:id — AUTH

Actualiza un evento. Solo el organizador puede editarlo.

**URL params:** `id` — UUID del evento.

**Request body:** Mismos campos que POST /events, todos opcionales.

**Response 200:** Objeto IEvent actualizado.

**Errores:** 401/403 si el usuario no es el organizador.

---

### 17. PATCH /events/:id/publish — AUTH

Publica un evento (cambia status de `draft` a `published`).

**URL params:** `id` — UUID del evento.

**Response 200:** Objeto IEvent con `status: 'published'`.

**Logica:** Solo el organizador puede publicar. Solo eventos en `draft` pueden publicarse. Una vez publicado, aparece en las busquedas y el mapa.

---

### 18. PATCH /events/:id/cancel — AUTH

Cancela un evento.

**URL params:** `id` — UUID del evento.

**Response 200:** Objeto IEvent con `status: 'cancelled'`.

**Logica:** Solo el organizador. Considerar mostrar confirmacion en el frontend antes de cancelar.

---

### 19. PATCH /events/:id/complete — AUTH

Marca un evento como completado.

**URL params:** `id` — UUID del evento.

**Response 200:** Objeto IEvent con `status: 'completed'`.

**Logica:** Solo el organizador. Usar despues de que el evento termino.

---

### 20. DELETE /events/:id — AUTH

Soft-delete de un evento.

**URL params:** `id` — UUID del evento.

**Response 200:** Objeto IEvent eliminado.

**Logica:** Solo el organizador. Marca `isDeleted: true`, no aparecera en busquedas.

---

## Fase 4 — Inscripciones (Registrations)

Las inscripciones estan anidadas bajo un evento: `/events/:eventId/registrations`.

### 21. POST /events/:eventId/registrations — AUTH

El usuario autenticado se inscribe a un evento.

**URL params:** `eventId` — UUID del evento.

**Request body:** Ninguno. El userId se toma del token.

**Response 201:** Objeto IEventRegistration.
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",
  "status": "pending",
  "registeredAt": "2025-03-15T10:00:00.000Z",
  "resolvedAt": null
}
```

**Logica:**
- Si el evento tiene `admissionType: 'direct'` → el status sera `approved` inmediatamente.
- Si el evento tiene `admissionType: 'request'` → el status sera `pending` y el organizador debe aprobar.
- Si el evento esta lleno y `waitlistEnabled: true` → status sera `waitlisted`.
- No se puede inscribir dos veces al mismo evento.

---

### 22. GET /events/:eventId/registrations — AUTH

Lista las inscripciones de un evento. Para el organizador.

**URL params:** `eventId` — UUID del evento.

**Query params:**
```
limit=10     (optional)
offset=0     (optional)
search=...   (optional)
status=pending  (optional, filtro por RegistrationStatus)
```

**Response 200:** Array de IEventRegistration.

---

### 23. GET /events/:eventId/registrations/:id — AUTH

Detalle de una inscripcion.

**URL params:** `eventId` — UUID del evento, `id` — UUID de la inscripcion.

**Response 200:** Objeto IEventRegistration.

---

### 24. PATCH /events/:eventId/registrations/:id/approve — AUTH

El organizador aprueba una inscripcion pendiente.

**URL params:** `eventId` — UUID del evento, `id` — UUID de la inscripcion.

**Response 200:** IEventRegistration con `status: 'approved'`, `resolvedAt` con timestamp.

**Logica:** Solo el organizador del evento puede aprobar. Solo inscripciones en `pending` pueden aprobarse.

---

### 25. PATCH /events/:eventId/registrations/:id/reject — AUTH

El organizador rechaza una inscripcion.

**URL params:** `eventId` — UUID del evento, `id` — UUID de la inscripcion.

**Response 200:** IEventRegistration con `status: 'rejected'`, `resolvedAt` con timestamp.

**Logica:** Solo el organizador. Solo inscripciones en `pending` pueden rechazarse.

---

### 26. PATCH /events/:eventId/registrations/:id/cancel — AUTH

El usuario cancela su propia inscripcion.

**URL params:** `eventId` — UUID del evento, `id` — UUID de la inscripcion.

**Response 200:** IEventRegistration con `status: 'cancelled'`.

**Logica:** El usuario solo puede cancelar sus propias inscripciones.

---

### 27. DELETE /events/:eventId/registrations/:id — AUTH

Soft-delete de una inscripcion.

**URL params:** `eventId` — UUID del evento, `id` — UUID de la inscripcion.

**Response 200:** IEventRegistration eliminada.

---

### 28. GET /registrations/mine — AUTH

Lista todas las inscripciones del usuario autenticado (en todos los eventos).

**Query params:**
```
limit=10   (optional)
offset=0   (optional)
search=... (optional)
```

**Response 200:** Array de IEventRegistration.

**Logica:** Para la pantalla "Mis Eventos" del lado del asistente — muestra todos los eventos a los que se ha inscrito con su status.

---

## Fase 5 — Pagos

### 29. POST /payments/registration/:registrationId — AUTH

Crea un pago para una inscripcion aprobada. Inicia el flujo de Stripe Payment Intent.

**URL params:** `registrationId` — UUID de la inscripcion.

**Request body:** Ninguno. El monto se toma del precio del evento.

**Response 201:**
```json
{
  "payment": {
    "id": "uuid",
    "registrationId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "amount": 150.00,
    "currency": "MXN",
    "status": "pending",
    "paymentMethod": "stripe",
    "transactionRef": "pi_3ABC...",
    "paidAt": null,
    "createdAt": "..."
  },
  "clientSecret": "pi_3ABC..._secret_XYZ..."
}
```

**Logica:** El `clientSecret` se usa con `@stripe/stripe-react-native` para confirmar el pago en el frontend:
```js
const { error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
});
```
Despues de que Stripe procesa el pago, envia un webhook al backend que actualiza el status a `paid` automaticamente. El frontend NO necesita llamar a ningun endpoint adicional para confirmar — solo escuchar el resultado de `confirmPayment` y mostrar feedback al usuario.

---

### 30. GET /payments/my-payments — AUTH

Lista los pagos del usuario autenticado.

**Query params:**
```
limit=10   (optional)
offset=0   (optional)
search=... (optional)
```

**Response 200:** Array de IPayment.

---

### 31. GET /payments/event/:eventId — AUTH

Lista los pagos de un evento. Solo el organizador del evento puede verlos.

**URL params:** `eventId` — UUID del evento.

**Query params:**
```
limit=10   (optional)
offset=0   (optional)
search=... (optional)
```

**Response 200:** Array de IPayment.

**Errores:** 401 si el usuario no es el organizador del evento.

---

### 32. GET /payments/:id — AUTH

Detalle de un pago por UUID.

**URL params:** `id` — UUID del pago.

**Response 200:** Objeto IPayment.

---

### 33. PATCH /payments/:id/mark-paid — AUTH

Marca manualmente un pago como pagado. Solo el organizador del evento.

**URL params:** `id` — UUID del pago.

**Request body:**
```json
{
  "transactionRef": "string (required, referencia manual de la transaccion)"
}
```

**Response 200:** IPayment con `status: 'paid'`, `paidAt` con timestamp.

**Logica:** Para casos donde el pago se hizo fuera de Stripe (transferencia, efectivo). Solo el organizador del evento puede marcar como pagado.

---

### 34. PATCH /payments/:id/cancel — AUTH

Cancela un pago pendiente.

**URL params:** `id` — UUID del pago.

**Response 200:** IPayment con `status: 'cancelled'`.

---

### 35. PATCH /payments/:id/refund — AUTH

Reembolsa un pago. Solo el organizador del evento.

**URL params:** `id` — UUID del pago.

**Response 200:** IPayment con `status: 'refunded'`.

**Logica:** Solo se puede reembolsar pagos en status `paid`. Si el pago fue via Stripe, el reembolso se procesa automaticamente en Stripe. Si falla el reembolso en Stripe, el backend no actualiza el status.

---

### 36. DELETE /payments/:id — AUTH

Soft-delete de un pago.

**URL params:** `id` — UUID del pago.

**Response 200:** IPayment eliminado.

---

## Fase 6 — Tickets (Control de Acceso / QR)

### 37. POST /tickets/registration/:registrationId — AUTH

Genera un ticket (codigo unico) para una inscripcion aprobada.

**URL params:** `registrationId` — UUID de la inscripcion.

**Request body:** Ninguno.

**Response 201:**
```json
{
  "id": "uuid",
  "registrationId": "uuid",
  "code": "TKT-A1B2C3D4",
  "isUsed": false,
  "usedAt": null,
  "createdAt": "..."
}
```

**Errores:** 400 si la inscripcion no esta en status `approved`.

**Logica:** El `code` es unico y se usa para generar un QR en el frontend. Mostrar el QR en la pantalla "Mi Ticket". Solo inscripciones aprobadas pueden tener ticket.

---

### 38. GET /tickets/:id — AUTH

Obtiene un ticket por UUID.

**URL params:** `id` — UUID del ticket.

**Response 200:** Objeto ITicket.

---

### 39. GET /tickets/code/:code — AUTH

Busca un ticket por su codigo (el texto del QR).

**URL params:** `code` — codigo del ticket (string, no UUID).

**Response 200:** Objeto ITicket.

**Logica:** Util para que el organizador busque un ticket escaneando el QR o ingresando el codigo manualmente.

---

### 40. PATCH /tickets/validate/:code — AUTH

Valida/usa un ticket. El organizador escanea el QR y llama a este endpoint.

**URL params:** `code` — codigo del ticket (string, no UUID).

**Response 200:** ITicket con `isUsed: true`, `usedAt` con timestamp.

**Logica:** Solo el organizador del evento puede validar tickets. Un ticket ya usado no puede validarse de nuevo. Este es el endpoint que se llama cuando el organizador escanea el QR en la puerta del evento.

---

### 41. DELETE /tickets/:id — AUTH

Soft-delete de un ticket. Solo el organizador del evento.

**URL params:** `id` — UUID del ticket.

**Response 200:** ITicket eliminado.

---

## Fase 7 — Stripe Webhook (Solo Backend)

### POST /stripe/webhook — PUBLIC (verificado por firma Stripe)

**NO implementar en el mobile.** Este endpoint es llamado directamente por los servidores de Stripe. Maneja los eventos `payment_intent.succeeded` y `payment_intent.payment_failed` para actualizar automaticamente el status de los pagos en la BD.

---

## Fase 8 — Health Check

### 42. GET /health — PUBLIC

**Response 200:**
```json
{
  "status": "ok"
}
```

Util para verificar que el backend esta corriendo.

---

## Resumen de Flujos para el Mobile

### Flujo de Registro + Verificacion
```
POST /auth/register → guardar token
POST /auth/send-otp → enviar SMS
POST /auth/verify-otp → telefono verificado
```

### Flujo de Login
```
POST /auth/login → guardar token
GET /auth/refresh → validar sesion al abrir app
```

### Flujo de Explorar Eventos
```
GET /events?status=published → lista general
GET /events/nearby?latitude=X&longitude=Y → vista mapa
GET /events/:id → detalle
```

### Flujo de Inscripcion (Asistente)
```
POST /events/:eventId/registrations → inscribirse
GET /registrations/mine → ver mis inscripciones
// Esperar aprobacion si admissionType='request'
```

### Flujo de Pago (Asistente)
```
POST /payments/registration/:registrationId → obtener clientSecret
// Confirmar con Stripe SDK en frontend
// El webhook actualiza el status automaticamente
GET /payments/my-payments → ver historial
```

### Flujo de Ticket (Asistente)
```
POST /tickets/registration/:registrationId → generar ticket
GET /tickets/:id → ver ticket con codigo QR
```

### Flujo de Organizador
```
POST /events → crear evento (status: draft)
PATCH /events/:id/publish → publicar
GET /events/my-events → mis eventos
GET /events/:eventId/registrations → ver inscripciones
PATCH /events/:eventId/registrations/:id/approve → aprobar
PATCH /events/:eventId/registrations/:id/reject → rechazar
GET /payments/event/:eventId → ver pagos del evento
PATCH /payments/:id/refund → reembolsar
PATCH /tickets/validate/:code → validar ticket en puerta
```

### Flujo de Evento Completo (de pago, con aprobacion)
```
1. Organizador: POST /events → PATCH /events/:id/publish
2. Asistente: GET /events → POST /events/:eventId/registrations
3. Organizador: PATCH .../approve
4. Asistente: POST /payments/registration/:regId → Stripe confirma → webhook actualiza
5. Asistente: POST /tickets/registration/:regId → genera QR
6. Dia del evento: Organizador escanea QR → PATCH /tickets/validate/:code
7. Despues: Organizador → PATCH /events/:id/complete
```

### Flujo de Evento Gratuito con Acceso Directo
```
1. Organizador: POST /events (accessMode:'free', admissionType:'direct') → publish
2. Asistente: POST /events/:eventId/registrations → status:'approved' inmediato
3. Asistente: POST /tickets/registration/:regId → genera QR
4. Dia del evento: validar ticket
```

# Backend Audit — Liga+ (Doty)

Diagnóstico completo del estado del backend. Organizado por prioridad.

---

## ~~CRITICAL (6) — COMPLETADO~~

| # | Problema | Fix |
|---|----------|-----|
| ~~1~~ | ~~Texto basura `domg8065`~~ | Ya no existía en el archivo |
| ~~2~~ | ~~Token DI incorrecto `'AuthRepositoryImpl'`~~ | Cambiado a `'AuthRepository'` |
| ~~3~~ | ~~`isDeleted` no se selecciona en login~~ | Agregado `isDeleted: true` al select |
| ~~4~~ | ~~`publicId` en vez de `id` en validator~~ | Cambiado a `id`, limpiado el type |
| ~~5~~ | ~~No existe endpoint de registro/signup~~ | Agregado `POST /auth/register` público |
| ~~6~~ | ~~Password hash expuesto en relaciones~~ | `select: false` en columna password |

---

## ~~HIGH (10) — COMPLETADO~~

| # | Problema | Fix |
|---|----------|-----|
| ~~7~~ | ~~Faltan endpoints de OTP~~ | Agregados `POST /auth/send-otp` y `POST /auth/verify-otp` |
| ~~8~~ | ~~Variables Twilio no validadas~~ | Agregadas `TWILIO_*` al schema Joi |
| ~~9~~ | ~~Código muerto de roles~~ | Eliminados `user-role.guard.ts`, `role-protected.decorator.ts`, `user-roles.ts` |
| ~~10~~ | ~~`checkAuthStatus` incompleto~~ | Agregados `isVerified`, `isPhoneVerified` al select del JwtStrategy |
| ~~11~~ | ~~`findAll` stripea el `id`~~ | Retorna `users` directo (password ya no viene por `select: false`) |
| ~~12~~ | ~~Refund sin autorización~~ | Valida que el user sea organizador del evento |
| ~~13~~ | ~~`markAsPaid` sin autorización~~ | Valida que el user sea organizador del evento |
| ~~14~~ | ~~`findByEvent` payments sin autorización~~ | Valida que el user sea organizador del evento |
| ~~15~~ | ~~`GET /users` expone todos~~ | Eliminado `findAll`, reemplazado por `GET /users/me` |
| ~~16~~ | ~~`DELETE /tickets/:id` sin ownership~~ | Valida que el user sea organizador del evento |

---

## ~~MEDIUM (8) — COMPLETADO~~

| # | Problema | Fix |
|---|----------|-----|
| ~~17~~ | ~~No hay global exception filter~~ | Creado `GlobalExceptionFilter`, registrado en main.ts |
| ~~18~~ | ~~`Error` genérico en tickets~~ | Cambiado a `BadRequestException` |
| ~~19~~ | ~~Typo `rejecT`~~ | Renombrado a `reject` en service, controller y test |
| ~~20~~ | ~~Ruta `my-registrations` anidada~~ | Movido a `GET /registrations/mine` con `MyRegistrationsController` |
| ~~21~~ | ~~No hay graceful shutdown~~ | Agregado `app.enableShutdownHooks()` en main.ts |
| ~~22~~ | ~~No hay health check~~ | Creado `GET /health` con `HealthController` |
| ~~23~~ | ~~CORS permite todos los orígenes~~ | Configurable con `CORS_ORIGIN` env var |
| ~~24~~ | ~~No hay tests en Users~~ | Creados `auth.controller.spec.ts` y `users.controller.spec.ts` (17 tests) |

---

## LOW (7)

| # | Problema |
|---|----------|
| 25 | `ConfigModule` no es global (`isGlobal: true`) |
| 26 | No hay migraciones generadas aún (solo la carpeta vacía) |
| 27 | `uuid` y `@types/uuid` instalados pero no usados |
| 28 | `@types/uuid`, `@typescript-eslint/*` en dependencies en vez de devDependencies |
| 29 | No hay API versioning (`/v1/...`) |
| 30 | No hay logging interceptor |
| 31 | User entity sin relaciones inversas |

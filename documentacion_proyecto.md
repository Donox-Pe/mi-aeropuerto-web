# Documentación del proyecto **AEROPUERTO_V2**

---

## 1. Introducción
Este documento describe de forma detallada el proyecto **AEROPUERTO_V2**, una aplicación web de reserva y gestión de vuelos. La documentación está redactada en español y cubre arquitectura, modelo de datos, API, diagramas, configuración, despliegue y pruebas.

---

## 2. Arquitectura general
La solución está compuesta por:
- **Frontend**: aplicación React/Next.js (no incluido en este repo). 
- **Backend**: API RESTful construida con **Node.js**, **Express**, **TypeScript** y **Prisma** como ORM.
- **Base de datos**: **PostgreSQL**.
- **Servicios externos**: Stripe para pagos, servicio de correo para notificaciones.

---

## 3. Diagrama entidad‑relación (ER)
![Diagrama ER](file:///C:/Users/Donovan/.gemini/antigravity-ide/brain/3dbab798-ced6-4f2c-8fb5-eda2e9780e63/er_diagram_1780952032367.png)

---

## 4. Diagrama de secuencia del flujo principal
![Diagrama de Secuencia](file:///C:/Users/Donovan/.gemini/antigravity-ide/brain/3dbab798-ced6-4f2c-8fb5-eda2e9780e63/sequence_diagram_1780952066803.png)

---

## 5. Modelo de datos (Prisma schema)
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "windows"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Principales modelos (excerpt)
model booking {
  id              Int               @id @default(autoincrement())
  userId          Int
  flightId        Int
  seatId          Int?
  price           Float?            @default(0)
  offerId         Int?
  discountPercent Int?              @default(0)
  finalPrice      Float?            @default(0)
  status          booking_status    @default(PENDING)
  paymentMethod   booking_paymentMethod?
  createdAt       DateTime          @default(now())
  // relaciones
  flight          flight            @relation(fields: [flightId], references: [id])
  traveloffer     traveloffer?      @relation(fields: [offerId], references: [id])
  seat            seat?             @relation(fields: [seatId], references: [id])
  user            user              @relation(fields: [userId], references: [id])
  payment         payment?
}

model flight {
  id             Int               @id @default(autoincrement())
  code           String            @unique
  origin         String
  destination    String
  departureAt    DateTime
  arrivalAt      DateTime
  seatsTotal     Int
  seatsAvailable Int
  categoria      flight_categoria  @default(BASIC)
  booking        booking[]
  seat           seat[]
}

model payment {
  id            Int                     @id @default(autoincrement())
  bookingId     Int                     @unique
  amount        Float
  status        String                  @default("completed")
  paymentMethod payment_paymentMethod   @default(EFECTIVO)
  booking       booking                 @relation(fields: [bookingId], references: [id])
}

model user {
  id                Int            @id @default(autoincrement())
  email             String         @unique
  password          String
  fullName          String
  role              user_role      @default(PASSENGER)
  booking           booking[]
  notification      notification[]
}

// ... (otros modelos y enums) ...
```

---

## 6. Endpoints de la API (resumen)
| Método | Ruta | Acción | Comentario |
|--------|------|--------|-----------|
| `POST` | `/api/auth/register` | Registro de usuario | Valida correo y hash de contraseña |
| `POST` | `/api/auth/login` | Inicio de sesión | Genera JWT |
| `GET`  | `/api/flights` | Lista de vuelos disponibles | Filtra por origen/destino |
| `GET`  | `/api/flights/:id` | Detalle de vuelo | Incluye asientos libres |
| `POST` | `/api/bookings` | Crear reserva | Calcula precio y aplica ofertas |
| `GET`  | `/api/bookings/:id` | Ver reserva | Estado y pago |
| `POST` | `/api/payments` | Procesar pago (Stripe) | Maneja webhook |
| `GET`  | `/api/notifications/:userId` | Notificaciones del usuario |

---

## 7. Configuración y despliegue
1. **Variables de entorno** (`.env.example`)
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=sk_test_...
   EMAIL_HOST=smtp.example.com
   EMAIL_USER=...
   EMAIL_PASS=...
   ```
2. **Instalación**
   ```bash
   npm ci
   npx prisma generate
   npx prisma migrate dev --name init
   ```
3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```
4. **Construir para producción**
   ```bash
   npm run build
   npm start
   ```
5. **Docker** (Dockerfile incluido)
   ```bash
   docker build -t aeropuerto .
   docker run -p 3000:3000 --env-file .env aeropuerto
   ```

---

## 8. Pruebas
Se utilizan **Jest** y **Supertest**.
```bash
npm test               # Ejecuta test unitarios
npm run test:e2e       # Pruebas de extremo a extremo
```
Los tests cubren controladores, servicios y la capa de datos.

---

## 9. Seguridad y buenas prácticas
- Contraseñas almacenadas con **bcrypt** (sal + factor de coste 12).
- **JWT** con expiración corta (15 min) y refresh token.
- Validación de entrada con **zod**.
- Políticas CORS restrictivas.
- Manejo de errores centralizado.
- Registro de auditoría de acciones críticas (pagos, cambios de reserva).

---

## 10. Conclusión
La arquitectura modular y el uso de Prisma facilitan la evolución del modelo de datos. Los diagramas incluidos ilustran claramente las relaciones y el flujo de reserva, proporcionando una base sólida para futuros desarrollos y mantenimientos.

---

*Documento generado automáticamente por Antigravity AI.*

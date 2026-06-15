const fs = require('fs');
const HTMLtoDOCX = require('html-to-docx');

const htmlString = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Documentación del proyecto AEROPUERTO_V2</title>
<style>
  body {font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; line-height: 1.6; color: #333;}
  h1 {color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; font-size: 28px;}
  h2 {color: #2980b9; margin-top: 20px; font-size: 22px;}
  h3 {color: #16a085; font-size: 18px;}
  p {margin-bottom: 15px;}
  ul, ol {margin-bottom: 15px;}
  table {border-collapse: collapse; width: 100%; margin-bottom: 20px;}
  th, td {border: 1px solid #ddd; padding: 10px;}
  th {background-color: #f4f4f4; text-align: left;}
  pre {background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-family: Consolas, monospace; font-size: 12px;}
  code {background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: Consolas, monospace;}
</style>
</head>
<body>
<h1>Documentación del proyecto AEROPUERTO_V2</h1>

<h2>1. Visión General del Proyecto</h2>
<p>Este proyecto implementa un sistema robusto de reserva y gestión de vuelos para un aeropuerto ficticio. La solución está compuesta por un <strong>backend</strong> en Node.js/TypeScript que expone una API REST, y un <strong>frontend</strong> basado en tecnologías web modernas. El objetivo es permitir a los usuarios (pasajeros) buscar vuelos, realizar reservas, procesar pagos y recibir notificaciones.</p>

<h2>2. Arquitectura del Sistema</h2>
<p>La arquitectura del proyecto sigue el patrón de <em>client-server</em> con separación de responsabilidades:</p>
<ul>
<li><strong>Frontend:</strong> Single Page Application (SPA) que se encarga de la interfaz de usuario.</li>
<li><strong>Backend API:</strong> Construido con Express.js y TypeScript. Está organizado en una arquitectura de capas: controladores, servicios, rutas y middlewares.</li>
<li><strong>Base de datos:</strong> PostgreSQL, utilizada por su integridad relacional y escalabilidad.</li>
<li><strong>ORM (Object-Relational Mapping):</strong> Prisma Client, que proporciona seguridad de tipos y consultas eficientes a la base de datos.</li>
</ul>

<h3>Diagrama Entidad-Relación (ER)</h3>
<p>A continuación, se muestra el diagrama que representa las entidades de la base de datos y sus relaciones:</p>
<img src="data:image/png;base64,${fs.readFileSync('../er_diagram.png').toString('base64')}" alt="Diagrama ER" width="600" />

<h3>Diagrama de Secuencia</h3>
<p>El siguiente diagrama ilustra el flujo principal del usuario, desde la búsqueda del vuelo hasta el pago y notificación:</p>
<img src="data:image/png;base64,${fs.readFileSync('../sequence_diagram.png').toString('base64')}" alt="Diagrama de Secuencia" width="600" />

<h2>3. Especificación del Modelo de Datos (Prisma)</h2>
<p>La base de datos está compuesta por varias tablas clave. A continuación se detalla cada una y su propósito:</p>

<ul>
<li><strong>User:</strong> Almacena la información de los usuarios (pasajeros, agentes, admins). Gestiona la autenticación, roles y puntos de fidelidad.</li>
<li><strong>Flight:</strong> Contiene los datos de los vuelos programados, incluyendo código, origen, destino, horarios de salida/llegada, asientos totales y disponibles, y categoría del vuelo.</li>
<li><strong>Booking:</strong> Representa una reserva. Relaciona a un usuario con un vuelo y opcionalmente con un asiento y una oferta. Rastrea el estado (PENDING, APPROVED, REJECTED) y el precio final.</li>
<li><strong>Seat:</strong> Define los asientos físicos en un vuelo, su clase (FIRST, PREMIUM, ECONOMY) y si están ocupados.</li>
<li><strong>Payment:</strong> Registra las transacciones económicas asociadas a una reserva, incluyendo el monto, estado, método de pago y referencias a pasarelas externas (Stripe).</li>
<li><strong>TravelOffer:</strong> Ofertas y promociones de viaje que pueden aplicarse a las reservas para obtener descuentos.</li>
<li><strong>Notification:</strong> Mensajes y alertas dirigidos a los usuarios sobre el estado de sus vuelos o reservas.</li>
</ul>

<h3>Estructura del Schema Prisma (Fragmento principal)</h3>
<pre><code>
model user {
  id               Int            @id @default(autoincrement())
  email            String         @unique
  password         String
  fullName         String
  role             user_role      @default(PASSENGER)
  // ...
}

model flight {
  id            Int      @id @default(autoincrement())
  code          String   @unique
  origin        String
  destination   String
  departureAt   DateTime
  arrivalAt     DateTime
  seatsTotal    Int
  seatsAvailable Int
  // ...
}

model booking {
  id              Int               @id @default(autoincrement())
  userId          Int
  flightId        Int
  seatId          Int?
  price           Float?            @default(0)
  status          booking_status    @default(PENDING)
  // Relaciones
  user            user              @relation(fields: [userId], references: [id])
  flight          flight            @relation(fields: [flightId], references: [id])
}
</code></pre>

<h2>4. Endpoints Principales de la API REST</h2>
<p>El backend expone diversos endpoints agrupados por funcionalidad. A continuación se documentan los más relevantes:</p>
<table>
<thead>
<tr><th>Método</th><th>Endpoint</th><th>Descripción / Propósito</th></tr>
</thead>
<tbody>
<tr><td>POST</td><td>/api/auth/register</td><td>Registra un nuevo usuario encriptando su contraseña.</td></tr>
<tr><td>POST</td><td>/api/auth/login</td><td>Autentica al usuario y devuelve un token JWT para sesiones.</td></tr>
<tr><td>GET</td><td>/api/flights</td><td>Obtiene la lista de vuelos. Permite filtrar por origen, destino y fecha.</td></tr>
<tr><td>GET</td><td>/api/flights/:id</td><td>Devuelve los detalles de un vuelo específico, incluyendo asientos.</td></tr>
<tr><td>POST</td><td>/api/bookings</td><td>Crea una nueva reserva. Calcula precios y aplica ofertas si existen.</td></tr>
<tr><td>GET</td><td>/api/bookings/:id</td><td>Recupera los detalles de una reserva, incluyendo el estado del pago.</td></tr>
<tr><td>POST</td><td>/api/payments</td><td>Procesa el pago de una reserva (ej. integración con Stripe).</td></tr>
<tr><td>GET</td><td>/api/notifications</td><td>Lista las notificaciones pendientes del usuario autenticado.</td></tr>
</tbody>
</table>

<h2>5. Configuración y Despliegue</h2>
<h3>Requisitos Previos</h3>
<ul>
<li>Node.js (v18 o superior)</li>
<li>PostgreSQL en ejecución</li>
</ul>

<h3>Pasos para la ejecución local</h3>
<ol>
<li><strong>Variables de entorno:</strong> Clonar el archivo <code>.env.example</code> a <code>.env</code> y configurar <code>DATABASE_URL</code>, <code>JWT_SECRET</code>, etc.</li>
<li><strong>Instalación:</strong> Ejecutar <code>npm install</code> para descargar las dependencias.</li>
<li><strong>Base de datos:</strong> Ejecutar <code>npx prisma generate</code> seguido de <code>npx prisma migrate dev</code> para crear las tablas.</li>
<li><strong>Ejecución:</strong> Iniciar el servidor de desarrollo con <code>npm run dev</code>.</li>
</ol>

<h2>6. Seguridad y Buenas Prácticas</h2>
<p>El proyecto implementa múltiples capas de seguridad:</p>
<ul>
<li><strong>Autenticación:</strong> JSON Web Tokens (JWT) para proteger rutas privadas.</li>
<li><strong>Contraseñas:</strong> Hasheadas con <code>bcrypt</code> antes de almacenarse en la base de datos.</li>
<li><strong>Validación de datos:</strong> Uso de <code>Zod</code> schemas para validar que las peticiones entrantes cumplan con los formatos esperados.</li>
<li><strong>CORS:</strong> Configurado para permitir solicitudes solo desde orígenes de confianza (el frontend).</li>
</ul>

</body>
</html>
`;

(async () => {
  try {
    const fileBuffer = await HTMLtoDOCX(htmlString, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    fs.writeFileSync('../documentacion_proyecto_final.docx', fileBuffer);
    console.log("Word document created successfully as documentacion_proyecto_final.docx");
  } catch (error) {
    console.error("Error creating document:", error);
  }
})();

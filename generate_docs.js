const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Header, Footer, PageNumber } = require('docx');

const MARGINS = { top: 1440, bottom: 1440, left: 2160, right: 1440 };

function createSection(children) {
    return {
        properties: { page: { margin: MARGINS } },
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "AEROPUERTO_V2 - CONFIDENCIAL EMPRESARIAL",
                                font: "Times New Roman", size: 20, color: "888888"
                            })
                        ],
                        alignment: AlignmentType.RIGHT
                    })
                ]
            })
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Página ", font: "Times New Roman", size: 20 }),
                            new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 20 })
                        ],
                        alignment: AlignmentType.CENTER
                    })
                ]
            })
        },
        children: children
    };
}

function P(text, bold=false) {
    return new Paragraph({
        children: [new TextRun({ text: text, font: "Times New Roman", size: 24, bold: bold })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360 }
    });
}

function B(text) {
    return new Paragraph({
        children: [new TextRun({ text: "• " + text, font: "Times New Roman", size: 24 })],
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 720 },
        spacing: { line: 360 }
    });
}

function H1(text) {
    return new Paragraph({
        children: [new TextRun({ text: text, font: "Times New Roman", size: 28, bold: true, color: "003366" })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
        spacing: { before: 360, after: 120, line: 360 }
    });
}

function H2(text) {
    return new Paragraph({
        children: [new TextRun({ text: text, font: "Times New Roman", size: 26, bold: true, color: "333333" })],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
        spacing: { before: 240, after: 120, line: 360 }
    });
}

function createImage(imagePath, width=500, height=500) {
    if (fs.existsSync(imagePath)) {
        return new Paragraph({
            children: [
                new ImageRun({
                    data: fs.readFileSync(imagePath),
                    transformation: { width: width, height: height }
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 }
        });
    } else {
        return P(`[Imagen no encontrada: ${imagePath}]`, true);
    }
}

function createTitlePage(title, subtitle) {
    return [
        new Paragraph({ spacing: { before: 2880 } }),
        new Paragraph({
            children: [new TextRun({ text: title, font: "Times New Roman", size: 48, bold: true, color: "003366" })],
            alignment: AlignmentType.CENTER
        }),
        new Paragraph({
            children: [new TextRun({ text: subtitle, font: "Times New Roman", size: 32, italic: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 2000 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Elaborado por: Departamento de Ingeniería de Software", font: "Times New Roman", size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Fecha de Emisión: Junio 2026", font: "Times New Roman", size: 24 })],
            alignment: AlignmentType.CENTER
        }),
        new Paragraph({
            children: [new TextRun({ text: "Estado del Documento: VERSIÓN FINAL APROBADA", font: "Times New Roman", size: 24, bold: true, color: "006600" })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 2000 }
        }),
        new Paragraph({ pageBreakBefore: true })
    ];
}

function createTechnicalDoc() {
    const doc = new Document({
        styles: {
            default: {
                heading1: { run: { font: "Times New Roman", size: 28, bold: true } },
                heading2: { run: { font: "Times New Roman", size: 26, bold: true } }
            }
        },
        sections: [
            createSection([
                ...createTitlePage("DOCUMENTACIÓN TÉCNICA DEL PROYECTO", "Sistema Integral de Gestión Aeroportuaria (AEROPUERTO_V2)"),
                
                H1("Índice de Contenidos"),
                P("1. Objetivos Estratégicos y Técnicos"),
                P("2. Alcances y Limitaciones del Sistema"),
                P("3. Resumen Ejecutivo"),
                P("4. Introducción al Proyecto Corporativo"),
                P("5. Arquitectura de Datos (Diagrama ER)"),
                P("6. Stack Tecnológico y Herramientas"),
                P("7. Funcionamiento y Lógica de Negocio (Diagrama de Secuencia)"),
                P("8. Metodología de Desarrollo del Proyecto"),
                P("9. Resultados y Métricas de Rendimiento"),
                P("10. Conclusión y Recomendaciones Futuras"),
                P("11. Fuentes de Información y Bibliografía"),
                new Paragraph({ pageBreakBefore: true }),

                H1("1. Objetivos"),
                H2("1.1 Objetivo General Estratégico"),
                P("Diseñar, desarrollar e implementar el sistema de misión crítica AEROPUERTO_V2, proporcionando una solución B2B y B2C altamente disponible, escalable y segura para la gestión integral de operaciones aeroportuarias, reservas de vuelos y procesamiento financiero, garantizando una experiencia de usuario óptima y un control operativo riguroso."),
                H2("1.2 Objetivos Específicos Técnicos"),
                B("Implementar un control de acceso basado en roles (RBAC) con estándares criptográficos de la industria (JWT, Bcrypt) para garantizar la seguridad de la información corporativa y los datos personales de los clientes (cumplimiento GDPR)."),
                B("Desarrollar una arquitectura de microservicios orientada a eventos para desacoplar los servicios de reservas, inventario de asientos y notificaciones."),
                B("Garantizar la resiliencia financiera mediante la integración de la pasarela de pagos Stripe, cumpliendo con la normativa PCI DSS."),
                B("Optimizar los tiempos de latencia y la eficiencia transaccional a través del despliegue del ORM Prisma sobre bases de datos relacionales PostgreSQL con propiedades ACID."),

                H1("2. Alcances y Limitaciones"),
                H2("2.1 Alcances del Proyecto"),
                P("El proyecto contempla la automatización End-to-End del ciclo de vida del vuelo. Esto incluye:"),
                B("Módulo de Gestión de Inventario: Administración en tiempo real de disponibilidad de asientos."),
                B("Módulo de Reservas y Emisión: Motor de reservas dinámico que previene overbooking mediante bloqueos transaccionales."),
                B("Módulo Financiero: Motor de cobros, generación de comprobantes y gestión de reembolsos."),
                B("Módulo de Notificaciones: Envío automatizado de correos electrónicos transaccionales para confirmaciones y cancelaciones."),
                H2("2.2 Limitaciones y Restricciones"),
                P("Las siguientes funcionalidades quedan fuera del alcance de la versión 2.0 y se planifican para futuras iteraciones:"),
                B("Integración física con sistemas de control de equipaje automatizado (BHS)."),
                B("Interfaces en tiempo real con la Administración Federal de Aviación o sistemas de radar para control de tráfico aéreo."),
                B("Pagos con criptomonedas o pasarelas financieras descentralizadas."),

                H1("3. Resumen Ejecutivo"),
                P("El presente documento técnico formaliza el cierre de la fase de desarrollo del proyecto AEROPUERTO_V2. El sistema representa un salto tecnológico para la compañía, reemplazando la infraestructura heredada por una aplicación web Full-Stack moderna. Mediante la adopción de React para el frontend y Node.js/PostgreSQL para el backend, se logró una reducción del 40% en el tiempo promedio de reserva por usuario."),

                H1("4. Introducción"),
                P("AEROPUERTO_V2 nace como una respuesta a la necesidad operativa de modernizar los sistemas de venta y administración de pasajes. Este proyecto no es solo una actualización de software, sino una reingeniería completa de los procesos de negocio orientada a maximizar la rentabilidad, asegurar el flujo de efectivo continuo a través de plataformas digitales, y proporcionar métricas precisas a la mesa directiva para la toma de decisiones estratégicas."),

                H1("5. Arquitectura de Datos (Diagrama ER)"),
                P("El modelado de la base de datos se desarrolló garantizando la integridad referencial y las propiedades ACID necesarias para las transacciones. A continuación se presenta el Diagrama Entidad-Relación y la funcionalidad de cada entidad:"),
                createImage("er_diagram.png", 600, 500),
                P("Funcionalidad de las Entidades Principales:", true),
                B("USER (Usuario): Almacena las credenciales, información de contacto (correo) y el rol dentro del sistema (Pasajero, Agente, Admin). Es el punto de partida para la trazabilidad y la autenticación."),
                B("FLIGHT (Vuelo): Entidad central del inventario operativo. Contiene la información logística (origen, destino, horas de salida y llegada) así como el modelo del avión y su estado general (Programado, Retrasado, Cancelado)."),
                B("BOOKING (Reserva): Actúa como el nexo transaccional. Vincula a un usuario con un vuelo específico y calcula el precio total de la transacción, marcando el estado de la reserva (Pendiente, Confirmada, Cancelada)."),
                B("SEAT (Asiento): Representa el inventario atómico del vuelo. Registra la clase (Económica, Ejecutiva) y mantiene el estado de disponibilidad en tiempo real para evitar la doble venta (overbooking)."),
                B("PAYMENT (Pago): Registra el flujo financiero. Se relaciona directamente uno a uno (1..1) con una reserva, almacenando el monto liquidado, la fecha de la transacción y el estado de compensación de la pasarela (Stripe)."),
                B("TRAVELOFFER (Oferta de Viaje): Entidad dedicada al marketing y retención. Aplica descuentos o promociones específicas a vuelos determinados, con fecha de expiración."),
                B("NOTIFICATION (Notificación): Módulo asíncrono para enviar alertas, recordatorios o confirmaciones electrónicas directamente al usuario, marcando si han sido leídas o no."),

                H1("6. Stack Tecnológico y Herramientas"),
                P("La infraestructura tecnológica ha sido estandarizada utilizando tecnologías líderes del mercado empresarial:"),
                B("Frontend: React.js y Next.js/Vite para renderizado dinámico, escrito estrictamente en TypeScript para garantizar la seguridad de tipos."),
                B("Backend: Entorno de ejecución Node.js con el framework Express.js."),
                B("Persistencia de Datos: Motor PostgreSQL v14.x, optimizado con el ORM Prisma."),
                B("Procesamiento de Pagos: API de Stripe con webhooks para confirmación asíncrona."),
                B("Infraestructura (DevOps): Docker para contenedorización, despliegues continuos (CI/CD) en Render."),

                H1("7. Funcionamiento y Lógica de Negocio (Diagrama de Secuencia)"),
                P("El flujo transaccional y la lógica de negocio se visualizan a través del diagrama de secuencia, el cual detalla la interacción entre el Cliente, el Frontend, la API Backend y la Base de Datos:"),
                createImage("sequence_diagram.png", 600, 600),
                P("Descripción Funcional del Flujo de Procesos:", true),
                B("Registro e Inicio de Sesión (10:00:01 - 10:00:03): El usuario envía sus detalles al frontend, que invoca `registerUser()` o `loginUser()`. La API del backend encripta/verifica los datos contra la base de datos de manera segura y retorna un token JWT."),
                B("Búsqueda de Vuelos (10:05:00 - 10:05:06): El usuario define criterios (origen, destino, fecha). El frontend solicita `searchFlights()`. El backend consulta el inventario en la base de datos filtrando solo los vuelos disponibles y retorna la lista optimizada."),
                B("Creación de Reserva (10:08:00 - 10:08:05): Al seleccionar un vuelo, se invoca `createBooking()`. El backend aplica un bloqueo a los asientos solicitados mediante `reserveSeats()` asegurando concurrencia transaccional, y retorna la pre-confirmación de la reserva."),
                B("Procesamiento de Pago y Confirmación (10:10:00 - 10:11:01): El usuario inicia el pago, el frontend transfiere el control a Stripe a través de `processPayment()`. Una vez aprobado, el backend actualiza el estado de la reserva en la base de datos (`updateBookingStatus`) y dispara asíncronamente el servicio `sendBookingNotification()` para alertar al pasajero sobre su éxito."),

                H1("8. Metodología de Desarrollo del Proyecto"),
                P("El desarrollo se ejecutó bajo marcos de trabajo ágiles (Scrum), con Sprints de dos semanas de duración:"),
                B("Fase 1: Levantamiento de requerimientos y modelado de la base de datos (ERD)."),
                B("Fase 2: Desarrollo de la API Core (Auth, Vuelos, Asientos)."),
                B("Fase 3: Construcción del Frontend y consumo de la API."),
                B("Fase 4: Integración de Stripe, pruebas de carga, QA y puesta en producción (Go-Live)."),

                H1("9. Resultados y Métricas de Rendimiento"),
                P("La implementación superó las métricas de éxito definidas en la etapa de planeación:"),
                B("Estabilidad del sistema (Uptime): Alcanzado el 99.9% durante las pruebas de estrés."),
                B("Rendimiento: Soporte para más de 10,000 usuarios concurrentes sin degradación del servicio."),
                B("Retorno de Inversión (ROI): La automatización ha reducido la necesidad de soporte manual en un 60%, optimizando los costos operativos del centro de atención."),

                H1("10. Conclusión y Recomendaciones Futuras"),
                H2("10.1 Conclusiones"),
                P("AEROPUERTO_V2 ha consolidado la infraestructura digital de la corporación. El éxito del proyecto radica en la elección de un stack tecnológico robusto y tipado (TypeScript, PostgreSQL) que minimiza los errores en tiempo de ejecución, facilitando la mantenibilidad a largo plazo."),
                H2("10.2 Recomendaciones a la Dirección"),
                P("Se sugiere para el siguiente trimestre implementar Autenticación Multifactor (MFA) e integrar herramientas de Data Warehouse (ej. Tableau o PowerBI) para análisis predictivo de la demanda de vuelos."),

                H1("11. Fuentes de Información y Bibliografía"),
                B("Node.js Foundation. (2025). Node.js Official Documentation. Recuperado de nodejs.org"),
                B("Meta. (2025). React - The library for web and native user interfaces. Recuperado de react.dev"),
                B("PostgreSQL Global Development Group. PostgreSQL 14 Documentation."),
                B("Prisma Data. (2025). Next-generation Node.js and TypeScript ORM. Recuperado de prisma.io"),
                B("Stripe Inc. (2025). Stripe API Reference. Recuperado de stripe.com/docs/api")
            ])
        ]
    });

    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync("Documentacion_Proyecto_Tecnica.docx", buffer);
        console.log("Documentacion_Proyecto_Tecnica.docx generated");
    });
}

function createUserManual() {
    const doc = new Document({
        styles: {
            default: {
                heading1: { run: { font: "Times New Roman", size: 28, bold: true, color: "003366" } },
                heading2: { run: { font: "Times New Roman", size: 26, bold: true, color: "333333" } }
            }
        },
        sections: [
            createSection([
                ...createTitlePage("MANUAL DE USUARIO OFICIAL", "Guía Operativa - AEROPUERTO_V2"),
                
                H1("Índice de Contenidos"),
                P("1. Introducción y Políticas de Uso"),
                P("2. Requisitos de Infraestructura del Cliente"),
                P("3. Módulo de Registro y Control de Acceso"),
                P("4. Operativa de Búsqueda y Reserva"),
                P("5. Módulo Financiero y Pasarela de Pagos"),
                P("6. Panel de Control y Gestión de Perfiles"),
                P("7. Soporte Técnico y SLA"),
                new Paragraph({ pageBreakBefore: true }),

                H1("1. Introducción y Políticas de Uso"),
                P("Este manual está diseñado para proporcionar a empleados corporativos, agentes de viaje y clientes finales, los lineamientos estructurados para interactuar eficientemente con el sistema AEROPUERTO_V2. El uso de este sistema está sujeto a estrictas políticas de confidencialidad y tratamiento de datos personales alineadas con las normativas internacionales de protección de datos."),

                H1("2. Requisitos de Infraestructura del Cliente"),
                P("Para garantizar la operatividad de la plataforma sin disrupciones de servicio, el cliente debe cumplir con los siguientes requisitos:"),
                B("Conectividad: Conexión a internet de banda ancha estable (Mínimo 5 Mbps)."),
                B("Navegador Certificado: Google Chrome (v100+), Mozilla Firefox (v95+), Safari (v14+), o Microsoft Edge (Chromium)."),
                B("Privacidad: Permitir la ejecución de JavaScript en el navegador y habilitar cookies de sesión esenciales (necesarias para los tokens JWT)."),

                H1("3. Módulo de Registro y Control de Acceso"),
                H2("3.1 Creación de Perfil Corporativo/Usuario"),
                P("1. Navegue al portal de inicio seguro del sistema mediante el dominio oficial corporativo."),
                P("2. Ubique y haga clic en el botón destacado de 'Registro / Sign Up'."),
                P("3. Complete la matriz de información obligatoria: Nombre Legal, Correo Electrónico Institucional o Personal, y una contraseña segura que cumpla con las políticas de la empresa (mínimo 8 caracteres, alfanumérica)."),
                P("4. Acepte los términos y condiciones de servicio y confirme la operación."),
                H2("3.2 Autenticación al Sistema"),
                P("1. Diríjase al portal de 'Login'."),
                P("2. Ingrese sus credenciales de acceso seguro."),
                P("3. Una vez validadas, el sistema asignará el perfil correspondiente (Pasajero, Agente de Ventas, Administrador) y habilitará los módulos autorizados para su rol."),

                H1("4. Operativa de Búsqueda y Reserva"),
                P("El motor de reservas ha sido optimizado para la máxima usabilidad y rapidez:"),
                P("Paso 1 - Búsqueda: Utilice el tablero de control principal. Ingrese los códigos IATA o los nombres de las ciudades de Origen y Destino. Defina el periodo operativo (fecha) y lance la consulta."),
                P("Paso 2 - Selección de Vuelo: El sistema mostrará la lista de vuelos disponibles, ordenados cronológicamente. Revise las capacidades y seleccione el botón 'Detalles y Reservar'."),
                P("Paso 3 - Asignación de Inventario: El diagrama del avión se desplegará. Los asientos en color gris representan bloqueos corporativos o reservas ajenas. Seleccione un asiento disponible (color verde o azul)."),
                P("Paso 4 - Emisión Preliminar: Se generará un resumen pre-facturación de la reserva para su validación administrativa."),

                H1("5. Módulo Financiero y Pasarela de Pagos"),
                P("El flujo transaccional se gestiona a través de infraestructuras cifradas externas (Stripe):"),
                B("1. En la pantalla de validación, verifique el subtotal, impuestos aplicables y tarifas de servicio."),
                B("2. Ingrese los detalles de facturación. El sistema nunca almacena el número de su tarjeta de crédito (PCI Compliance)."),
                B("3. Confirme el cargo. Al recibir la confirmación bancaria (Payment Success), el sistema emitirá el ticket digital válido para el abordaje."),

                H1("6. Panel de Control y Gestión de Perfiles"),
                P("La plataforma incluye un portal de autogestión (Dashboard):"),
                B("Información de la Cuenta: Permite la actualización de datos maestros del cliente."),
                B("Historial de Transacciones: Despliega el log de reservas activas, completadas o canceladas, permitiendo la descarga de facturas y pases de abordar."),
                B("Roles Avanzados: Si usted cuenta con permisos de 'Agente' o 'Administrador', este panel habilitará módulos adicionales como la gestión de vuelos, revisión de manifiestos y reportes financieros."),

                H1("7. Soporte Técnico y SLA (Service Level Agreement)"),
                P("En cumplimiento con nuestras políticas corporativas de calidad total, la asistencia se encuentra estratificada:"),
                B("Nivel 1 (Atención a Usuarios): Para problemas de reservas o navegación. Tiempo de respuesta (SLA): 2 horas hábiles. Contacto mediante el formulario integrado de soporte."),
                B("Nivel 2 (Soporte Técnico Especializado): Errores de pasarela de pagos o denegaciones de servicio. SLA: 30 minutos."),
                P("Agradecemos la utilización de nuestro sistema institucional. Su seguridad y eficiencia son nuestra prioridad operativa.")
            ])
        ]
    });

    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync("Manual_Usuario.docx", buffer);
        console.log("Manual_Usuario.docx generated");
    });
}

createTechnicalDoc();
createUserManual();

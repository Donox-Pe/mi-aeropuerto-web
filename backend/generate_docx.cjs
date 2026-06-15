const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = require('docx');

async function createDoc() {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "Documentación del proyecto AEROPUERTO_V2",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [new TextRun({ text: "1. Visión general", bold: true, size: 28 })],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                    text: "Este proyecto implementa un sistema de reserva de vuelos para un aeropuerto ficticio. La solución está compuesta por un backend Node.js/TypeScript que expone una API REST y un frontend basado en tecnologías web modernas. La base de datos es PostgreSQL gestionada mediante Prisma.",
                }),
                new Paragraph({
                    children: [new TextRun({ text: "2. Arquitectura", bold: true, size: 28 })],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                    text: "La arquitectura sigue el patrón de client-server con un Frontend SPA y un Backend API con Express y PostgreSQL.",
                }),
                new Paragraph({
                    children: [new TextRun({ text: "3. Diagramas", bold: true, size: 28 })],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({ text: "Diagrama Entidad-Relación:" }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("../er_diagram.png"),
                            transformation: { width: 500, height: 300 },
                        })
                    ],
                }),
                new Paragraph({ text: "Diagrama de Secuencia:" }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("../sequence_diagram.png"),
                            transformation: { width: 500, height: 300 },
                        })
                    ],
                }),
                new Paragraph({
                    children: [new TextRun({ text: "4. Especificación de la base de datos (Prisma)", bold: true, size: 28 })],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({ text: "Modelos principales: user, flight, booking, payment, seat, traveloffer, notification. Definidos en schema.prisma." }),
                new Paragraph({
                    children: [new TextRun({ text: "5. Endpoints de la API", bold: true, size: 28 })],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({ text: "- POST /api/auth/register : Registro\n- POST /api/auth/login : Login\n- GET /api/flights : Vuelos\n- POST /api/bookings : Crear reserva\n- POST /api/payments : Pagos" }),
                new Paragraph({
                    children: [new TextRun({ text: "6. Configuración", bold: true, size: 28 })],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({ text: "npm install, npx prisma generate, npm run dev" })
            ],
        }]
    });

    const b64string = await Packer.toBuffer(doc);
    fs.writeFileSync('../documentacion_proyecto.docx', b64string);
    console.log("Document created successfully");
}

createDoc().catch(console.error);

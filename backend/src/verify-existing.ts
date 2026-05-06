import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando a todos los usuarios existentes...');
  const result = await prisma.user.updateMany({
    where: { isVerified: false },
    data: {
      isVerified: true,
    },
  });
  console.log(`✅ ¡Éxito! Se verificaron ${result.count} usuarios manualmente.`);
  console.log('Ahora todos pueden iniciar sesión sin el código de correo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

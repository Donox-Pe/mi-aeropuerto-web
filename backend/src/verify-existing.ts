import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando a todos los usuarios existentes...');
  const result = await prisma.user.updateMany({
    data: {
      isVerified: true,
    },
  });
  console.log(`Se actualizaron ${result.count} usuarios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

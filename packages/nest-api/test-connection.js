const { PrismaClient } = require('@prisma/client');

const uri =
  'mongodb+srv://servergames:servergames@cluster0.fs7ok5r.mongodb.net/server-games?ssl=true&retryWrites=true&w=majority';

async function testConnection() {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'mongodb+srv://servergames:servergames@cluster0.fs7ok5r.mongodb.net/server-games?ssl=true&retryWrites=true&w=majority&tlsAllowInvalidCertificates=true',
        },
      },
    });

    await prisma.$connect();
    console.log('✅ Conexión exitosa a MongoDB con Prisma');

    // Probar una consulta simple
    const count = await prisma.userDashboard.count();
    console.log(`✅ Usuarios encontrados: ${count}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testConnection();

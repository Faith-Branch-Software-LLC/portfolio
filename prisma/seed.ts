import { createHash } from 'crypto';
import { prisma } from '../lib/db';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  const name = process.env.SEED_ADMIN_NAME ?? 'Sebastian Neiswanger';
  const email = process.env.SEED_ADMIN_EMAIL ?? 'sneiswanger@faithbranch.com';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD environment variable is required');
  }

  const hashedPassword = hashPassword(password);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password: hashedPassword,
    },
  });

  console.log(`Admin seeded: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

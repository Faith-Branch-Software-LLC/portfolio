import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

dotenv.config({ path: '.env.local' });
dotenv.config();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const items = [
  {
    title: 'Ferric',
    description: 'A nostalgic cassette player for iPhone. Create virtual tapes, add tracks from Apple Music or your local library, decorate with a drawing editor, and watch the reels spin through an animated cassette UI. Built with SwiftUI and AVFoundation.',
    url: '/ferric',
    images: [] as string[],
    noteRot: 1.2,
    tapeColor: 'Orange',
    order: 0,
  },
  {
    title: 'Homework Muffin',
    description: 'In 2023, I worked on Homework Muffin as a Senior Design Project. It is a web/mobile application that helps students organize their homework and study for exams.',
    url: 'https://homeworkmuffin.com',
    images: ['/scrapBookImages/hwm-1.jpg', '/scrapBookImages/hwm-2.jpg'],
    noteRot: -1.5,
    tapeColor: 'Purple',
    order: 1,
  },
  {
    title: 'Austintown Fence',
    description: 'The first project since the start of the company. We were tasked with creating a website for a local fence company. We were able to create a really nice website with admin tools to help manage the website after the project was completed. This was made using Next.js and served on AWS Amplify. I learned a lot about comunicating with clients through this process.',
    url: 'https://austintownfence.org',
    images: ['/scrapBookImages/afc-1.jpg', '/scrapBookImages/afc-2.jpg'],
    noteRot: 1,
    tapeColor: 'Red',
    order: 2,
  },
  {
    title: 'EyeOnFi',
    description: "EyeOnFi is a financial forecasting tool that helps everyday people make better financial decisions. By imputing your financial data, EyeOnFi will help you forecast your financial future, helping to make informed decisions about your finances. Also, created in Next.js, we sought to leverage SSR and CSR to make a easy and fun experience for everyone. This project is still ongoing and has it's sights on something big.",
    url: 'https://app.eyeonfi.com',
    images: ['/scrapBookImages/eof-1.jpg', '/scrapBookImages/eof-2.jpg'],
    noteRot: -0.8,
    tapeColor: 'Teal',
    order: 3,
  },
];

async function main() {
  const existing = await prisma.portfolioItem.count();
  if (existing > 0) {
    console.log(`Already have ${existing} portfolio items — skipping import`);
    const all = await prisma.portfolioItem.findMany({ orderBy: { order: 'asc' } });
    all.forEach((i) => console.log(`  [${i.order}] ${i.title} (${i.id})`));
    return;
  }

  for (const item of items) {
    const created = await prisma.portfolioItem.create({ data: item });
    console.log(`Created: ${created.title} (${created.id})`);
  }
  console.log('Import complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());

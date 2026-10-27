import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const hashedPasswordAdmin = await bcrypt.hash('Admin@123456', 10);
  const hashedPasswordTester = await bcrypt.hash('Tester@123456', 10);

  // 1. Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autoresearch.ai' },
    update: { password: hashedPasswordAdmin },
    create: {
      email: 'admin@autoresearch.ai',
      userName: 'admin',
      fullName: 'System Administrator',
      password: hashedPasswordAdmin,
    },
  });
  console.log(`👤 Admin user: ${admin.email} (id: ${admin.id})`);

  // 2. Seed Tester User
  const tester = await prisma.user.upsert({
    where: { email: 'tester@autoresearch.ai' },
    update: { password: hashedPasswordTester },
    create: {
      email: 'tester@autoresearch.ai',
      userName: 'tester',
      fullName: 'QA Tester',
      password: hashedPasswordTester,
    },
  });
  console.log(`👤 Tester user: ${tester.email} (id: ${tester.id})`);

  // 3. Seed Sample Document for Tester
  const existingDoc = await prisma.document.findFirst({
    where: { userId: tester.id, title: 'Sample Research Paper on AI in Healthcare' },
  });

  const sampleDoc = existingDoc
    ? existingDoc
    : await prisma.document.create({
        data: {
          userId: tester.id,
          title: 'Sample Research Paper on AI in Healthcare',
          field: 'Computer Science & Medicine',
          documentType: 'Research Paper',
          language: 'en',
          researchType: 'Quantitative',
          status: 'draft',
          domains: ['Artificial Intelligence', 'Healthcare'],
          subdomains: ['Medical Imaging', 'Diagnostics'],
          numberOfDomains: 2,
          numberOfSubdomains: 2,
          webSearchEnabled: true,
          proposals: {
            create: [
              {
                title: 'Deep Learning Approaches for Early Detection of Diabetic Retinopathy',
                problemStatement:
                  'Diabetic retinopathy remains a leading cause of blindness worldwide due to delayed diagnosis.',
                motivation: 'Automated screening can reduce healthcare costs and enable timely intervention.',
                researchGap: 'Lack of robust generalization across diverse patient demographics and camera types.',
                isSelected: true,
              },
            ],
          },
          keywords: {
            create: [
              {
                keywordsMain: ['Diabetic Retinopathy', 'Deep Learning', 'Computer Vision'],
                keywordsSub: ['Convolutional Neural Networks', 'Fundus Photography'],
                searchQuery: 'diabetic retinopathy deep learning detection',
                yearFrom: 2020,
                yearTo: 2026,
                onlyOpenAccess: true,
              },
            ],
          },
        },
      });
  console.log(`📄 Sample Document: ${sampleDoc.title} (id: ${sampleDoc.id})`);

  // 4. Seed Sample Reference for Tester
  const existingRef = await prisma.reference.findFirst({
    where: { userId: tester.id, title: 'Automated Detection of Diabetic Retinopathy using Deep Learning' },
  });

  if (!existingRef) {
    const sampleRef = await prisma.reference.create({
      data: {
        userId: tester.id,
        title: 'Automated Detection of Diabetic Retinopathy using Deep Learning',
        authors: 'Gulshan, V., Peng, L., Coram, M., et al.',
        journal: 'JAMA',
        year: 2021,
        openAccess: true,
        downloadedStatus: 'downloaded',
        url: 'https://doi.org/10.1001/jama.2016.17216',
        citation: 1540,
        abstract: 'A deep learning algorithm was trained to detect diabetic retinopathy in retinal fundus photographs.',
        documentReferences: {
          create: {
            documentId: sampleDoc.id,
          },
        },
      },
    });
    console.log(`📚 Sample Reference: ${sampleRef.title} (id: ${sampleRef.id})`);
  } else {
    console.log(`📚 Sample Reference already exists: ${existingRef.title}`);
  }

  console.log('✅ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

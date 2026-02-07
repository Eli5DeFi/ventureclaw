import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample VCs
  console.log('Creating VCs...');
  
  const vc1 = await prisma.vC.upsert({
    where: { email: 'partner@a16z.example' },
    update: {},
    create: {
      name: 'Marc Anderson',
      firmName: 'Andreessen Horowitz',
      email: 'partner@a16z.example',
      fundSize: '$7.2B',
      focusAreas: JSON.stringify(['AI', 'Blockchain', 'SaaS', 'FinTech']),
      stagePreference: JSON.stringify(['MVP', 'GROWTH', 'SCALE']),
      investmentRangeMin: 500000,
      investmentRangeMax: 50000000,
      thesis: 'Software is eating the world. We invest in founders building category-defining companies.',
      portfolio: JSON.stringify(['Airbnb', 'Stripe', 'Coinbase', 'Instacart']),
      personaName: 'Marc AI',
      personaPersonality: 'Analytical, visionary, focused on market size and founder quality',
      personaStyle: 'Direct and thorough. Asks hard questions about defensibility and scale.',
      riskTolerance: 'AGGRESSIVE',
      priorities: JSON.stringify(['Large TAM', 'Exceptional founders', 'Network effects', 'Technical moats']),
    },
  });

  const vc2 = await prisma.vC.upsert({
    where: { email: 'gp@sequoia.example' },
    update: {},
    create: {
      name: 'Roelof Botha',
      firmName: 'Sequoia Capital',
      email: 'gp@sequoia.example',
      fundSize: '$8.5B',
      focusAreas: JSON.stringify(['Enterprise SaaS', 'Consumer', 'HealthTech']),
      stagePreference: JSON.stringify(['GROWTH', 'SCALE']),
      investmentRangeMin: 2000000,
      investmentRangeMax: 100000000,
      thesis: 'Help daring founders build legendary companies from idea to IPO and beyond.',
      portfolio: JSON.stringify(['Apple', 'Google', 'PayPal', 'YouTube', 'WhatsApp']),
      personaName: 'Sequoia Scout',
      personaPersonality: 'Patient, strategic, focused on long-term value creation',
      personaStyle: 'Collaborative and supportive. Values sustainable growth over hype.',
      riskTolerance: 'MODERATE',
      priorities: JSON.stringify(['Product-market fit', 'Unit economics', 'Team cohesion', 'Capital efficiency']),
    },
  });

  const vc3 = await prisma.vC.upsert({
    where: { email: 'invest@ycombinator.example' },
    update: {},
    create: {
      name: 'Garry Tan',
      firmName: 'Y Combinator',
      email: 'invest@ycombinator.example',
      fundSize: '$500M',
      focusAreas: JSON.stringify(['AI', 'SaaS', 'Blockchain', 'HealthTech', 'FinTech', 'Climate Tech']),
      stagePreference: JSON.stringify(['IDEA', 'MVP']),
      investmentRangeMin: 125000,
      investmentRangeMax: 500000,
      thesis: 'We help startups with funding, advice, and a strong alumni network.',
      portfolio: JSON.stringify(['Airbnb', 'Stripe', 'Coinbase', 'Reddit', 'Instacart', 'DoorDash']),
      personaName: 'YC Bot',
      personaPersonality: 'Pragmatic, founder-friendly, focused on rapid iteration',
      personaStyle: 'Fast decisions. Bet on teams over ideas. Growth mindset.',
      riskTolerance: 'AGGRESSIVE',
      priorities: JSON.stringify(['Founder determination', 'Growth rate', 'Clear vision', 'Speed of execution']),
    },
  });

  console.log('✅ Created 3 VCs');

  // Create sample startups
  console.log('Creating sample startups...');

  const startup1 = await prisma.startup.create({
    data: {
      name: 'NeuralFlow AI',
      tagline: 'AI-powered workflow automation for enterprises',
      description: 'NeuralFlow uses advanced machine learning to automatically optimize business workflows. Our platform learns from your team\'s patterns and suggests process improvements that save 10+ hours per employee per week. We\'ve already deployed at 5 Fortune 500 companies with 95% retention.',
      stage: 'GROWTH',
      industry: 'AI / Machine Learning',
      fundingAsk: 5000000,
      teamSize: 12,
      founderName: 'Sarah Chen',
      founderEmail: 'sarah@neuralflow.example',
      website: 'https://neuralflow.example',
      status: 'PENDING',
    },
  });

  const startup2 = await prisma.startup.create({
    data: {
      name: 'GreenLedger',
      tagline: 'Blockchain-based carbon credit marketplace',
      description: 'GreenLedger tokenizes carbon credits to create a transparent, liquid marketplace for carbon offsets. We\'ve partnered with 50+ verified carbon capture projects and processed $2M in trades. Our goal is to make carbon trading accessible to any business.',
      stage: 'MVP',
      industry: 'Blockchain / Web3',
      fundingAsk: 2000000,
      teamSize: 8,
      founderName: 'Alex Rivera',
      founderEmail: 'alex@greenledger.example',
      website: 'https://greenledger.example',
      status: 'PENDING',
    },
  });

  const startup3 = await prisma.startup.create({
    data: {
      name: 'HealthOS',
      tagline: 'Operating system for modern healthcare practices',
      description: 'HealthOS is an all-in-one platform for medical practices: EHR, scheduling, billing, telehealth, and patient engagement. We\'re HIPAA compliant and already serving 200+ clinics. Our AI assistant automates 70% of administrative tasks.',
      stage: 'SCALE',
      industry: 'HealthTech',
      fundingAsk: 10000000,
      teamSize: 25,
      founderName: 'Dr. Michael Zhang',
      founderEmail: 'michael@healthos.example',
      website: 'https://healthos.example',
      status: 'PENDING',
    },
  });

  console.log('✅ Created 3 sample startups');

  console.log('');
  console.log('🎉 Seed data created successfully!');
  console.log('');
  console.log('Sample VCs:');
  console.log('- Andreessen Horowitz (a16z)');
  console.log('- Sequoia Capital');
  console.log('- Y Combinator');
  console.log('');
  console.log('Sample Startups:');
  console.log('- NeuralFlow AI (Growth stage, $5M ask)');
  console.log('- GreenLedger (MVP stage, $2M ask)');
  console.log('- HealthOS (Scale stage, $10M ask)');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000');
  console.log('3. Test analysis on any startup at /pitch/[id]');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

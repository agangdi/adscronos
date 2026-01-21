import { PrismaClient, AdEventType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample advertiser
  const advertiserPassword = await bcrypt.hash('password123', 10);
  const advertiser = await prisma.advertiser.upsert({
    where: { authEmail: 'advertiser@example.com' },
    update: {},
    create: {
      name: 'Acme Corp',
      contactEmail: 'contact@acme.com',
      authEmail: 'advertiser@example.com',
      passwordHash: advertiserPassword,
      website: 'https://acme.com',
      apiKey: 'adv_' + Math.random().toString(36).substring(2, 15),
      timezone: 'America/New_York',
    },
  });

  // Create sample publisher
  const publisherPassword = await bcrypt.hash('password123', 10);
  const publisher = await prisma.publisher.upsert({
    where: { authEmail: 'publisher@example.com' },
    update: {},
    create: {
      siteName: 'Tech News Daily',
      domain: 'technewsdaily.com',
      authEmail: 'publisher@example.com',
      passwordHash: publisherPassword,
      appId: 'app_' + Math.random().toString(36).substring(2, 15),
      apiKey: 'pub_' + Math.random().toString(36).substring(2, 15),
      timezone: 'America/Los_Angeles',
      webhookUrl: 'https://technewsdaily.com/webhooks/ads',
    },
  });

  // Create sample ad units
  const adUnit1 = await prisma.adUnit.upsert({
    where: { 
      publisherId_key: {
        publisherId: publisher.id,
        key: 'header-banner'
      }
    },
    update: {},
    create: {
      publisherId: publisher.id,
      key: 'header-banner',
      adType: 'IMAGE',
      description: 'Header banner ad unit',
    },
  });

  const adUnit2 = await prisma.adUnit.upsert({
    where: { 
      publisherId_key: {
        publisherId: publisher.id,
        key: 'sidebar-video'
      }
    },
    update: {},
    create: {
      publisherId: publisher.id,
      key: 'sidebar-video',
      adType: 'VIDEO',
      description: 'Sidebar video ad unit',
    },
  });

  // Create sample campaigns
  const campaign1 = await prisma.campaign.upsert({
    where: { id: 'camp_sample_1' },
    update: {},
    create: {
      id: 'camp_sample_1',
      advertiserId: advertiser.id,
      name: 'Holiday Sale Campaign',
      description: 'Promote our holiday sale with 50% off',
      status: 'ACTIVE',
      budgetCents: 500000, // $5000
      spendCents: 125000,  // $1250 spent
      startAt: new Date('2024-12-01'),
      endAt: new Date('2024-12-31'),
      targetingConfig: {
        demographics: ['18-35', '36-50'],
        interests: ['technology', 'shopping'],
        locations: ['US', 'CA']
      },
    },
  });

  const campaign2 = await prisma.campaign.upsert({
    where: { id: 'camp_sample_2' },
    update: {},
    create: {
      id: 'camp_sample_2',
      advertiserId: advertiser.id,
      name: 'Brand Awareness Q4',
      description: 'Increase brand awareness for Q4',
      status: 'PAUSED',
      budgetCents: 300000, // $3000
      spendCents: 45000,   // $450 spent
      startAt: new Date('2024-10-01'),
      endAt: new Date('2024-12-31'),
    },
  });

  // Create sample creatives
  const creative1 = await prisma.creative.upsert({
    where: { id: 'creative_sample_1' },
    update: {},
    create: {
      id: 'creative_sample_1',
      advertiserId: advertiser.id,
      campaignId: campaign1.id,
      name: 'Holiday Banner - Red',
      type: 'IMAGE',
      status: 'APPROVED',
      assetUrl: 'https://cdn.acme.com/ads/holiday-banner-red.jpg',
      clickUrl: 'https://acme.com/sale',
      width: 728,
      height: 90,
    },
  });

  const creative2 = await prisma.creative.upsert({
    where: { id: 'creative_sample_2' },
    update: {},
    create: {
      id: 'creative_sample_2',
      advertiserId: advertiser.id,
      campaignId: campaign1.id,
      name: 'Holiday Banner - Blue',
      type: 'IMAGE',
      status: 'APPROVED',
      assetUrl: 'https://cdn.acme.com/ads/holiday-banner-blue.jpg',
      clickUrl: 'https://acme.com/sale',
      width: 728,
      height: 90,
    },
  });

  const creative3 = await prisma.creative.upsert({
    where: { id: 'creative_sample_3' },
    update: {},
    create: {
      id: 'creative_sample_3',
      advertiserId: advertiser.id,
      campaignId: campaign2.id,
      name: 'Brand Video 30s',
      type: 'VIDEO',
      status: 'PENDING_APPROVAL',
      assetUrl: 'https://cdn.acme.com/ads/brand-video-30s.mp4',
      clickUrl: 'https://acme.com',
      durationMs: 30000,
      width: 1920,
      height: 1080,
    },
  });

  // Create serving configs
  await prisma.servingConfig.upsert({
    where: {
      campaignId_adUnitId: {
        campaignId: campaign1.id,
        adUnitId: adUnit1.id,
      }
    },
    update: {},
    create: {
      campaignId: campaign1.id,
      adUnitId: adUnit1.id,
      pricingModel: 'CPM',
      priceCents: 250, // $2.50 CPM
      status: 'ACTIVE',
    },
  });

  await prisma.servingConfig.upsert({
    where: {
      campaignId_adUnitId: {
        campaignId: campaign1.id,
        adUnitId: adUnit2.id,
      }
    },
    update: {},
    create: {
      campaignId: campaign1.id,
      adUnitId: adUnit2.id,
      pricingModel: 'CPV',
      priceCents: 500, // $5.00 CPV
      status: 'ACTIVE',
    },
  });

  // Create sample ad events
  const baseDate = new Date('2024-12-01');
  const events = [];
  
  for (let i = 0; i < 30; i++) {
    const eventDate = new Date(baseDate);
    eventDate.setDate(baseDate.getDate() + i);
    
    // Generate random impressions and clicks for each day
    const impressions = Math.floor(Math.random() * 1000) + 500;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
    const completes = Math.floor(clicks * (Math.random() * 0.8 + 0.2)); // 20-100% completion rate
    
    for (let j = 0; j < impressions; j++) {
      events.push({
        eventType: AdEventType.IMPRESSION,
        publisherId: publisher.id,
        adUnitId: Math.random() > 0.5 ? adUnit1.id : adUnit2.id,
        campaignId: Math.random() > 0.3 ? campaign1.id : campaign2.id,
        creativeId: Math.random() > 0.5 ? creative1.id : creative2.id,
        advertiserId: advertiser.id,
        ts: new Date(eventDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        ipHash: 'hash_' + Math.random().toString(36).substring(2, 10),
        uaHash: 'ua_' + Math.random().toString(36).substring(2, 10),
      });
    }
    
    for (let j = 0; j < clicks; j++) {
      events.push({
        eventType: AdEventType.CLICK,
        publisherId: publisher.id,
        adUnitId: Math.random() > 0.5 ? adUnit1.id : adUnit2.id,
        campaignId: Math.random() > 0.3 ? campaign1.id : campaign2.id,
        creativeId: Math.random() > 0.5 ? creative1.id : creative2.id,
        advertiserId: advertiser.id,
        ts: new Date(eventDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        ipHash: 'hash_' + Math.random().toString(36).substring(2, 10),
        uaHash: 'ua_' + Math.random().toString(36).substring(2, 10),
      });
    }
  }

  // Insert events in batches
  console.log(`📊 Creating ${events.length} sample ad events...`);
  const batchSize = 1000;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    await prisma.adEvent.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  // Create daily rollups
  console.log('📈 Creating daily rollup data...');
  for (let i = 0; i < 30; i++) {
    const rollupDate = new Date(baseDate);
    rollupDate.setDate(baseDate.getDate() + i);
    rollupDate.setHours(0, 0, 0, 0); // Set to start of day
    
    const impressions = Math.floor(Math.random() * 1000) + 500;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
    const completes = Math.floor(clicks * (Math.random() * 0.8 + 0.2));
    const spendCents = Math.floor((impressions * 250) / 1000); // Based on $2.50 CPM
    
    await prisma.adEventRollupDaily.upsert({
      where: {
        id: `rollup_${rollupDate.toISOString().split('T')[0]}_${campaign1.id}_${publisher.id}`,
      },
      update: {},
      create: {
        id: `rollup_${rollupDate.toISOString().split('T')[0]}_${campaign1.id}_${publisher.id}`,
        date: rollupDate,
        publisherId: publisher.id,
        adUnitId: adUnit1.id,
        campaignId: campaign1.id,
        creativeId: creative1.id,
        impressions,
        clicks,
        completes,
        spendCents,
      },
    });
  }

  // Create sample billing records
  await prisma.billing.upsert({
    where: { id: 'billing_sample_1' },
    update: {},
    create: {
      id: 'billing_sample_1',
      advertiserId: advertiser.id,
      amountCents: 125000, // $1250
      status: 'PAID',
      description: 'Holiday Sale Campaign - November',
      paymentMethod: 'Credit Card',
      transactionId: 'txn_' + Math.random().toString(36).substring(2, 15),
      paidAt: new Date('2024-12-01'),
    },
  });

  await prisma.billing.upsert({
    where: { id: 'billing_sample_2' },
    update: {},
    create: {
      id: 'billing_sample_2',
      advertiserId: advertiser.id,
      amountCents: 45000, // $450
      status: 'PENDING',
      description: 'Brand Awareness Q4 - December',
      paymentMethod: 'Credit Card',
      dueDate: new Date('2024-12-15'),
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Sample Data Created:');
  console.log(`👤 Advertiser: ${advertiser.authEmail} (password: password123)`);
  console.log(`📰 Publisher: ${publisher.authEmail} (password: password123)`);
  console.log(`📊 Campaigns: ${campaign1.name}, ${campaign2.name}`);
  console.log(`🎨 Creatives: 3 sample creatives`);
  console.log(`📈 Events: ${events.length} ad events`);
  console.log(`💰 Billing: 2 sample billing records`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

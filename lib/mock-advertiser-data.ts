// Mock data for advertiser dashboard, analytics, and billing pages
// This ensures consistent data across all pages

export interface MockCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  budgetCents: number;
  creativeCount: number;
}

export interface MockCreative {
  id: string;
  name: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  campaignId: string;
}

export interface MockDailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  completes: number;
}

export interface MockBillingRecord {
  id: string;
  amountCents: number;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  description: string;
  createdAt: string;
  dueDate: string;
}

// Base campaigns data
export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: 'camp-001',
    name: 'Summer Product Launch 2024',
    status: 'ACTIVE',
    budgetCents: 5000, // $50
    creativeCount: 3,
  },
  {
    id: 'camp-002',
    name: 'Brand Awareness Q1',
    status: 'ACTIVE',
    budgetCents: 3000, // $30
    creativeCount: 2,
  },
  {
    id: 'camp-003',
    name: 'Holiday Special Promotion',
    status: 'PAUSED',
    budgetCents: 2000, // $20
    creativeCount: 4,
  },
  {
    id: 'camp-004',
    name: 'New Customer Acquisition',
    status: 'ACTIVE',
    budgetCents: 7500, // $75
    creativeCount: 5,
  },
  {
    id: 'camp-005',
    name: 'Retargeting Campaign',
    status: 'COMPLETED',
    budgetCents: 1500, // $15
    creativeCount: 2,
  },
];

// Base creatives data
export const MOCK_CREATIVES: MockCreative[] = [
  { id: 'cr-001', name: 'Summer Banner 1', status: 'APPROVED', campaignId: 'camp-001' },
  { id: 'cr-002', name: 'Summer Video Ad', status: 'APPROVED', campaignId: 'camp-001' },
  { id: 'cr-003', name: 'Summer Text Ad', status: 'PENDING_APPROVAL', campaignId: 'camp-001' },
  { id: 'cr-004', name: 'Brand Logo Banner', status: 'APPROVED', campaignId: 'camp-002' },
  { id: 'cr-005', name: 'Brand Video', status: 'APPROVED', campaignId: 'camp-002' },
  { id: 'cr-006', name: 'Holiday Banner 1', status: 'APPROVED', campaignId: 'camp-003' },
  { id: 'cr-007', name: 'Holiday Banner 2', status: 'APPROVED', campaignId: 'camp-003' },
  { id: 'cr-008', name: 'Holiday Video', status: 'DRAFT', campaignId: 'camp-003' },
  { id: 'cr-009', name: 'Holiday Text Ad', status: 'APPROVED', campaignId: 'camp-003' },
  { id: 'cr-010', name: 'Acquisition Banner', status: 'APPROVED', campaignId: 'camp-004' },
  { id: 'cr-011', name: 'Acquisition Video 1', status: 'APPROVED', campaignId: 'camp-004' },
  { id: 'cr-012', name: 'Acquisition Video 2', status: 'APPROVED', campaignId: 'camp-004' },
  { id: 'cr-013', name: 'Acquisition Text Ad', status: 'PENDING_APPROVAL', campaignId: 'camp-004' },
  { id: 'cr-014', name: 'Acquisition Display', status: 'APPROVED', campaignId: 'camp-004' },
  { id: 'cr-015', name: 'Retargeting Banner', status: 'APPROVED', campaignId: 'camp-005' },
  { id: 'cr-016', name: 'Retargeting Video', status: 'APPROVED', campaignId: 'camp-005' },
];

// Generate daily metrics for the last 90 days
function generateDailyMetrics(days: number): MockDailyMetric[] {
  const metrics: MockDailyMetric[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic varying metrics (reduced by 100x)
    const baseImpressions = 80 + Math.floor(Math.random() * 40);
    const clickRate = 0.02 + Math.random() * 0.03; // 2-5% CTR
    const clicks = Math.floor(baseImpressions * clickRate);
    const completeRate = 0.6 + Math.random() * 0.3; // 60-90% completion
    const completes = Math.floor(clicks * completeRate);
    const cpm = 2.5 + Math.random() * 2.5; // $2.5-$5 CPM
    const spendCents = Math.floor((baseImpressions / 1000) * cpm * 100);
    
    metrics.push({
      date: date.toISOString().split('T')[0],
      impressions: baseImpressions,
      clicks,
      spendCents,
      completes,
    });
  }
  
  return metrics;
}

// All daily metrics (90 days)
export const MOCK_DAILY_METRICS = generateDailyMetrics(90);

// Campaign-specific performance
export const MOCK_CAMPAIGN_PERFORMANCE = MOCK_CAMPAIGNS.map((campaign) => {
  const activeDays = campaign.status === 'COMPLETED' ? 60 : campaign.status === 'PAUSED' ? 45 : 30;
  
  // Calculate performance based on campaign (reduced by 100x)
  const dailyImpressions = campaign.status === 'ACTIVE' ? 25 + Math.random() * 15 : 
                          campaign.status === 'PAUSED' ? 15 + Math.random() * 5 : 10;
  const totalImpressions = Math.floor(dailyImpressions * activeDays);
  const ctr = 0.025 + Math.random() * 0.02; // 2.5-4.5%
  const totalClicks = Math.floor(totalImpressions * ctr);
  const cpm = 3 + Math.random() * 2; // $3-$5 CPM
  const totalSpendCents = Math.floor((totalImpressions / 1000) * cpm * 100);
  
  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    impressions: totalImpressions,
    clicks: totalClicks,
    spendCents: totalSpendCents,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
  };
});

// Billing records
export const MOCK_BILLING_RECORDS: MockBillingRecord[] = [
  {
    id: 'bill-001',
    amountCents: 1250, // $12.50
    status: 'PAID',
    description: 'Ad Campaign - Summer Product Launch',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill-002',
    amountCents: 875, // $8.75
    status: 'PAID',
    description: 'Ad Campaign - Brand Awareness Q1',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill-003',
    amountCents: 1560, // $15.60
    status: 'PAID',
    description: 'Ad Campaign - New Customer Acquisition',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill-004',
    amountCents: 450, // $4.50
    status: 'PAID',
    description: 'Ad Campaign - Holiday Special Promotion',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill-005',
    amountCents: 980, // $9.80
    status: 'PENDING',
    description: 'Ad Campaign - Multiple Campaigns',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill-006',
    amountCents: 670, // $6.70
    status: 'PAID',
    description: 'Ad Campaign - Retargeting Campaign',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill-007',
    amountCents: 1120, // $11.20
    status: 'PAID',
    description: 'Ad Campaign - Summer Product Launch',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now()).toISOString(),
  },
];

// Helper functions
export function getMockAdvertiserData() {
  const totalImpressions = MOCK_DAILY_METRICS.reduce((sum, day) => sum + day.impressions, 0);
  const totalClicks = MOCK_DAILY_METRICS.reduce((sum, day) => sum + day.clicks, 0);
  const totalSpendCents = MOCK_DAILY_METRICS.reduce((sum, day) => sum + day.spendCents, 0);
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  
  return {
    campaigns: MOCK_CAMPAIGNS,
    creatives: MOCK_CREATIVES,
    totalImpressions,
    totalClicks,
    totalSpendCents,
    ctr,
  };
}

export function getMockAnalyticsData(days: number = 30) {
  const recentMetrics = MOCK_DAILY_METRICS.slice(-days);
  const totalImpressions = recentMetrics.reduce((sum, day) => sum + day.impressions, 0);
  const totalClicks = recentMetrics.reduce((sum, day) => sum + day.clicks, 0);
  const totalSpendCents = recentMetrics.reduce((sum, day) => sum + day.spendCents, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPM = totalImpressions > 0 ? (totalSpendCents / 100 / totalImpressions) * 1000 : 0;
  const avgCPC = totalClicks > 0 ? (totalSpendCents / 100) / totalClicks : 0;
  
  return {
    totalImpressions,
    totalClicks,
    totalSpend: totalSpendCents,
    avgCTR,
    avgCPM,
    avgCPC,
    dailyMetrics: recentMetrics.map(day => ({
      date: day.date,
      impressions: day.impressions,
      clicks: day.clicks,
      spendCents: day.spendCents,
      ctr: day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0,
    })),
    campaignMetrics: MOCK_CAMPAIGN_PERFORMANCE,
  };
}

export function getMockBillingData() {
  const totalSpendCents = MOCK_BILLING_RECORDS.reduce((sum, record) => sum + record.amountCents, 0);
  const pendingAmount = MOCK_BILLING_RECORDS
    .filter(r => r.status === 'PENDING')
    .reduce((sum, record) => sum + record.amountCents, 0);
  const nextPendingBill = MOCK_BILLING_RECORDS
    .filter(r => r.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  
  return {
    records: MOCK_BILLING_RECORDS,
    totalSpend: totalSpendCents,
    currentBalance: pendingAmount,
    nextPaymentDate: nextPendingBill?.dueDate || null,
  };
}

export function getMockCampaignStats() {
  const stats = MOCK_CAMPAIGNS.reduce((acc, campaign) => {
    const existing = acc.find(s => s.status === campaign.status);
    if (existing) {
      existing._count++;
    } else {
      acc.push({ status: campaign.status, _count: 1 });
    }
    return acc;
  }, [] as Array<{ status: string; _count: number }>);
  
  return stats;
}

export function getMockCreativeStats() {
  const stats = MOCK_CREATIVES.reduce((acc, creative) => {
    const existing = acc.find(s => s.status === creative.status);
    if (existing) {
      existing._count++;
    } else {
      acc.push({ status: creative.status, _count: 1 });
    }
    return acc;
  }, [] as Array<{ status: string; _count: number }>);
  
  return stats;
}

export function getMockCampaignPerformance() {
  return MOCK_CAMPAIGNS.map(campaign => {
    const performance = MOCK_CAMPAIGN_PERFORMANCE.find(p => p.campaignId === campaign.id);
    return {
      ...campaign,
      creatives: MOCK_CREATIVES.filter(c => c.campaignId === campaign.id),
      performance: {
        impressions: performance?.impressions || 0,
        clicks: performance?.clicks || 0,
        spendCents: performance?.spendCents || 0,
      },
    };
  });
}

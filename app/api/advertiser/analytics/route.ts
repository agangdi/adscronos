import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/middleware';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '@/lib/middleware';

// Get analytics for advertiser
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Limit to 90 days max
    const maxDays = Math.min(days, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxDays);

    // Get overall metrics
    const overallMetrics = await prisma.adEventRollupDaily.aggregate({
      where: {
        campaign: {
          advertiserId: req.user!.id,
        },
        date: {
          gte: startDate,
        },
      },
      _sum: {
        impressions: true,
        clicks: true,
        spendCents: true,
      },
    });

    const totalImpressions = overallMetrics._sum.impressions || 0;
    const totalClicks = overallMetrics._sum.clicks || 0;
    const totalSpend = overallMetrics._sum.spendCents || 0;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Get daily metrics
    const dailyMetrics = await prisma.adEventRollupDaily.findMany({
      where: {
        campaign: {
          advertiserId: req.user!.id,
        },
        date: {
          gte: startDate,
        },
      },
      select: {
        date: true,
        impressions: true,
        clicks: true,
        spendCents: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Get campaign metrics
    const campaignMetrics = await prisma.adEventRollupDaily.groupBy({
      by: ['campaignId'],
      where: {
        campaign: {
          advertiserId: req.user!.id,
        },
        date: {
          gte: startDate,
        },
      },
      _sum: {
        impressions: true,
        clicks: true,
        spendCents: true,
      },
    });

    // Get campaign names
    const campaignIds = campaignMetrics.map(m => m.campaignId);
    const campaigns = await prisma.campaign.findMany({
      where: {
        id: { in: campaignIds },
        advertiserId: req.user!.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

    // Format daily metrics
    const formattedDailyMetrics = dailyMetrics.map(day => {
      const impressions = day.impressions || 0;
      const clicks = day.clicks || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return {
        date: day.date.toISOString().split('T')[0],
        impressions,
        clicks,
        spendCents: day.spendCents || 0,
        ctr: parseFloat(ctr.toFixed(2)),
      };
    });

    // Format campaign metrics
    const formattedCampaignMetrics = campaignMetrics.map(campaign => {
      const impressions = campaign._sum.impressions || 0;
      const clicks = campaign._sum.clicks || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return {
        campaignId: campaign.campaignId,
        campaignName: campaignMap.get(campaign.campaignId) || 'Unknown Campaign',
        impressions,
        clicks,
        spendCents: campaign._sum.spendCents || 0,
        ctr: parseFloat(ctr.toFixed(2)),
      };
    });

    return NextResponse.json({
      totalImpressions,
      totalClicks,
      totalSpend,
      avgCTR: parseFloat(avgCTR.toFixed(2)),
      avgCPM: parseFloat(avgCPM.toFixed(2)),
      avgCPC: parseFloat(avgCPC.toFixed(2)),
      dailyMetrics: formattedDailyMetrics,
      campaignMetrics: formattedCampaignMetrics,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware - only advertisers can access
export const GET = createApiHandler(handleGET, {
  auth: 'role-specific',
  specificRole: UserRole.ADVERTISER,
  rateLimit: 'api',
});

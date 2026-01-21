import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/middleware";
import { UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "@/lib/middleware";

// Get platform-wide analytics (admin only)
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get platform overview metrics
    const [
      totalAdvertisers,
      totalPublishers,
      totalCampaigns,
      totalCreatives,
      totalAdUnits,
      platformMetrics
    ] = await Promise.all([
      prisma.advertiser.count({ where: { role: UserRole.ADVERTISER } }),
      prisma.publisher.count({ where: { role: UserRole.PUBLISHER } }),
      prisma.campaign.count(),
      prisma.creative.count(),
      prisma.adUnit.count(),
      prisma.adEventRollupDaily.aggregate({
        where: {
          date: { gte: startDate }
        },
        _sum: {
          impressions: true,
          clicks: true,
          completes: true,
          spendCents: true,
          revenueCents: true,
        },
      })
    ]);

    // Get recent activity
    const recentCampaigns = await prisma.campaign.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        advertiser: {
          select: { name: true, authEmail: true }
        }
      }
    });

    const recentCreatives = await prisma.creative.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: {
          select: { name: true }
        }
      }
    });

    // Calculate derived metrics
    const totalImpressions = platformMetrics._sum.impressions || 0;
    const totalClicks = platformMetrics._sum.clicks || 0;
    const totalSpend = platformMetrics._sum.spendCents || 0;
    const totalRevenue = platformMetrics._sum.revenueCents || 0;

    const platformCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const platformCPM = totalImpressions > 0 ? (totalSpend / totalImpressions * 1000) : 0;
    const platformRPM = totalImpressions > 0 ? (totalRevenue / totalImpressions * 1000) : 0;

    // Get daily trends
    const dailyTrends = await prisma.adEventRollupDaily.groupBy({
      by: ['date'],
      where: {
        date: { gte: startDate }
      },
      _sum: {
        impressions: true,
        clicks: true,
        spendCents: true,
        revenueCents: true,
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({
      overview: {
        totalAdvertisers,
        totalPublishers,
        totalCampaigns,
        totalCreatives,
        totalAdUnits,
        totalImpressions,
        totalClicks,
        totalSpend: totalSpend / 100, // Convert to dollars
        totalRevenue: totalRevenue / 100, // Convert to dollars
        platformCTR: Number(platformCTR.toFixed(2)),
        platformCPM: Number(platformCPM.toFixed(2)),
        platformRPM: Number(platformRPM.toFixed(2)),
      },
      recentActivity: {
        campaigns: recentCampaigns,
        creatives: recentCreatives,
      },
      trends: dailyTrends.map(day => ({
        date: day.date,
        impressions: day._sum.impressions || 0,
        clicks: day._sum.clicks || 0,
        spend: (day._sum.spendCents || 0) / 100,
        revenue: (day._sum.revenueCents || 0) / 100,
        ctr: day._sum.impressions ? ((day._sum.clicks || 0) / day._sum.impressions * 100) : 0,
      })),
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Admin analytics GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware - only admins can access
export const GET = createApiHandler(handleGET, {
  auth: 'role-specific',
  specificRole: UserRole.ADMIN,
  rateLimit: 'api',
});

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/middleware";
import { UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "@/lib/middleware";

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(["day", "hour", "campaign", "creative", "adUnit"]).default("day"),
  campaignId: z.string().optional(),
  creativeId: z.string().optional(),
  adUnitId: z.string().optional(),
  publisherId: z.string().optional(),
  metrics: z.array(z.enum(["impressions", "clicks", "completes", "skips", "spend", "ctr", "cpm"])).default(["impressions", "clicks", "ctr"]),
});

// Get analytics data
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse metrics array from comma-separated string
    if (queryParams.metrics) {
      queryParams.metrics = queryParams.metrics.split(',');
    }

    const parsed = analyticsQuerySchema.parse(queryParams);
    
    const startDate = new Date(parsed.startDate);
    const endDate = new Date(parsed.endDate);

    // Validate date range (max 90 days)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return NextResponse.json(
        { error: "Date range cannot exceed 90 days" },
        { status: 400 }
      );
    }

    // Build where clause based on user role and filters
    const baseWhere: Record<string, any> = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Role-based filtering
    if (req.user!.role === UserRole.ADVERTISER) {
      // Advertisers can only see their own campaigns
      const advertiserCampaigns = await prisma.campaign.findMany({
        where: { advertiserId: req.user!.id },
        select: { id: true },
      });
      baseWhere.campaignId = {
        in: advertiserCampaigns.map(c => c.id),
      };
    } else if (req.user!.role === UserRole.PUBLISHER) {
      // Publishers can only see their own ad units
      baseWhere.publisherId = req.user!.id;
    }

    // Apply additional filters
    if (parsed.campaignId) {
      if (req.user!.role === UserRole.ADVERTISER) {
        // Verify campaign ownership
        const campaign = await prisma.campaign.findFirst({
          where: { id: parsed.campaignId, advertiserId: req.user!.id },
        });
        if (!campaign) {
          return NextResponse.json(
            { error: "Campaign not found or access denied" },
            { status: 404 }
          );
        }
      }
      baseWhere.campaignId = parsed.campaignId;
    }

    if (parsed.creativeId) {
      baseWhere.creativeId = parsed.creativeId;
    }

    if (parsed.adUnitId) {
      if (req.user!.role === UserRole.PUBLISHER) {
        // Verify ad unit ownership
        const adUnit = await prisma.adUnit.findFirst({
          where: { id: parsed.adUnitId, publisherId: req.user!.id },
        });
        if (!adUnit) {
          return NextResponse.json(
            { error: "Ad unit not found or access denied" },
            { status: 404 }
          );
        }
      }
      baseWhere.adUnitId = parsed.adUnitId;
    }

    if (parsed.publisherId && req.user!.role === UserRole.ADMIN) {
      baseWhere.publisherId = parsed.publisherId;
    }

    // Determine grouping
    let groupBy: Record<string, any> = {};
    let orderBy: Record<string, any> = {};

    switch (parsed.groupBy) {
      case "day":
        groupBy = { date: true };
        orderBy = { date: "asc" };
        break;
      case "campaign":
        groupBy = { campaignId: true };
        orderBy = { campaignId: "asc" };
        break;
      case "creative":
        groupBy = { creativeId: true };
        orderBy = { creativeId: "asc" };
        break;
      case "adUnit":
        groupBy = { adUnitId: true };
        orderBy = { adUnitId: "asc" };
        break;
    }

    // Aggregate data
    const aggregateData = await prisma.adEventRollupDaily.groupBy({
      by: Object.keys(groupBy) as any,
      where: baseWhere,
      _sum: {
        impressions: true,
        clicks: true,
        completes: true,
        skips: true,
        spendCents: true,
      },
      orderBy,
    });

    // Calculate derived metrics and format response
    const analyticsData = await Promise.all(
      aggregateData.map(async (item) => {
        const impressions = item._sum.impressions || 0;
        const clicks = item._sum.clicks || 0;
        const spendCents = item._sum.spendCents || 0;

        const result: Record<string, any> = {
          ...item,
          metrics: {},
        };

        // Add requested metrics
        if (parsed.metrics.includes("impressions")) {
          result.metrics.impressions = impressions;
        }
        if (parsed.metrics.includes("clicks")) {
          result.metrics.clicks = clicks;
        }
        if (parsed.metrics.includes("completes")) {
          result.metrics.completes = item._sum.completes || 0;
        }
        if (parsed.metrics.includes("skips")) {
          result.metrics.skips = item._sum.skips || 0;
        }
        if (parsed.metrics.includes("spend")) {
          result.metrics.spend = spendCents / 100; // Convert to dollars
        }
        if (parsed.metrics.includes("ctr")) {
          result.metrics.ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
        }
        if (parsed.metrics.includes("cpm")) {
          result.metrics.cpm = impressions > 0 ? (spendCents / impressions * 1000) / 100 : 0;
        }

        // Add metadata based on grouping
        if (parsed.groupBy === "campaign" && item.campaignId) {
          const campaign = await prisma.campaign.findUnique({
            where: { id: item.campaignId },
            select: { name: true, status: true },
          });
          result.campaign = campaign;
        }

        if (parsed.groupBy === "creative" && item.creativeId) {
          const creative = await prisma.creative.findUnique({
            where: { id: item.creativeId },
            select: { name: true, type: true, status: true },
          });
          result.creative = creative;
        }

        if (parsed.groupBy === "adUnit" && item.adUnitId) {
          const adUnit = await prisma.adUnit.findUnique({
            where: { id: item.adUnitId },
            select: { key: true, adType: true },
            include: {
              publisher: {
                select: { siteName: true },
              },
            },
          });
          result.adUnit = adUnit;
        }

        return result;
      })
    );

    // Calculate totals
    const totals = aggregateData.reduce(
      (acc, item) => ({
        impressions: acc.impressions + (item._sum.impressions || 0),
        clicks: acc.clicks + (item._sum.clicks || 0),
        completes: acc.completes + (item._sum.completes || 0),
        skips: acc.skips + (item._sum.skips || 0),
        spendCents: acc.spendCents + (item._sum.spendCents || 0),
      }),
      { impressions: 0, clicks: 0, completes: 0, skips: 0, spendCents: 0 }
    );

    const totalMetrics: Record<string, any> = {};
    if (parsed.metrics.includes("impressions")) totalMetrics.impressions = totals.impressions;
    if (parsed.metrics.includes("clicks")) totalMetrics.clicks = totals.clicks;
    if (parsed.metrics.includes("completes")) totalMetrics.completes = totals.completes;
    if (parsed.metrics.includes("skips")) totalMetrics.skips = totals.skips;
    if (parsed.metrics.includes("spend")) totalMetrics.spend = totals.spendCents / 100;
    if (parsed.metrics.includes("ctr")) {
      totalMetrics.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
    }
    if (parsed.metrics.includes("cpm")) {
      totalMetrics.cpm = totals.impressions > 0 ? (totals.spendCents / totals.impressions * 1000) / 100 : 0;
    }

    return NextResponse.json({
      data: analyticsData,
      totals: totalMetrics,
      query: {
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        groupBy: parsed.groupBy,
        metrics: parsed.metrics,
      },
      dataPoints: analyticsData.length,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware
export const GET = createApiHandler(handleGET, {
  auth: 'both',
  roles: [UserRole.ADVERTISER, UserRole.PUBLISHER, UserRole.ADMIN],
  rateLimit: 'api',
});

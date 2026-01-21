import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/middleware";
import { UserRole, CampaignStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "@/lib/middleware";

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  budgetCents: z.number().int().min(0).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().default("UTC"),
  targetingConfig: z.record(z.any()).optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  budgetCents: z.number().int().min(0).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().optional(),
  targetingConfig: z.record(z.any()).optional(),
});

// Create campaign
async function handlePOST(req: AuthenticatedRequest) {
  try {
    const payload = await req.json();
    const parsed = createCampaignSchema.parse(payload);
    
    // Validate date range
    if (parsed.startAt && parsed.endAt) {
      const start = new Date(parsed.startAt);
      const end = new Date(parsed.endAt);
      if (start >= end) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...parsed,
        startAt: parsed.startAt ? new Date(parsed.startAt) : undefined,
        endAt: parsed.endAt ? new Date(parsed.endAt) : undefined,
        advertiserId: req.user!.id,
      },
      include: {
        creatives: {
          select: { id: true, name: true, type: true, status: true },
        },
        _count: {
          select: { events: true },
        },
      },
    });

    // Create initial version
    await prisma.campaignVersion.create({
      data: {
        campaignId: campaign.id,
        version: 1,
        name: campaign.name,
        description: campaign.description,
        budgetCents: campaign.budgetCents,
        targetingConfig: campaign.targetingConfig,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        campaign,
        message: "Campaign created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Campaign POST error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Get campaigns
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as CampaignStatus | null;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const where = {
      advertiserId: req.user!.id,
      ...(status && { status }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          creatives: {
            select: { id: true, name: true, type: true, status: true },
          },
          _count: {
            select: { events: true, creatives: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.campaign.count({ where }),
    ]);

    // Calculate performance metrics
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const metrics = await prisma.adEventRollupDaily.aggregate({
          where: { campaignId: campaign.id },
          _sum: {
            impressions: true,
            clicks: true,
            completes: true,
            spendCents: true,
          },
        });

        return {
          ...campaign,
          metrics: {
            impressions: metrics._sum.impressions || 0,
            clicks: metrics._sum.clicks || 0,
            completes: metrics._sum.completes || 0,
            spendCents: metrics._sum.spendCents || 0,
            ctr: metrics._sum.impressions 
              ? ((metrics._sum.clicks || 0) / metrics._sum.impressions * 100)
              : 0,
          },
        };
      })
    );

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Campaign GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware
export const POST = createApiHandler(handlePOST, {
  auth: 'both',
  roles: [UserRole.ADVERTISER, UserRole.ADMIN],
  rateLimit: 'api',
});

export const GET = createApiHandler(handleGET, {
  auth: 'both',
  roles: [UserRole.ADVERTISER, UserRole.ADMIN],
  rateLimit: 'api',
});

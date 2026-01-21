import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/middleware";
import { UserRole, AdType, CreativeStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "@/lib/middleware";

const createCreativeSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(AdType),
  assetUrl: z.string().url(),
  clickUrl: z.string().url().optional(),
  durationMs: z.number().int().min(0).optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  campaignId: z.string().optional(),
  parentId: z.string().optional(), // For A/B testing versions
});

const updateCreativeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.nativeEnum(CreativeStatus).optional(),
  assetUrl: z.string().url().optional(),
  clickUrl: z.string().url().optional(),
  durationMs: z.number().int().min(0).optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  campaignId: z.string().optional(),
  approvalNotes: z.string().max(1000).optional(),
});

// Create creative
async function handlePOST(req: AuthenticatedRequest) {
  try {
    const payload = await req.json();
    const parsed = createCreativeSchema.parse(payload);
    
    // Validate campaign belongs to advertiser if provided
    if (parsed.campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: parsed.campaignId, advertiserId: req.user!.id },
      });
      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found or not owned by advertiser" },
          { status: 404 }
        );
      }
    }

    // Validate parent creative for A/B testing
    if (parsed.parentId) {
      const parent = await prisma.creative.findFirst({
        where: { id: parsed.parentId, advertiserId: req.user!.id },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent creative not found" },
          { status: 404 }
        );
      }
    }

    // Determine version number
    let version = 1;
    if (parsed.parentId) {
      const maxVersion = await prisma.creative.findFirst({
        where: {
          OR: [
            { id: parsed.parentId },
            { parentId: parsed.parentId }
          ]
        },
        orderBy: { version: 'desc' },
        select: { version: true }
      });
      version = (maxVersion?.version || 0) + 1;
    }

    const creative = await prisma.creative.create({
      data: {
        ...parsed,
        version,
        advertiserId: req.user!.id,
        status: CreativeStatus.DRAFT,
      },
      include: {
        campaign: {
          select: { id: true, name: true, status: true },
        },
        parent: {
          select: { id: true, name: true, version: true },
        },
        versions: {
          select: { id: true, name: true, version: true, status: true },
        },
      },
    });

    return NextResponse.json(
      {
        creative,
        message: "Creative created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Creative POST error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Get creatives
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as CreativeStatus | null;
    const campaignId = url.searchParams.get("campaignId");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const where = {
      advertiserId: req.user!.id,
      ...(status && { status }),
      ...(campaignId && { campaignId }),
    };

    const [creatives, total] = await Promise.all([
      prisma.creative.findMany({
        where,
        include: {
          campaign: {
            select: { id: true, name: true, status: true },
          },
          parent: {
            select: { id: true, name: true, version: true },
          },
          versions: {
            select: { id: true, name: true, version: true, status: true },
          },
          _count: {
            select: { events: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.creative.count({ where }),
    ]);

    // Calculate performance metrics
    const creativesWithMetrics = await Promise.all(
      creatives.map(async (creative) => {
        const metrics = await prisma.adEventRollupDaily.aggregate({
          where: { creativeId: creative.id },
          _sum: {
            impressions: true,
            clicks: true,
            completes: true,
            spendCents: true,
          },
        });

        return {
          ...creative,
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
      creatives: creativesWithMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Creative GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware
export const POST = createApiHandler(handlePOST, {
  auth: 'both',
  roles: [UserRole.ADVERTISER, UserRole.ADMIN],
  rateLimit: 'upload',
});

export const GET = createApiHandler(handleGET, {
  auth: 'both',
  roles: [UserRole.ADVERTISER, UserRole.ADMIN],
  rateLimit: 'api',
});

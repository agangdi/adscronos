import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/middleware';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '@/lib/middleware';

const createCreativeSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['IMAGE', 'VIDEO', 'TEXT', 'HTML']),
  assetUrl: z.string().url(),
  clickUrl: z.string().url().optional(),
  durationMs: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  campaignId: z.string().min(1), // Accept any string ID (cuid or uuid)
  version: z.number().int().min(1).default(1),
  parentId: z.string().min(1).optional(), // Accept any string ID
});

const updateCreativeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  assetUrl: z.string().url().optional(),
  clickUrl: z.string().url().optional(),
  durationMs: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional(),
  version: z.number().int().min(1).optional(),
  parentId: z.string().min(1).optional(), // Accept any string ID
});

// Create creative
async function handlePOST(req: AuthenticatedRequest) {
  try {
    const payload = await req.json();
    const parsed = createCreativeSchema.parse(payload);
    
    // Verify campaign belongs to this advertiser
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: parsed.campaignId,
        advertiserId: req.user!.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    const creative = await prisma.creative.create({
      data: {
        ...parsed,
        advertiserId: req.user!.id,
        status: 'APPROVED',
      },
      include: {
        campaign: {
          select: { id: true, name: true },
        },
        _count: {
          select: { events: true },
        },
      },
    });

    return NextResponse.json({
      message: "Creative created successfully",
      creative,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Creative creation error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Get creatives for advertiser
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {
      advertiserId: req.user!.id,
    };

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (status) {
      where.status = status;
    }

    const [creatives, total] = await Promise.all([
      prisma.creative.findMany({
        where,
        include: {
          campaign: {
            select: { id: true, name: true },
          },
          _count: {
            select: { events: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.creative.count({ where }),
    ]);

    // Get performance metrics for each creative
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

        const impressions = metrics._sum.impressions || 0;
        const clicks = metrics._sum.clicks || 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        return {
          ...creative,
          metrics: {
            impressions,
            clicks,
            ctr: parseFloat(ctr.toFixed(2)),
            spendCents: metrics._sum.spendCents || 0,
          },
        };
      })
    );

    return NextResponse.json({
      creatives: creativesWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Creatives GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware - only advertisers can access
export const POST = createApiHandler(handlePOST, {
  auth: 'role-specific',
  specificRole: UserRole.ADVERTISER,
  rateLimit: 'api',
});

export const GET = createApiHandler(handleGET, {
  auth: 'role-specific',
  specificRole: UserRole.ADVERTISER,
  rateLimit: 'api',
});

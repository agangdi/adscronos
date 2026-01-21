import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/middleware";
import { UserRole, BillingStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "@/lib/middleware";

const createBillingSchema = z.object({
  amountCents: z.number().int().min(1),
  currency: z.string().length(3).default("USD"),
  description: z.string().max(500).optional(),
  dueDate: z.string().datetime().optional(),
  paymentMethod: z.string().max(100).optional(),
});

const updateBillingSchema = z.object({
  status: z.nativeEnum(BillingStatus).optional(),
  paymentMethod: z.string().max(100).optional(),
  transactionId: z.string().max(255).optional(),
  invoiceUrl: z.string().url().optional(),
});

// Create billing record
async function handlePOST(req: AuthenticatedRequest) {
  try {
    const payload = await req.json();
    const parsed = createBillingSchema.parse(payload);

    // Only admins can create billing records
    if (req.user!.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { targetUserId, targetUserType } = payload;

    if (!targetUserId || !targetUserType) {
      return NextResponse.json(
        { error: "Target user ID and type are required" },
        { status: 400 }
      );
    }

    // Validate target user exists
    if (targetUserType === "advertiser") {
      const advertiser = await prisma.advertiser.findUnique({
        where: { id: targetUserId },
      });
      if (!advertiser) {
        return NextResponse.json(
          { error: "Advertiser not found" },
          { status: 404 }
        );
      }
    } else if (targetUserType === "publisher") {
      const publisher = await prisma.publisher.findUnique({
        where: { id: targetUserId },
      });
      if (!publisher) {
        return NextResponse.json(
          { error: "Publisher not found" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid target user type" },
        { status: 400 }
      );
    }

    const billing = await prisma.billing.create({
      data: {
        ...parsed,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
        ...(targetUserType === "advertiser" 
          ? { advertiserId: targetUserId }
          : { publisherId: targetUserId }
        ),
      },
    });

    return NextResponse.json(
      {
        billing,
        message: "Billing record created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Billing POST error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Get billing records
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as BillingStatus | null;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let where: Record<string, unknown> = {};

    // Role-based filtering
    if (req.user!.role === UserRole.ADVERTISER) {
      where.advertiserId = req.user!.id;
    } else if (req.user!.role === UserRole.PUBLISHER) {
      where.publisherId = req.user!.id;
    }
    // Admins can see all billing records

    if (status) {
      where.status = status;
    }

    const [billings, total] = await Promise.all([
      prisma.billing.findMany({
        where,
        include: {
          advertiser: {
            select: { id: true, name: true, authEmail: true },
          },
          publisher: {
            select: { id: true, siteName: true, authEmail: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.billing.count({ where }),
    ]);

    return NextResponse.json({
      billings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware
export const POST = createApiHandler(handlePOST, {
  auth: 'both',
  roles: [UserRole.ADMIN],
  rateLimit: 'api',
});

export const GET = createApiHandler(handleGET, {
  auth: 'both',
  roles: [UserRole.ADVERTISER, UserRole.PUBLISHER, UserRole.ADMIN],
  rateLimit: 'api',
});

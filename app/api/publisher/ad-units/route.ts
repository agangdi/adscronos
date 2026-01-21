import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/middleware";
import { UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "@/lib/middleware";

const createAdUnitSchema = z.object({
  key: z.string().min(1),
  adType: z.enum(["VIDEO", "IMAGE", "TEXT", "HTML"]),
  description: z.string().optional(),
});

// Create ad unit
async function handlePOST(req: AuthenticatedRequest) {
  try {
    const payload = await req.json();
    const parsed = createAdUnitSchema.parse(payload);
    
    // Check if key already exists for this publisher
    const existingUnit = await prisma.adUnit.findFirst({
      where: { publisherId: req.user!.id, key: parsed.key },
    });
    
    if (existingUnit) {
      return NextResponse.json({ error: "Ad unit key already exists" }, { status: 400 });
    }

    const adUnit = await prisma.adUnit.create({
      data: {
        ...parsed,
        publisherId: req.user!.id,
      },
    });

    return NextResponse.json(
      {
        adUnit,
        message: "Ad unit created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("ad-unit POST error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Get ad units
async function handleGET(req: AuthenticatedRequest) {
  try {
    const adUnits = await prisma.adUnit.findMany({
      where: { publisherId: req.user!.id },
      include: {
        _count: {
          select: { events: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ adUnits });
  } catch (error) {
    console.error("ad-unit GET error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware - only publishers can access
export const POST = createApiHandler(handlePOST, {
  auth: 'role-specific',
  specificRole: UserRole.PUBLISHER,
  rateLimit: 'api',
});

export const GET = createApiHandler(handleGET, {
  auth: 'role-specific',
  specificRole: UserRole.PUBLISHER,
  rateLimit: 'api',
});

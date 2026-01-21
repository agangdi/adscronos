import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createAdUnitSchema = z.object({
  key: z.string().min(1),
  adType: z.enum(["VIDEO", "IMAGE", "TEXT", "HTML"]),
  description: z.string().optional(),
});

const authSchema = z.object({
  appId: z.string(),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { appId, ...adUnitData } = payload;
    
    // Validate auth
    const auth = authSchema.parse({ appId });
    const publisher = await prisma.publisher.findUnique({
      where: { appId: auth.appId },
    });
    
    if (!publisher) {
      return NextResponse.json({ error: "Invalid app ID" }, { status: 401 });
    }

    // Validate ad unit data
    const parsed = createAdUnitSchema.parse(adUnitData);
    
    // Check if key already exists for this publisher
    const existingUnit = await prisma.adUnit.findFirst({
      where: { publisherId: publisher.id, key: parsed.key },
    });
    
    if (existingUnit) {
      return NextResponse.json({ error: "Ad unit key already exists" }, { status: 400 });
    }

    const adUnit = await prisma.adUnit.create({
      data: {
        ...parsed,
        publisherId: publisher.id,
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");
    
    if (!appId) {
      return NextResponse.json({ error: "App ID required" }, { status: 401 });
    }

    const publisher = await prisma.publisher.findUnique({
      where: { appId },
    });
    
    if (!publisher) {
      return NextResponse.json({ error: "Invalid app ID" }, { status: 401 });
    }

    const adUnits = await prisma.adUnit.findMany({
      where: { publisherId: publisher.id },
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

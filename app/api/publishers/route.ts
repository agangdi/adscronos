import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { newId, newToken } from "@/lib/ids";
import { publisherSchema } from "@/lib/types";

export async function GET() {
  try {
    const publishers = await prisma.publisher.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        siteName: true,
        domain: true,
        appId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ publishers });
  } catch (error) {
    console.error("publishers GET error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = publisherSchema.parse(payload);
    const primaryType = parsed.supportedTypes[0]?.toUpperCase() || "VIDEO";
    const publisher = await prisma.publisher.create({
      data: {
        siteName: parsed.siteName,
        domain: parsed.domain,
        appId: newId("app"),
        apiKey: newToken("pub"),
        adUnits: {
          create: {
            key: "default",
            adType: primaryType as any,
            description: "Default ad unit",
          },
        },
      },
      include: { adUnits: true },
    });

    const sdkUrl = process.env.NEXT_PUBLIC_SDK_URL ?? "https://your-domain.com/sdk/ad-sdk.js";
    const defaultAdUnit = publisher.adUnits[0];

    return NextResponse.json(
      {
        publisher,
        embedSnippet: `<script src="${sdkUrl}" data-app-id="${publisher.appId}" data-ad-unit="${defaultAdUnit?.id}" async></script>`,
        message: "Publisher created. Insert embedSnippet on your site.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("publisher POST error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

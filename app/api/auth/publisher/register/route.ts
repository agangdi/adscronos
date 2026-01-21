import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { newId, newToken } from "@/lib/ids";

const schema = z.object({
  siteName: z.string().min(2),
  domain: z.string().url(),
  authEmail: z.string().email(),
  password: z.string().min(8),
  webhookUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = schema.parse(payload);
    const hash = await bcrypt.hash(parsed.password, 10);

    const publisher = await prisma.publisher.create({
      data: {
        siteName: parsed.siteName,
        domain: parsed.domain,
        authEmail: parsed.authEmail,
        passwordHash: hash,
        webhookUrl: parsed.webhookUrl,
        webhookSecret: parsed.webhookUrl ? newToken("whsec") : null,
        appId: newId("app"),
        apiKey: newToken("pub"),
        adUnits: {
          create: {
            key: "default",
            adType: "VIDEO",
            description: "Default ad unit",
          },
        },
      },
      include: { adUnits: true },
    });

    return NextResponse.json({ publisher }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("publisher register error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

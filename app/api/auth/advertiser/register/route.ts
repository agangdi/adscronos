import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/ids";

const schema = z.object({
  name: z.string().min(2),
  authEmail: z.string().email(),
  contactEmail: z.string().email(),
  password: z.string().min(8),
  website: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = schema.parse(payload);
    const hash = await bcrypt.hash(parsed.password, 10);

    const advertiser = await prisma.advertiser.create({
      data: {
        name: parsed.name,
        authEmail: parsed.authEmail,
        contactEmail: parsed.contactEmail,
        website: parsed.website,
        passwordHash: hash,
        apiKey: newToken("adv"),
      },
    });

    return NextResponse.json({ advertiser }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("advertiser register error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

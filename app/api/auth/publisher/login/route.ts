import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/ids";

const schema = z.object({
  authEmail: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = schema.parse(payload);

    const publisher = await prisma.publisher.findUnique({
      where: { authEmail: parsed.authEmail },
    });
    if (!publisher) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(parsed.password, publisher.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const sessionToken = newToken("pubsess");
    return NextResponse.json({
      sessionToken,
      publisherId: publisher.id,
      appId: publisher.appId,
      apiKey: publisher.apiKey,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("publisher login error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

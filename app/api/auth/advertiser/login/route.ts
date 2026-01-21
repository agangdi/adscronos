import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const schema = z.object({
  authEmail: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = schema.parse(payload);

    const advertiser = await prisma.advertiser.findUnique({
      where: { authEmail: parsed.authEmail },
    });
    if (!advertiser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValidPassword = await AuthService.verifyPassword(parsed.password, advertiser.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session with JWT tokens
    const sessionData = await AuthService.createSession(
      advertiser.id,
      UserRole.ADVERTISER,
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ 
      accessToken: sessionData.accessToken, 
      refreshToken: sessionData.refreshToken,
      user: {
        id: advertiser.id,
        email: advertiser.authEmail,
        name: advertiser.name,
        role: UserRole.ADVERTISER
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("advertiser login error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

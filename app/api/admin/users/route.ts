import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/middleware";
import { UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "@/lib/middleware";

// Get all users (admin only)
async function handleGET(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role") as UserRole | null;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get advertisers
    const advertisers = await prisma.advertiser.findMany({
      where: role === UserRole.ADVERTISER ? { role: UserRole.ADVERTISER } : undefined,
      select: {
        id: true,
        authEmail: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { campaigns: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: role === UserRole.ADVERTISER ? limit : undefined,
      skip: role === UserRole.ADVERTISER ? offset : undefined,
    });

    // Get publishers
    const publishers = await prisma.publisher.findMany({
      where: role === UserRole.PUBLISHER ? { role: UserRole.PUBLISHER } : undefined,
      select: {
        id: true,
        authEmail: true,
        siteName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { adUnits: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: role === UserRole.PUBLISHER ? limit : undefined,
      skip: role === UserRole.PUBLISHER ? offset : undefined,
    });

    // Combine and format users
    const users = [
      ...advertisers.map(user => ({
        ...user,
        type: 'advertiser' as const,
        displayName: user.name,
        resourceCount: user._count.campaigns
      })),
      ...publishers.map(user => ({
        ...user,
        type: 'publisher' as const,
        displayName: user.siteName,
        resourceCount: user._count.adUnits
      }))
    ];

    // Sort by creation date if no role filter
    if (!role) {
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = users.length;
    const paginatedUsers = role ? users : users.slice(offset, offset + limit);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware - only admins can access
export const GET = createApiHandler(handleGET, {
  auth: 'role-specific',
  specificRole: UserRole.ADMIN,
  rateLimit: 'api',
});

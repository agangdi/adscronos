import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { AuthService } from '@/lib/auth';

// Delete creative - Direct implementation without middleware wrapper
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    
    if (!payload || payload.role !== UserRole.ADVERTISER) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Await params in Next.js 15+
    const { id: creativeId } = await params;

    // Verify creative belongs to this advertiser
    const creative = await prisma.creative.findFirst({
      where: {
        id: creativeId,
        advertiserId: payload.userId,
      },
    });

    if (!creative) {
      return NextResponse.json(
        { error: "Creative not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the creative
    await prisma.creative.delete({
      where: { id: creativeId },
    });

    return NextResponse.json({
      message: "Creative deleted successfully",
    });
  } catch (error) {
    console.error("Creative deletion error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

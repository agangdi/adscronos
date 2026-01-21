import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/middleware';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '@/lib/middleware';

// Get billing information for advertiser
async function handleGET(req: AuthenticatedRequest) {
  try {
    // Get billing records
    const records = await prisma.billing.findMany({
      where: {
        advertiserId: req.user!.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 records
    });

    // Calculate total spend
    const totalSpendResult = await prisma.billing.aggregate({
      where: {
        advertiserId: req.user!.id,
        status: 'PAID',
      },
      _sum: {
        amountCents: true,
      },
    });

    // Calculate current balance (pending payments)
    const currentBalanceResult = await prisma.billing.aggregate({
      where: {
        advertiserId: req.user!.id,
        status: 'PENDING',
      },
      _sum: {
        amountCents: true,
      },
    });

    // Find next payment date
    const nextPayment = await prisma.billing.findFirst({
      where: {
        advertiserId: req.user!.id,
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    const totalSpend = totalSpendResult._sum.amountCents || 0;
    const currentBalance = currentBalanceResult._sum.amountCents || 0;
    const nextPaymentDate = nextPayment?.dueDate || null;

    return NextResponse.json({
      records: records.map(record => ({
        id: record.id,
        amountCents: record.amountCents,
        status: record.status,
        description: record.description || 'Ad Campaign Charges',
        createdAt: record.createdAt.toISOString(),
        dueDate: record.dueDate.toISOString(),
      })),
      totalSpend,
      currentBalance,
      nextPaymentDate: nextPaymentDate?.toISOString() || null,
    });
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware - only advertisers can access
export const GET = createApiHandler(handleGET, {
  auth: 'role-specific',
  specificRole: UserRole.ADVERTISER,
  rateLimit: 'api',
});

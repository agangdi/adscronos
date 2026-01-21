import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface UsageStats {
  userId: string;
  period: string;
  resourcesAccessed: number;
  totalSpent: number;
  adsViewed: number;
  averageViewDuration: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  billingHistory: Array<{
    date: string;
    amount: number;
    resourceTitle: string;
    transactionId: string;
  }>;
}

async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'month';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get user's resource accesses
    const resourceAccesses = await prisma.resourceAccess?.findMany({
      where: {
        userId: userId,
        accessedAt: {
          gte: startDate,
        },
      },
      include: {
        resource: true,
        session: {
          include: {
            adCompletion: true,
          },
        },
      },
    }) || [];

    // Get completed ad sessions for this user
    const completedAdSessions = await prisma.adSession?.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
        },
        adCompletion: {
          completed: true,
        },
      },
      include: {
        adCompletion: true,
        resource: true,
      },
    }) || [];

    // Calculate statistics
    const resourcesAccessed = resourceAccesses.length;
    const adsViewed = completedAdSessions.length;
    
    const totalSpent = completedAdSessions.reduce((sum, session) => {
      return sum + (session.adCompletion?.billingAmount || 0);
    }, 0);

    const totalViewDuration = completedAdSessions.reduce((sum, session) => {
      return sum + (session.adCompletion?.viewDuration || 0);
    }, 0);
    
    const averageViewDuration = adsViewed > 0 ? totalViewDuration / adsViewed : 0;

    // Calculate top categories
    const categoryCount: Record<string, number> = {};
    resourceAccesses.forEach(access => {
      const category = access.resource.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get billing history
    const billingHistory = completedAdSessions
      .filter(session => session.adCompletion?.paymentProcessed)
      .map(session => ({
        date: session.adCompletion?.completedAt?.toISOString() || '',
        amount: session.adCompletion?.billingAmount || 0,
        resourceTitle: session.resource.title,
        transactionId: session.adCompletion?.transactionId || '',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const usageStats: UsageStats = {
      userId,
      period,
      resourcesAccessed,
      totalSpent,
      adsViewed,
      averageViewDuration,
      topCategories,
      billingHistory,
    };

    return NextResponse.json(usageStats);

  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}

export { GET };

export const dynamic = 'force-dynamic';

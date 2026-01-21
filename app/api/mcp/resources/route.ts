import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const resources = await prisma.premiumResource.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        isPublic: true,
        adRequirement: true,
        estimatedReadTime: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      resources: resources.map((r: {
        id: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        adRequirement: unknown;
        estimatedReadTime: number;
      }) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        tags: r.tags,
        requiresPayment: !r.isPublic || !!r.adRequirement,
        estimatedReadTime: r.estimatedReadTime,
      })),
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

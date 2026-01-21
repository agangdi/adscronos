import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
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
        previewContent: true,
        estimatedReadTime: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      content: [
        {
          type: 'text',
          text: `Found ${resources.length} premium resources`,
        },
      ],
      structuredContent: {
        resources: resources.map((r: {
          id: string;
          title: string;
          description: string;
          category: string;
          tags: string[];
          isPublic: boolean;
          adRequirement: unknown;
          previewContent: string;
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
      },
      _meta: {
        'openai/outputTemplate': 'ui://widget/mcp-widget.html',
      },
    });
  } catch (error) {
    console.error('Error listing resources:', error);
    return NextResponse.json(
      {
        content: [{ type: 'text', text: 'Failed to list resources' }],
        isError: true,
      },
      { status: 500 }
    );
  }
}

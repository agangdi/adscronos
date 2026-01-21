import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { X402Client } from '@/lib/x402-client';
import { MCP_CONFIG } from '@/lib/mcp-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, resourceId, userId, paymentHeader } = body;

    if (!sessionId || !resourceId || !userId || !paymentHeader) {
      return NextResponse.json(
        {
          content: [{ type: 'text', text: 'Missing required parameters' }],
          isError: true,
        },
        { status: 400 }
      );
    }

    const session = await prisma.adSession.findUnique({
      where: { id: sessionId },
      include: {
        resource: {
          include: {
            content: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          content: [{ type: 'text', text: 'Session not found' }],
          isError: true,
        },
        { status: 404 }
      );
    }

    const resource = session.resource;

    const adReq = resource.adRequirement as { cost?: string } | null;
    const paymentAmount = adReq?.cost || MCP_CONFIG.payment.defaultPrice;

    const paymentRequirements = {
      scheme: 'exact',
      network: MCP_CONFIG.x402.network,
      payTo: MCP_CONFIG.x402.sellerWallet,
      asset: MCP_CONFIG.x402.usdxContract,
      description: `Access to premium content: ${resource.title}`,
      mimeType: 'application/json',
      maxAmountRequired: paymentAmount,
      maxTimeoutSeconds: MCP_CONFIG.payment.timeout,
    };

    const x402Client = new X402Client(MCP_CONFIG.x402.facilitatorUrl);

    const verifyResult = await x402Client.verify(
      paymentHeader,
      paymentRequirements
    );

    if (!verifyResult.isValid) {
      return NextResponse.json(
        {
          content: [
            {
              type: 'text',
              text: `Payment verification failed: ${verifyResult.invalidReason}`,
            },
          ],
          isError: true,
        },
        { status: 402 }
      );
    }

    const settleResult = await x402Client.settle(
      paymentHeader,
      paymentRequirements
    );

    if (settleResult.event !== 'payment.settled') {
      return NextResponse.json(
        {
          content: [
            {
              type: 'text',
              text: `Payment settlement failed: ${settleResult.error}`,
            },
          ],
          isError: true,
        },
        { status: 402 }
      );
    }

    await prisma.adCompletion.create({
      data: {
        sessionId,
        completed: true,
        viewDuration: session.requiredViewDuration,
        paymentProcessed: true,
        billingAmount: parseFloat(paymentAmount) / 1000000,
        transactionId: settleResult.txHash || '',
        completedAt: new Date(),
      },
    });

    await prisma.resourceAccess.create({
      data: {
        resourceId,
        sessionId,
        userId,
        accessMethod: 'AD_COMPLETION',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'AD_COMPLETED',
        creativeId: session.adId,
        metadata: {
          sessionId,
          paymentTxHash: settleResult.txHash,
          resourceId,
        },
      },
    });

    return NextResponse.json({
      content: [
        {
          type: 'text',
          text: `Payment successful! Access granted to: ${resource.title}`,
        },
      ],
      structuredContent: {
        resourceId: resource.id,
        title: resource.title,
        paymentCompleted: true,
        txHash: settleResult.txHash,
      },
      _meta: {
        content: resource.content?.fullContent || resource.previewContent,
        payment: {
          txHash: settleResult.txHash,
          from: settleResult.from,
          to: settleResult.to,
          value: settleResult.value,
          blockNumber: settleResult.blockNumber,
          timestamp: settleResult.timestamp,
        },
        'openai/outputTemplate': 'ui://widget/mcp-widget.html',
      },
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json(
      {
        content: [
          {
            type: 'text',
            text: `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const toolRequestSchema = z.object({
  resourceId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

const paymentVerificationSchema = z.object({
  resourceId: z.string(),
  adEventId: z.string(),
  signature: z.string(),
});

// Mock premium resources - in real app, this would be a database or external service
const PREMIUM_RESOURCES = {
  "premium-analysis-1": {
    id: "premium-analysis-1",
    title: "Advanced Market Analysis Report",
    description: "Comprehensive market analysis with AI insights",
    costCents: 500, // $5.00
    content: {
      summary: "This premium analysis reveals key market trends...",
      data: {
        marketGrowth: "15.2%",
        keyTrends: ["AI adoption", "Remote work", "Sustainability"],
        recommendations: [
          "Invest in AI infrastructure",
          "Focus on remote-first solutions",
          "Prioritize sustainable practices"
        ]
      }
    }
  },
  "premium-template-1": {
    id: "premium-template-1", 
    title: "Professional Business Plan Template",
    description: "Comprehensive business plan template with examples",
    costCents: 1000, // $10.00
    content: {
      sections: [
        "Executive Summary",
        "Market Analysis", 
        "Financial Projections",
        "Marketing Strategy"
      ],
      downloadUrl: "https://example.com/business-plan-template.docx"
    }
  }
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const action = payload.action;

    if (action === "request-resource") {
      return handleResourceRequest(payload);
    } else if (action === "verify-payment") {
      return handlePaymentVerification(payload);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("ChatGPT tool error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

async function handleResourceRequest(payload: any) {
  const parsed = toolRequestSchema.parse(payload);
  const resource = PREMIUM_RESOURCES[parsed.resourceId as keyof typeof PREMIUM_RESOURCES];
  
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  // Check if user has already paid for this resource
  // In real app, check user's payment history or subscription status
  const hasAccess = false; // Mock - always require payment for demo

  if (hasAccess) {
    return NextResponse.json({
      status: "granted",
      resource: resource.content,
      message: "Access granted - resource unlocked"
    });
  }

  // Require ad view payment
  return NextResponse.json({
    status: "payment_required",
    resource: {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      costCents: resource.costCents,
    },
    paywall: {
      type: "ad_view",
      message: "Watch a short ad to unlock this premium content",
      adConfig: {
        type: "video",
        adUnitId: "chatgpt-paywall",
        durationMs: 15000, // 15 second ad
      }
    }
  });
}

async function handlePaymentVerification(payload: any) {
  const parsed = paymentVerificationSchema.parse(payload);
  
  // Verify the ad event exists and was completed
  const adEvent = await prisma.adEvent.findUnique({
    where: { id: parsed.adEventId },
    include: {
      publisher: true,
    }
  });

  if (!adEvent) {
    return NextResponse.json({ error: "Ad event not found" }, { status: 404 });
  }

  // Verify the event was a completion (not skip)
  if (adEvent.eventType !== "COMPLETE") {
    return NextResponse.json({ 
      error: "Ad was not completed",
      status: "incomplete_ad" 
    }, { status: 400 });
  }

  // Verify the signature (basic check - in real app, use proper HMAC verification)
  const expectedSignature = `${parsed.resourceId}-${parsed.adEventId}`;
  if (parsed.signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Get the resource
  const resource = PREMIUM_RESOURCES[parsed.resourceId as keyof typeof PREMIUM_RESOURCES];
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  // Record the payment/unlock event
  await prisma.ledgerEntry.create({
    data: {
      eventId: adEvent.id,
      publisherId: adEvent.publisherId,
      amountCents: resource.costCents,
      currency: "USD",
      direction: "CREDIT",
      description: `ChatGPT tool unlock: ${resource.title}`,
    }
  });

  // Return the unlocked content
  return NextResponse.json({
    status: "unlocked",
    resource: resource.content,
    message: "Content unlocked! Thank you for watching the ad.",
    payment: {
      amountCents: resource.costCents,
      currency: "USD",
      method: "ad_view"
    }
  });
}

// GET endpoint for resource catalog
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "catalog") {
    const catalog = Object.values(PREMIUM_RESOURCES).map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      costCents: resource.costCents,
    }));

    return NextResponse.json({ resources: catalog });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

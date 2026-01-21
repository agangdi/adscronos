import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { adEventSchema } from "@/lib/types";
import { deliverWebhook, signPayload } from "@/lib/webhook";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = adEventSchema.parse(payload);
    const publisher = await prisma.publisher.findUnique({
      where: { appId: parsed.appId },
    });
    if (!publisher) {
      return NextResponse.json({ error: "Unknown appId" }, { status: 404 });
    }

    const adUnit = await prisma.adUnit.findFirst({
      where: { id: parsed.adUnitId, publisherId: publisher.id },
    });
    if (!adUnit) {
      return NextResponse.json({ error: "Ad unit not found for publisher" }, { status: 404 });
    }

    const eventTypeMap: Record<string, string> = {
      impression: "IMPRESSION",
      start: "START",
      firstQuartile: "FIRST_QUARTILE",
      midpoint: "MIDPOINT",
      thirdQuartile: "THIRD_QUARTILE",
      complete: "COMPLETE",
      skip: "SKIP",
      click: "CLICK",
    };

    const event = await prisma.adEvent.create({
      data: {
        eventType: eventTypeMap[parsed.event] as any,
        publisherId: publisher.id,
        adUnitId: adUnit.id,
        requestId: parsed.signature ? parsed.signature : undefined,
        signature: parsed.signature,
        ts: parsed.ts ? new Date(parsed.ts) : undefined,
      },
    });

    if (publisher.webhookUrl && publisher.webhookSecret) {
      const webhookPayload = {
        id: event.id,
        type: parsed.event,
        publisherId: publisher.id,
        adUnitId: adUnit.id,
        appId: parsed.appId,
        ts: parsed.ts || Date.now(),
      };

      const timestamp = Date.now();
      const nonce = crypto.randomUUID();
      const signature = signPayload(publisher.webhookSecret, JSON.stringify(webhookPayload), timestamp, nonce);

      const delivery = await prisma.webhookDelivery.create({
        data: {
          publisherId: publisher.id,
          eventId: event.id,
          targetUrl: publisher.webhookUrl,
          payload: webhookPayload,
          signature,
          status: "PENDING",
          nextAttemptAt: new Date(),
        },
      });

      // fire-and-forget dispatch attempt
      deliverWebhook(delivery.id).catch((err) => {
        console.error("webhook delivery failed", err);
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("events POST error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function GET() {
  const data = await prisma.adEvent.findMany({
    orderBy: { ts: "desc" },
    take: 100,
  });
  return NextResponse.json({ events: data });
}

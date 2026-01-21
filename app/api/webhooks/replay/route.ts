import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { deliverWebhook } from "@/lib/webhook";

const bodySchema = z.object({
  id: z.string().min(3),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { id } = bodySchema.parse(json);

    const exists = await prisma.webhookDelivery.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({ error: "delivery not found" }, { status: 404 });
    }

    const result = await deliverWebhook(id);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("webhook replay error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function GET() {
  const deliveries = await prisma.webhookDelivery.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ deliveries });
}

import crypto from "crypto";

import { prisma } from "./prisma";

type DeliverResult = {
  status: "SUCCESS" | "FAILED";
  responseStatus?: number;
  error?: string;
};

export function signPayload(secret: string, payload: string, timestamp: number, nonce: string) {
  const base = `${timestamp}.${nonce}.${payload}`;
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}

export async function deliverWebhook(deliveryId: string): Promise<DeliverResult> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { publisher: true },
  });
  if (!delivery) {
    return { status: "FAILED", error: "delivery not found" };
  }
  if (!delivery.publisher.webhookUrl || !delivery.publisher.webhookSecret) {
    return { status: "FAILED", error: "publisher missing webhook config" };
  }

  const payload = JSON.stringify(delivery.payload);
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const signature = signPayload(delivery.publisher.webhookSecret, payload, timestamp, nonce);

  try {
    const res = await fetch(delivery.publisher.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-timestamp": String(timestamp),
        "x-webhook-nonce": nonce,
        "x-webhook-signature": signature,
      },
      body: payload,
      redirect: "follow",
    });

    const ok = res.ok;
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: ok ? "SUCCESS" : "FAILED",
        responseStatus: res.status,
        signature,
        attempt: delivery.attempt + 1,
        updatedAt: new Date(),
      },
    });

    return { status: ok ? "SUCCESS" : "FAILED", responseStatus: res.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        responseStatus: undefined,
        error: message,
        attempt: delivery.attempt + 1,
        nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    return { status: "FAILED", error: message };
  }
}

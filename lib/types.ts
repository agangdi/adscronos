import { z } from "zod";

export const adTypeEnum = z.enum(["video", "image", "text", "html"]);

export const advertiserSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email(),
  website: z.string().url().optional(),
});

export const publisherSchema = z.object({
  siteName: z.string().min(2),
  domain: z.string().url(),
  supportedTypes: z.array(adTypeEnum).min(1),
});

export const adEventSchema = z.object({
  appId: z.string().min(4),
  adUnitId: z.string().min(2),
  event: z.enum([
    "impression",
    "start",
    "firstQuartile",
    "midpoint",
    "thirdQuartile",
    "complete",
    "skip",
    "click",
  ]),
  ts: z.number().int().optional(),
  signature: z.string().optional(),
});

export type AdvertiserInput = z.infer<typeof advertiserSchema>;
export type PublisherInput = z.infer<typeof publisherSchema>;
export type AdEventInput = z.infer<typeof adEventSchema>;

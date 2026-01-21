import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/middleware';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '@/lib/middleware';

const updateSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  authEmail: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  timezone: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    campaignUpdates: z.boolean(),
    billingAlerts: z.boolean(),
    performanceReports: z.boolean(),
  }).optional(),
});

// Get advertiser settings
async function handleGET(req: AuthenticatedRequest) {
  try {
    const advertiser = await prisma.advertiser.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        authEmail: true,
        website: true,
        contactEmail: true,
        timezone: true,
      },
    });

    if (!advertiser) {
      return NextResponse.json({ error: "Advertiser not found" }, { status: 404 });
    }

    // Default notification settings (since we don't have a notifications table yet)
    const defaultNotifications = {
      email: true,
      campaignUpdates: true,
      billingAlerts: true,
      performanceReports: false,
    };

    return NextResponse.json({
      ...advertiser,
      notifications: defaultNotifications,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Update advertiser settings
async function handlePUT(req: AuthenticatedRequest) {
  try {
    const payload = await req.json();
    const parsed = updateSettingsSchema.parse(payload);

    // Extract notifications for separate handling (if we had a notifications table)
    const { notifications, ...advertiserData } = parsed;

    // Update advertiser data
    const updatedAdvertiser = await prisma.advertiser.update({
      where: { id: req.user!.id },
      data: {
        ...advertiserData,
        website: advertiserData.website || null,
        contactEmail: advertiserData.contactEmail || null,
      },
      select: {
        id: true,
        name: true,
        authEmail: true,
        website: true,
        contactEmail: true,
        timezone: true,
      },
    });

    // TODO: Save notification preferences to a separate table when implemented
    // For now, we'll just return the updated advertiser data with the notifications

    return NextResponse.json({
      message: "Settings updated successfully",
      advertiser: {
        ...updatedAdvertiser,
        notifications: notifications || {
          email: true,
          campaignUpdates: true,
          billingAlerts: true,
          performanceReports: false,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Export handlers with middleware - only advertisers can access
export const GET = createApiHandler(handleGET, {
  auth: 'role-specific',
  specificRole: UserRole.ADVERTISER,
  rateLimit: 'api',
});

export const PUT = createApiHandler(handlePUT, {
  auth: 'role-specific',
  specificRole: UserRole.ADVERTISER,
  rateLimit: 'api',
});
